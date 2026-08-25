# Architecture

## Dependency direction

```text
UI -> feature modules -> core contracts/types
                  \-> platform adapters -> Expo / MapLibre / SQLite
map-pack tools -> generated immutable region assets
```

`src/core` has no React Native dependencies. Feature modules contain coverage, rewards, map styling, history export, and orchestration. Platform adapters are the only modules allowed to call location, file, sharing, or SQLite APIs.

## Databases

`network.sqlite` is versioned with the region and treated as read-only at runtime. It contains city polygons, logical road edges, 15-metre coverage samples, an R-Tree, and ten curated landmarks.

`fill-my-map.sqlite` is user-owned and writable. It stores sessions, raw track points, visited sample IDs scoped by region version and mode, completed edges, reversible exclusions, and permanent landmark unlocks.

An edge is complete when at least 80% of its samples are visited. Walking and driving rows are independent. Exclusions lower the local denominator and remain visible.

## Runtime flow

1. Validate the bundled PMTiles and network database against `manifest.json`.
2. Load local PMTiles into MapLibre using `pmtiles://file://` and query roads from SQLite.
3. On explicit start, request foreground and background location, then create a session.
4. Clean and interpolate each location batch; query nearby R-Tree samples and score distance, heading, and continuity.
5. Persist raw points and matched samples, recompute touched edges, unlock nearby landmarks, and repaint changed roads.
6. On stop, flush queued work before completing the session.

There is no runtime network path in this design.
