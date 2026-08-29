# Architecture

## Dependency direction

```text
UI -> feature modules -> core contracts/types
                  \-> platform adapters -> Expo / MapLibre / SQLite
map-pack tools -> immutable city packages -> GitHub Releases
static package catalog -------------------> GitHub Pages
```

UI code never calls SQLite, location, files, or networking directly. Native APIs
are isolated in `src/platform`; matching, progress, package validation, and share
privacy rules remain testable TypeScript modules.

## Map packages

The App contains no map. A user explicitly downloads a `.fillmap` archive
from the static catalog or imports one with the iOS document picker. Installation
uses a staging directory, a strict four-file allowlist, size limits, catalog and
internal SHA-256 checks, then an atomic move. Installed packages contain:

- `basemap.pmtiles`, opened by MapLibre through a local `pmtiles://file://` URI;
- read-only `network.sqlite` with one boundary, roads, 15 m samples, R-Tree, and landmarks;
- `manifest.json` and `LICENSE.txt` with ODbL source and attribution metadata.

Format v2 adds `overview` and `place` package kinds plus `arterial` and `trail`
network profiles. The Ypsilanti pilot overview is a 50-mile circle: all indexed
parks are points, while only Pinckney and County Farm link to downloadable detail
packages. Format v1 city packages remain readable.

Multiple versions can coexist. One package is active; switching and deletion are
blocked during an exploration. Deleting a map never deletes user progress. The
map list loads progress for inactive installed packages as well as the active one.

## User database

`fill-my-map.sqlite` stores sessions, raw points, matched samples, completed
edges, exclusions, and rewards. Coverage rows use the legacy `city_id` column as
the stable package id and are scoped by that id and
`region_version`; there is no walking/driving mode. Schema v2 intentionally
clears the incompatible v0.1 dual-mode database once.

Every matched sample is persisted and rendered immediately. A logical road
counts toward city progress only when at least 80% of its samples are visited.

## Runtime flow

1. Open and verify the selected local package.
2. Render its PMTiles, boundary, network, coverage, landmarks, and park points.
3. Tapping an implemented park downloads or opens its detail package; other park
   points remain informational.
4. On explicit Start, request location and create a package-scoped session.
5. Clean/interpolate fixes, query nearby R-Tree samples, match, persist, and repaint.
6. On Finish, flush work, fit the active boundary, hide location/raw track,
   and capture a local share image with OSM attribution.

The only runtime network path is an explicit static catalog or package download.
No location or track is attached to that request, and no runtime map API exists.
