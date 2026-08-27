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

run_test testCatalogAndDownloadAnnArbor
test -f "$DATA_DIR/Documents/city-maps/cities/ann-arbor/2026.08.24-v2/basemap.pmtiles"
test -f "$DATA_DIR/Documents/city-maps/cities/ann-arbor/2026.08.24-v2/network.sqlite"
run_test testRelaunchesInstalledMap
xcrun simctl privacy "$SIMULATOR_UDID" revoke location "$APP_BUNDLE"
run_test testLocationPermissionDenied
xcrun simctl privacy "$SIMULATOR_UDID" grant location-always "$APP_BUNDLE"
xcrun simctl location "$SIMULATOR_UDID" set 42.2760895,-83.7376592
run_test testFollowPartialCoverageAndSharePreview
assert_sql "SELECT count(*) FROM sessions WHERE status='completed'" "1" "completed session"
assert_sql "SELECT count(*) FROM edge_progress WHERE visited_count>0 AND completed=0" "1" "partial coverage"
assert_sql "SELECT count(*) FROM pragma_table_info('visited_samples') WHERE name='mode'" "0" "single exploration mode"
run_test testStartSessionForInterruption
xcrun simctl terminate "$SIMULATOR_UDID" "$APP_BUNDLE" >/dev/null 2>&1 || true
run_test testRelaunchesInstalledMap
assert_sql "SELECT count(*) FROM sessions WHERE status='interrupted'" "1" "interrupted session recovery"
run_test testGpxExportUsesSystemShare
run_test testDownloadSwitchAndDeleteYpsilanti
test ! -e "$DATA_DIR/Documents/city-maps/cities/ypsilanti/2026.08.24-v2"
assert_sql "SELECT count(*) FROM edge_progress WHERE city_id='ann-arbor'" "1" "Ann Arbor progress retained"
echo "iOS UI acceptance passed on $SIMULATOR_UDID."
