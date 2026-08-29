# iOS acceptance checklist — region and park maps

## Automated and packaging

- [x] `pnpm verify` passes line, privacy, zero-map-assets, lint, TypeScript, tests, and map checks.
- [x] `expo-doctor` passes all checks.
- [x] Ann Arbor and Ypsilanti are separate, verified `.fillmap` archives.
- [x] App source contains one exploration mode and city/version-scoped progress.
- [x] Archive allowlist, traversal, decompression-size, manifest, and catalog validation tests pass.
- [x] Camera follow, partial coverage restart, city isolation, and share-privacy tests pass.
- [x] Release `.app` contains no `.pmtiles`, `network.sqlite`, or `.fillmap`.
- [x] Fresh simulator launch shows city selection with no map installed.
- [x] Simulator downloads, activates, switches, deletes, and reimports both packages.
- [x] Local v2 package verification passes for the Ypsilanti 50-mile overview,
  Pinckney, and County Farm.
- [x] Overview inventory contains 7,726 park points and exactly two implemented links.
- [x] Pinckney verifies OSM geometry, DNR provenance, and official route-name matching.
- [x] Inactive installed-map progress remains visible after switching and catalog migration.
- [ ] Simulator downloads the v2 overview and both park packages from the published catalog.
- [ ] Simulator taps both implemented park markers, opens details, and returns to overview.
- [ ] Simulator confirms an unimplemented park remains informational.

## Exploration and sharing

- [x] First valid simulated location recenters and follows the user.
- [x] Dragging suspends follow; Resume restores it in the simulator UI suite.
- [x] Matched road portions repaint immediately and restore after a simulator cold launch.
- [x] Finish fits the active city and opens a screenshot preview.
- [x] Shared preview shows explored area, city, percent, and OSM attribution.
- [x] Shared preview omits raw route, endpoints, user marker, and precise time.
- [x] GPX export remains an explicit user action through the system share sheet.

## Recovery and privacy

- [x] Foreground/background denial is recoverable in the simulator UI suite.
- [ ] Location Services off is recoverable.
- [x] Force-quit marks an active session interrupted on next launch.
- [x] Corrupt and truncated packages are rejected without replacing an installed map.
- [ ] Low-storage download/export failure preserves maps, tracks, and progress.
- [x] Deleting a city map preserves progress after reinstall.
- [ ] Recording makes no network request; downloaded maps work in airplane mode.

## Real iPhone / field work (must not be simulated)

- [ ] Real iPhone downloads and cold-restores the 50-mile overview.
- [ ] Real iPhone renders the full park inventory without unacceptable interaction lag.
- [ ] Real iPhone opens Pinckney and County Farm from overview park points.
- [ ] Field-check at least one formally named Pinckney route and one County Farm trail.

- [x] Personal Team Release build launches on the connected iPhone.
- [x] Wi-Fi reinstall and cold launch succeed.
- [x] Real iPhone downloads Ann Arbor and restores it after a cold launch.
- [x] Real iPhone downloads, opens, switches, and deletes Ypsilanti.
- [x] Real iPhone short-run UI tests cover follow recovery, privacy share preview,
  GPX system sharing, and force-quit recovery.
- [ ] Ann Arbor: at least 15 minutes on foot, including 5 minutes locked.
- [ ] Ann Arbor: at least 15 minutes by car, including 5 minutes locked.
- [ ] Ypsilanti: at least 15 minutes on foot, including 5 minutes locked.
- [ ] Ypsilanti: at least 15 minutes by car, including 5 minutes locked.
- [ ] One-hour locked recording uses approximately 8% battery or less.

Personal Team signatures expire quickly and are not public distribution builds.
