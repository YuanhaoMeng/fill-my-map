# Reproducible map pack

The builder is intentionally separate from the mobile app. Inputs and their checksums live in `tools/map-pack/config.mjs`.

Pipeline:

1. Download and MD5-check the fixed Geofabrik Michigan PBF.
2. Extract the joint city bounding box with complete ways.
3. Resolve relations `135130` and `135135`, then export their polygons.
4. Export highway ways and apply the public-street mode rules.
5. Assign each logical edge to a city and sample its geometry about every 15 metres.
6. Build deterministic SQLite tables and the sample R-Tree.
7. Range-extract zoom 0–15 tiles from the fixed Protomaps build.
8. Write SHA-256 hashes, source, license, city IDs, and version into the manifest.

`pnpm map:verify` checks both hashes, ODbL metadata, city relations, nonempty walk/drive networks, and ten unique landmarks. The raw Michigan input and intermediate files are ignored by Git; only the compact region artifact is bundled.
