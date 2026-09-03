# Architecture

## Dependency direction

```text
UI -> feature modules -> core contracts/types
                  \-> platform adapters -> Expo / MapLibre / SQLite
map-pack tools -> bundled overview + immutable park packages -> GitHub Releases
static park-package catalog -------------------------------> GitHub Pages
```

UI code never calls SQLite, location, files, or networking directly. Native APIs
are isolated in `src/platform`; matching, progress, package validation, and share
privacy rules remain testable TypeScript modules.

## Map packages

The App embeds one small `.fillmap` overview covering the continental United
States through zoom 7. On first launch it is verified and installed locally.
It contains no explorable network and exists only to render context and Michigan
DNR park entry points around the pilot area. Park detail archives are downloaded
from the static catalog or imported with the iOS document picker. Installation
uses a staging directory, a strict four-file allowlist, catalog and internal
SHA-256 checks, then an atomic move. Installed packages contain:

- `basemap.pmtiles`, opened by MapLibre through a local `pmtiles://file://` URI;
- read-only `network.sqlite` with metadata and park points or a trail network;
- `manifest.json` and `LICENSE.txt` with ODbL source and attribution metadata.

Format v2 supports `overview` and `place` package kinds. The v4 overview uses the
`none` network profile: zero roads, samples, progress, location, or rewards. Its
21 park points come from official DNR project boundaries intersecting the
Ypsilanti 50-mile radius. Pinckney currently links to a downloadable trail pack.

One package is active; switching and deletion are blocked during an exploration.
The bundled overview cannot be offered as a download and replaces obsolete
overview versions. Deleting a park map never deletes its user progress.

## User database

`fill-my-map.sqlite` stores sessions, raw points, matched samples, completed
edges, exclusions, and rewards. Coverage rows use the legacy `city_id` column as
the stable package id and are scoped by that id and
`region_version`; there is no walking/driving mode. Schema v2 intentionally
clears the incompatible v0.1 dual-mode database once.

Every matched sample is persisted and rendered immediately. A logical road
counts toward city progress only when at least 80% of its samples are visited.

## Runtime flow

1. Verify/install the bundled overview, then restore an active park when present.
2. Render local PMTiles and only the layers supported by the package kind.
3. Tapping an implemented park downloads or opens its detail package; other park
   points remain informational.
4. On explicit Start, request location and create a package-scoped session.
5. Clean/interpolate fixes, query nearby R-Tree samples, match, persist, and repaint.
6. On Finish, flush work, fit the active boundary, hide location/raw track,
   and capture a local share image with OSM attribution.

The only runtime network path is a background static catalog refresh or an
explicit park-package download. Startup and the overview work with no connection.
No location or track is attached to that request, and no runtime map API exists.
