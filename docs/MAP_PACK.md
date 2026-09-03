# Reproducible map packages

The builder is separate from the mobile App. Pinned input URLs and checksums are
in `tools/map-pack/config-v2.mjs`.

For the v2 pilot, `pnpm map:build:v2`:

1. downloads and MD5-checks the fixed Michigan Geofabrik PBF;
2. queries official Michigan DNR project boundaries intersecting 50 miles of Ypsilanti;
3. deduplicates those boundaries into 21 state park/recreation-area entry points;
4. creates an overview SQLite file with zero roads and zero exploration samples;
5. extracts the continental United States from fixed Protomaps tiles at z0–7;
6. builds 21 separate park boundaries and public OSM trail networks at z0–15;
7. matches Pinckney OSM segments to nearby Michigan DNR official trail names;
8. samples park trails about every 15 metres and builds SQLite plus R-Tree;
9. writes provenance, ODbL, bounds, version, and SHA-256 metadata;
10. creates four-file `.fillmap` archives, the catalog, and the bundled overview asset.

Generated artifacts and the one intentional bundled asset are:

```text
map-packs/cities/<package-id>/
map-packs/releases/<package-id>-<version>.fillmap
docs/maps/catalog.json
assets/maps/united-states-overview.zip
```

Generated v4 park packages are GitHub Release assets. The 18.7 MB overview is
tracked as an App asset and checked against a hard 20 MB budget.

`pnpm map:verify` checks each database, profile, fixed counts, PMTiles layers and
bounds, hashes, archive allowlist, catalog, license, park links, DNR provenance,
and formal Pinckney route names. Current verified totals: 22 packages, 21 parks,
4,432 trail segments, and 131,987 samples. The overview contributes no network data.
