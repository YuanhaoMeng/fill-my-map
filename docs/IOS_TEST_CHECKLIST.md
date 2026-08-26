# iOS v0.1 acceptance checklist

## Automated

- Use `pnpm ios` for native builds. Its narrow Xcode wrapper disables signing
  only for ExpoModulesJSI's intermediate framework in file-provider workspaces;
  final app signing remains unchanged.
- [x] `pnpm verify` passes.
- [x] Xcode Debug build succeeds with minimum iOS 17.
- [x] App starts on an iOS simulator.
- [x] App starts on a Personal Team signed iPhone.
- [x] The bundled map displays both cities, roads, boundaries, and ten landmarks
  without a runtime map request on the simulator.
- [x] The first valid session location recenters and follows; dragging suspends
  following until the explicit resume control is used.
- [x] Sub-threshold walk/drive coverage renders immediately, stays mode-isolated,
  and reloads from local SQLite after restart.
- [ ] Airplane mode displays the same map on a physical iPhone.
- [x] A two-hour synthetic track completes without a crash.

## Permissions and recovery

- [x] Foreground denial shows a recoverable message and a later grant recovers.
- [ ] Background denial shows a recoverable message on a physical iPhone.
- [ ] Location Services off shows a recoverable message.
- [ ] Force-quit during a session stops recording; next launch marks it interrupted.
- [ ] A corrupt map package is rejected rather than opened.
- [ ] Low-storage export failure does not corrupt stored tracks or progress.

## Field sessions

- [ ] Ann Arbor: at least 15 minutes walking, including 5 minutes locked.
- [ ] Ann Arbor: at least 15 minutes driving, including 5 minutes locked.
- [ ] Ypsilanti: at least 15 minutes walking, including 5 minutes locked.
- [ ] Ypsilanti: at least 15 minutes driving, including 5 minutes locked.
- [ ] One-hour locked recording uses approximately 8% battery or less.

## Data and privacy

- [x] Progress persists after restart and never crosses travel modes.
- [x] GPX export opens the system share sheet and contains the chosen raw track.
- [x] Deleting raw tracks keeps confirmed progress.
- [x] Full reset requires two confirmations and clears progress, exclusions, tracks, and rewards.
- [x] Share cards omit exact route, endpoints, residence, and precise time.
- [ ] No location network traffic occurs during recording in airplane mode.

Personal Team signatures expire quickly; repeat installation when the profile expires. They are not suitable for public release.
