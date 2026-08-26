#!/usr/bin/env bash
set -euo pipefail

APP_BUNDLE="app.fillmymap.mobile"
SIMULATOR_UDID="${1:-}"
if [[ -z "$SIMULATOR_UDID" ]]; then
  SIMULATOR_UDID="$(xcrun simctl list devices booted | rg -o '[0-9A-Fa-f-]{36}' | head -1)"
fi
if [[ ! "$SIMULATOR_UDID" =~ ^[0-9A-Fa-f-]{36}$ ]]; then
  echo "Boot one iPhone Simulator or pass its UDID."
  exit 1
fi

SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_DIR="$(mktemp -d -t fill-my-map-ui-tests)"
case "$TEST_DIR" in
  /tmp/*|/private/tmp/*|/var/folders/*) ;;
  *) echo "Unexpected temporary directory: $TEST_DIR"; exit 1 ;;
esac
cleanup() {
  xcrun simctl location "$SIMULATOR_UDID" clear >/dev/null 2>&1 || true
  rm -rf -- "$TEST_DIR"
}
trap cleanup EXIT

DATA_DIR="$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_BUNDLE" data 2>/dev/null || true)"
if [[ -z "$DATA_DIR" ]]; then
  echo "Install the Release app on simulator $SIMULATOR_UDID first."
  exit 1
fi
cp "$SOURCE_DIR/FillMyMapUITests.swift" "$SOURCE_DIR/generate.rb" "$TEST_DIR/"
cd "$TEST_DIR"
GEM_HOME="$(brew --prefix cocoapods)/libexec" ruby generate.rb

run_test() {
  echo "iOS UI: $1"
  xcodebuild test -quiet \
    -project FillMyMapUITests.xcodeproj \
    -scheme FillMyMapUITests \
    -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" \
    -derivedDataPath DerivedData \
    "-only-testing:FillMyMapUITests/FillMyMapUITests/$1"
}
assert_sql() {
  local query="$1" expected="$2" label="$3" actual
  actual="$(sqlite3 "$DATA_DIR/Documents/SQLite/fill-my-map.sqlite" "$query")"
  if [[ "$actual" != "$expected" ]]; then
    echo "$label: expected $expected, got $actual"
    exit 1
  fi
}

run_test testLaunchesInstalledApp
run_test testResetAllData
xcrun simctl privacy "$SIMULATOR_UDID" reset location "$APP_BUNDLE"
run_test testLocationPermissionCanBeDenied
xcrun simctl privacy "$SIMULATOR_UDID" grant location-always "$APP_BUNDLE"
xcrun simctl location "$SIMULATOR_UDID" set 42.2760895,-83.7376592
run_test testRecordsCoveragePoint
assert_sql "SELECT count(*) FROM edge_progress WHERE visited_count>0 AND completed=0" "1" "partial coverage"
run_test testLaunchesInstalledApp
xcrun simctl location "$SIMULATOR_UDID" set 42.2769,-83.7382
run_test testRecordsAndPersistsWalk
xcrun simctl location "$SIMULATOR_UDID" set 42.2768073,-83.7380026
run_test testDriveSession
run_test testRewardShareSheet
run_test testProgressShareSheet
run_test testGpxShareSheet
run_test testExcludeAndRestoreRoad
run_test testDeleteTracksKeepsProgress

xcrun simctl terminate "$SIMULATOR_UDID" "$APP_BUNDLE" >/dev/null 2>&1 || true
assert_sql "SELECT count(*) FROM sessions" "3" "session summaries"
assert_sql "SELECT count(*) FROM track_points" "0" "raw track deletion"
assert_sql "SELECT count(*) FROM visited_samples" "2" "independent coverage"
assert_sql "SELECT count(DISTINCT mode) FROM visited_samples" "2" "travel modes"
assert_sql "SELECT count(*) FROM landmark_unlocks WHERE landmark_id='aa-diag'" "1" "reward"
assert_sql "SELECT count(*) FROM exclusions" "0" "exclusion undo"

run_test testResetAllData
xcrun simctl terminate "$SIMULATOR_UDID" "$APP_BUNDLE" >/dev/null 2>&1 || true
assert_sql "SELECT count(*) FROM sessions" "0" "full reset sessions"
assert_sql "SELECT count(*) FROM visited_samples" "0" "full reset progress"
assert_sql "SELECT count(*) FROM landmark_unlocks" "0" "full reset rewards"
echo "iOS UI acceptance passed on $SIMULATOR_UDID."
