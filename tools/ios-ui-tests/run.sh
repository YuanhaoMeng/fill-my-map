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
REPO_DIR="$(cd "$SOURCE_DIR/../.." && pwd)"
TEST_DIR="$(mktemp -d -t fill-my-map-ui-tests)"
case "$TEST_DIR" in
  /tmp/*|/private/tmp/*|/var/folders/*) ;;
  *) echo "Unexpected temporary directory: $TEST_DIR"; exit 1 ;;
esac
SEEDED_FILE=""
cleanup() {
  xcrun simctl location "$SIMULATOR_UDID" clear >/dev/null 2>&1 || true
  if [[ -n "$SEEDED_FILE" && -f "$SEEDED_FILE" ]]; then
    mv "$SEEDED_FILE" "$TEST_DIR/import-seed.fillmap"
  fi
  rm -rf -- "$TEST_DIR"
}
trap cleanup EXIT

DATA_DIR="$(xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_BUNDLE" data 2>/dev/null || true)"
if [[ -z "$DATA_DIR" ]]; then
  echo "Install the Release app on simulator $SIMULATOR_UDID first."
  exit 1
fi
clear_import_seed() {
  if [[ -n "$SEEDED_FILE" && -f "$SEEDED_FILE" ]]; then
    mv "$SEEDED_FILE" "$TEST_DIR/$(basename "$SEEDED_FILE")"
  fi
  SEEDED_FILE=""
}
seed_import_file() {
  local source="$1" name="$2" device_data groups metadata identifier
  device_data="${DATA_DIR%%/Containers/*}"
  groups="$device_data/Containers/Shared/AppGroup"
  for metadata in "$groups"/*/.com.apple.mobile_container_manager.metadata.plist; do
    identifier="$(/usr/libexec/PlistBuddy -c 'Print:MCMMetadataIdentifier' "$metadata" 2>/dev/null || true)"
    if [[ "$identifier" == "group.com.apple.FileProvider.LocalStorage" ]]; then
      SEEDED_FILE="$(dirname "$metadata")/File Provider Storage/$name"
      cp "$source" "$SEEDED_FILE"
      xcrun simctl openurl "$SIMULATOR_UDID" "file://$SEEDED_FILE"
      return
    fi
  done
  echo "Simulator local Files provider was not found."
  exit 1
}
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
seed_import_file "$REPO_DIR/map-packs/releases/ypsilanti-2026.08.24-v2.fillmap" "ypsilanti-2026.08.24-v2.fillmap"
run_test testImportYpsilantiFromFiles
test -f "$DATA_DIR/Documents/city-maps/cities/ypsilanti/2026.08.24-v2/network.sqlite"
clear_import_seed
seed_import_file "$REPO_DIR/map-packs/releases/ann-arbor-2026.08.24-v2.fillmap" "ann-arbor-2026.08.24-v2.fillmap"
run_test testDeleteAndImportAnnArbor
test -f "$DATA_DIR/Documents/city-maps/cities/ann-arbor/2026.08.24-v2/network.sqlite"
assert_sql "SELECT count(*) FROM edge_progress WHERE city_id='ann-arbor'" "1" "Ann Arbor progress restored"
clear_import_seed
cp "$REPO_DIR/map-packs/releases/ypsilanti-2026.08.24-v2.fillmap" "$TEST_DIR/truncated-ypsilanti.fillmap"
truncate -s 4096 "$TEST_DIR/truncated-ypsilanti.fillmap"
seed_import_file "$TEST_DIR/truncated-ypsilanti.fillmap" "truncated-ypsilanti.fillmap"
run_test testRejectsTruncatedCityMap
test -f "$DATA_DIR/Documents/city-maps/cities/ann-arbor/2026.08.24-v2/network.sqlite"
test -f "$DATA_DIR/Documents/city-maps/cities/ypsilanti/2026.08.24-v2/network.sqlite"
echo "iOS UI acceptance passed on $SIMULATOR_UDID."
