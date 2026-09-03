# iOS acceptance checklist — park-first v0.1

## Automated and packaging

- [x] `pnpm verify` passes line, privacy, asset-budget, lint, TypeScript, tests, and map checks.
- [x] `pnpm exec expo-doctor` passes all checks.
- [x] Overview has no exploration, location, coverage, exclusion, or reward capability.
- [x] Overview contains 0 roads, 0 samples, and 21 official DNR park entries.
- [x] Continental-US z0–7 overview archive is 18.7 MB and below the 20 MB budget.
- [x] All 21 parks have separate on-demand packages (39.6 MB total, none bundled).
- [x] County Farm and obsolete overview packages are removed during migration.
- [x] Partial coverage restart, package isolation, camera follow, and share-privacy unit tests pass.
- [x] Release `.app` embeds exactly one overview archive and no park package.

## Simulator

- [x] Fresh offline launch installs and opens the bundled overview without a map picker.
- [x] Upgrade removes the old 112 MB overview and opens the new background.
- [x] Overview shows all 21 park entries around Ypsilanti without interaction lag.
- [x] Tapping Pinckney downloads, opens, and returns to overview in under four seconds per local switch.
- [ ] Tapping an unavailable park remains informational and does not start exploration.
- [x] Park Start obtains a first location, recenters, and follows the user.
- [x] Drag suspends follow and Resume restores it.
- [x] Matched trail portions repaint immediately and survive a cold launch.
- [x] Finish fits the park and opens a privacy-safe screenshot preview.
- [ ] Airplane-mode cold launch opens overview and every already-downloaded park.
- [x] Denied location permission is recoverable.
- [ ] Corrupt archive, interrupted download, and low storage are recoverable.

## Real iPhone / field work (must not be simulated)

- [ ] Release build installs, launches cold, and opens the overview with Wi-Fi disabled.
- [ ] All 21 park points remain responsive on the real device.
- [ ] Pinckney downloads once, then switches both directions offline without visible delay.
- [ ] Walk at least 15 minutes on a named Pinckney trail, including 5 minutes locked.
- [ ] Confirm live partial coverage, restart restoration, finish percentage, and share image.
- [ ] Verify GPX export is explicit and no network request contains location or track data.
- [ ] One-hour locked recording uses approximately 8% battery or less.

Personal Team signatures expire quickly and are not public distribution builds.
