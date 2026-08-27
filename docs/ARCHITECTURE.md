# Architecture

## Dependency direction

```text
UI -> feature modules -> core contracts/types
                  \-> platform adapters -> Expo / MapLibre / SQLite
map-pack tools -> immutable city packages -> GitHub Releases
static catalog ---------------------------> GitHub Pages
```

UI code never calls SQLite, location, files, or networking directly. Native APIs
are isolated in `src/platform`; matching, progress, package validation, and share
privacy rules remain testable TypeScript modules.

## City packages

The App contains no city map. A user explicitly downloads a `.fillmap` archive
from the static catalog or imports one with the iOS document picker. Installation
uses a staging directory, a strict four-file allowlist, size limits, catalog and
internal SHA-256 checks, then an atomic move. Installed packages contain:

- `basemap.pmtiles`, opened by MapLibre through a local `pmtiles://file://` URI;
- read-only `network.sqlite` with one boundary, roads, 15 m samples, R-Tree, and landmarks;
- `manifest.json` and `LICENSE.txt` with ODbL source and attribution metadata.

Multiple versions can coexist. One city is active; switching and deletion are
blocked during an exploration. Deleting a map never deletes user progress.

## User database

`fill-my-map.sqlite` stores sessions, raw points, matched samples, completed
roads, exclusions, and rewards. Coverage rows are scoped by `city_id` and
`region_version`; there is no walking/driving mode. Schema v2 intentionally
clears the incompatible v0.1 dual-mode database once.

Every matched sample is persisted and rendered immediately. A logical road
counts toward city progress only when at least 80% of its samples are visited.

## Runtime flow

1. Open and verify the selected local package.
2. Render its PMTiles, boundary, roads, coverage, and landmarks.
3. On explicit Start, request location and create a city-scoped session.
4. Clean/interpolate fixes, query nearby R-Tree samples, match, persist, and repaint.
5. On Finish, flush work, fit the active-city boundary, hide location/raw track,
   and capture a local share image with OSM attribution.

The only runtime network path is an explicit static catalog or package download.
No location or track is attached to that request, and no runtime map API exists.
