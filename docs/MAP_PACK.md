# Reproducible map packages

The builder is separate from the mobile App. Pinned input URLs and checksums are
in `tools/map-pack/config.mjs`.

For the v2 pilot, `pnpm map:build:v2`:

1. downloads and MD5-checks fixed Michigan, Ohio, and Ontario Geofabrik PBFs;
2. builds a 50-mile circle centered on Ypsilanti without clipping at borders;
3. keeps motorway, trunk, primary, and secondary roads (including link classes);
4. indexes every OSM park/nature-reserve/protected-park object in the circle;
5. builds Pinckney and County Farm boundaries and public trail networks;
6. matches Pinckney OSM trail segments to nearby Michigan DNR official names;
7. samples networks about every 15 metres and builds SQLite plus R-Tree;
8. extracts fixed Protomaps tiles (overview z0–14; park detail z0–15);
9. writes provenance, ODbL, bounds, version, and SHA-256 metadata;
10. creates one four-file `.fillmap` archive and the static catalog.

Artifacts live outside `assets/`:

```text
map-packs/cities/<package-id>/
map-packs/releases/<package-id>-<version>.fillmap
docs/maps/catalog.json
```

Generated v3 packages are GitHub Release assets and are ignored by Git. `pnpm
map:fetch` restores them with SHA-256 and archive allowlist checks.

`pnpm map:verify` checks each database, profile, fixed counts, PMTiles layers and
bounds, hashes, archive allowlist, catalog, license, park links, DNR provenance,
and formal Pinckney route names. Current verified totals: three packages, 7,726
parks, 49,807 network segments, and 852,515 samples. The catalog is on GitHub Pages.
