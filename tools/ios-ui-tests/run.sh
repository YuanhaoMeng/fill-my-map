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
  xcodebuild test -quiet -project FillMyMapUITests.xcodeproj -scheme FillMyMapUITests \
    -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" -derivedDataPath DerivedData \
    "-only-testing:FillMyMapUITests/FillMyMapUITests/$1"
}
assert_sql() {
  local query="$1" expected="$2" label="$3" actual
  actual="$(sqlite3 "$DATA_DIR/Documents/SQLite/fill-my-map.sqlite" "$query")"
  [[ "$actual" == "$expected" ]] || { echo "$label: expected $expected, got $actual"; exit 1; }
}
has_rows() {
  assert_sql "SELECT CASE WHEN count(*)>0 THEN 1 ELSE 0 END FROM $1 WHERE $2" "1" "$3"
}

run_test testOverviewHasNoExploration
OVERVIEW="$DATA_DIR/Documents/city-maps/cities/united-states-overview/2026.09.03-v4"
test -f "$OVERVIEW/basemap.pmtiles"
assert_sql "ATTACH '$OVERVIEW/network.sqlite' AS n; SELECT count(*) FROM n.edges" "0" "overview edges"
assert_sql "ATTACH '$OVERVIEW/network.sqlite' AS n; SELECT count(*) FROM n.places" "21" "overview parks"
run_test testDownloadPinckney
PINCKNEY="$DATA_DIR/Documents/city-maps/cities/pinckney-state-recreation-area/2026.09.03-v4"
test -f "$PINCKNEY/network.sqlite"
xcrun simctl privacy "$SIMULATOR_UDID" revoke location "$APP_BUNDLE"
run_test testLocationPermissionDenied
xcrun simctl privacy "$SIMULATOR_UDID" grant location-always "$APP_BUNDLE"
LOCATION="$(sqlite3 "$PINCKNEY/network.sqlite" 'SELECT latitude||","||longitude FROM samples LIMIT 1')"
xcrun simctl location "$SIMULATOR_UDID" set "$LOCATION"
run_test testFollowCoverageAndShare
assert_sql "SELECT count(*) FROM sessions WHERE status='completed'" "1" "completed park session"
has_rows edge_progress "city_id='pinckney-state-recreation-area' AND visited_count>0" "park progress"
run_test testStartSessionForInterruption
xcrun simctl terminate "$SIMULATOR_UDID" "$APP_BUNDLE" >/dev/null 2>&1 || true
run_test testRelaunchesPark
assert_sql "SELECT count(*) FROM sessions WHERE status='interrupted'" "1" "interrupted session recovery"
run_test testReturnToOverviewAndOpenMarker
run_test testGpxExportUsesSystemShare
echo "iOS park-first UI acceptance passed on $SIMULATOR_UDID."
