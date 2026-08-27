# Reproducible city map packages

The builder is separate from the mobile App. Pinned input URLs and checksums are
in `tools/map-pack/config.mjs`.

For each configured city, `pnpm map:build`:

1. downloads and MD5-checks the fixed Geofabrik Michigan PBF;
2. extracts the city bounding box with complete ways and resolves its OSM relation;
3. applies the public-street rules and assigns roads inside the city boundary;
4. samples logical roads about every 15 metres and builds SQLite plus R-Tree;
5. extracts zoom 0–15 tiles from the fixed Protomaps build;
6. writes source, ODbL, bounds, version, and SHA-256 metadata;
7. creates one four-file `.fillmap` archive and the static catalog.

Artifacts live outside `assets/`:

```text
map-packs/cities/<city-id>/
map-packs/releases/<city-id>-<version>.fillmap
docs/maps/catalog.json
```

`pnpm map:verify` checks each database, boundary relation, expected road/sample/
landmark counts, PMTiles layers and bounds, hashes, archive allowlist, catalog,
ODbL metadata, and `© OpenStreetMap contributors` attribution.

Current verified totals: two cities, ten landmarks, 5,502 logical roads, and
81,930 coverage samples. Package archives are GitHub Release assets; the small
catalog is served by GitHub Pages.
