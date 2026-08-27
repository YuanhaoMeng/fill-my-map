# Fill My Map — Mac mini migration handoff

> Update, 2026-08-27: the product direction below has been superseded. The App
> now contains no bundled map, uses explicit downloadable single-city packages,
> and has one unified exploration mode. Ann Arbor and Ypsilanti are separate
> `.fillmap` packages. Schema v2 intentionally clears the old walk/drive data.
> Current implementation and acceptance truth live in `README.md`,
> `docs/ARCHITECTURE.md`, `docs/MAP_PACK.md`, and
> `docs/IOS_TEST_CHECKLIST.md`. The remaining text is migration history only.

This handoff records the local state on 2026-08-25. v0.1 is implemented but
not accepted: automated checks and simulator acceptance pass, while physical
iPhone and field tests remain. The repository has no commits and no remote; all
source files are currently untracked, so preserve the included `.git` directory
and working tree.

## What is in the archive

- App source, tests, docs, configuration, lockfile, and Git metadata.
- The ready-to-use Ann Arbor/Ypsilanti offline region under
  `assets/regions/ann-arbor-ypsilanti/` (PMTiles, network SQLite, manifest,
  license).
- Map-pack build scripts and the iOS Xcode wrapper.

The archive intentionally excludes reproducible or disposable data:
`node_modules/`, `ios/`, `dist/`, `.expo/`, `tools/map-pack/cache/`, and
`tools/map-pack/work/`. The pinned Michigan PBF can be downloaded again by
`pnpm map:build`; rebuilding is not needed to run the app.

## Put the project on the Mac mini

Use a local path with no spaces and outside iCloud Drive, Dropbox, or another
file-provider folder. This is important for Xcode scripts and framework signing.

```sh
mkdir -p "$HOME/Developer"
tar -xzf "$HOME/Desktop/Fill-My-Map-migration-2026-08-25.tar.gz" \
  -C "$HOME/Developer"
cd "$HOME/Developer/fill-my-map"
```

Compare the archive SHA-256 with the value supplied by the old Mac before
deleting the copied archive.

## Install prerequisites

1. Install Xcode 26.6 or newer from Apple and open it once.
2. Install an iOS simulator runtime from Xcode Settings > Components. The old
   Mac used iOS 26.5; any runtime supported by the installed Xcode is suitable.
3. Install Homebrew if needed, then install the pinned toolchain:

```sh
brew install node@24 osmium-tool pmtiles
npm install --global pnpm@11.19.0
node --version
pnpm --version
osmium --version
pmtiles version
```

Node must be 24.x because the map builder uses Node's built-in SQLite module.
CocoaPods is installed or invoked by Expo during the first native build.

## Restore and verify

Read `AGENTS.md` before making changes. Then run:

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm exec expo-doctor
pnpm exec expo export --platform ios --output-dir dist
```

Expected automated result after recovery: 21 unit tests pass, the 200-line gate
passes, TypeScript and ESLint pass, and map verification reports two cities,
ten landmarks, 5,502 logical roads, and 81,930 coverage samples.

Generate the ignored native project and build:

```sh
pnpm exec expo prebuild --platform ios --no-install
pnpm ios -- --device "iPhone 17 Pro"
```

Choose an installed simulator name if it differs. For a real iPhone, select the
device, configure a free Apple Personal Team if prompted, and remember that the
temporary signature expires. `pnpm ios` uses `tools/native/xcodebuild`, which
only disables signing for ExpoModulesJSI's intermediate framework; final app
signing remains normal.

## Current native-build breakpoint

On the old Mac, ExpoModulesJSI compiled after adding the narrow Xcode wrapper.
The next failure was Expo Constants trying to execute a path truncated at
`.../Fill`, caused by the old workspace name `Fill my Map`. This is why the
archive extracts to `fill-my-map` and why the new path must contain no spaces.
Do not carry the generated `ios/` directory across machines; regenerate it.

After a successful build, confirm the app launches with Metro, the offline map
shows both city boundaries, roads, and ten landmarks, and no HTTP map request is
made. Then exercise location denial/recovery, start/stop, history, GPX export,
exclusion/undo, reward cards, sharing, deletion, restart persistence, and
airplane mode.

## Mac mini recovery result

- Xcode Debug and self-contained Release builds succeed on the iOS 26.5
  simulator; the offline map and all ten landmarks render.
- MapLibre starts with a local empty style, avoiding its default network style,
  and Expo SQLite is built with RTree support for the bundled road index.
- `pnpm test:ios:ui` passes denial/recovery, walk/drive separation, persistence,
  rewards, sharing, GPX, exclusion/restore, deletion, and full reset.
- Simulator cold-launch logs contain no HTTP map request. Simulator does not
  provide a real airplane-mode network cutoff, so that check remains on iPhone.

## Implementation status

- Expo 57 / React Native 0.86 / TypeScript 6, iOS-first and system-language
  English/Chinese.
- Offline MapLibre PMTiles plus read-only SQLite road network.
- Local SQLite sessions, raw points, progress, exclusions, and rewards.
- Walk/drive matching with filtering, interpolation, continuity scoring, and an
  80% edge threshold; modes stay independent.
- Ten landmark rewards, four city-mode completion rewards, local 9:16 share
  cards, GPX export, and local deletion/reset controls.
- No account, server, telemetry, ads, runtime map API, or track upload.
- MPL-2.0 source and ODbL/OSM attribution are included.

See `README.md`, `docs/ARCHITECTURE.md`, `docs/MAP_PACK.md`, and
`docs/IOS_TEST_CHECKLIST.md` for architecture and acceptance details.

## Work remaining

1. Connect an iPhone, configure a Personal Team, and repeat permission recovery,
   background/force-quit, storage-failure, sharing, and airplane-mode checks.
2. Complete the four 15-minute Ann Arbor/Ypsilanti field
   sessions, including five locked minutes each, plus the one-hour battery test.
3. Only after every checklist item passes, mark the iOS v0.1 goal complete.

The Mac mini ChatGPT task should begin by calling `create_goal` with:

> 完成并验证 Ann Arbor/Ypsilanti 的 local-first iOS v0.1，包括模块化
> Expo/React Native 客户端、离线地图包、双模式探索、奖励分享和自动化测试

Do not set a token budget unless the user supplies one. Do not create the
Android goal until iOS v0.1 is accepted.
