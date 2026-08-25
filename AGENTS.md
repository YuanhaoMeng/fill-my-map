# Fill My Map repository rules

These rules apply to the whole repository.

## Code size and maintenance

- Every handwritten code, test, configuration, and build-script file must stay below 200 physical lines.
- Generated native projects, lockfiles, and binary map packages are explicit exceptions and must not be edited by hand.
- A new exception must record the file, reason, and a concrete split plan. v0.1 allows no new exceptions.
- Implement features as small modules with explicit interfaces. Do not bypass module boundaries to access SQLite or location APIs.
- Prefer mature open-source dependencies over reimplementing generic capabilities.

## Privacy and product scope

- No accounts, telemetry, advertising, track uploads, or runtime map APIs.
- Raw tracks stay on the device unless the user explicitly exports or shares them.
- The bundled map, share cards, and license screen must show `© OpenStreetMap contributors`.

## Verification

- Run focused tests after every vertical feature slice.
- Run `pnpm verify` at each milestone.
- `pnpm verify` must check line limits, lint, TypeScript, unit tests, and map-pack consistency.
- Do not manually edit generated native projects, lockfiles, or binary map packages.

## Licensing

- Application source is MPL-2.0.
- OpenStreetMap-derived packages are ODbL and must keep their source and attribution metadata.
