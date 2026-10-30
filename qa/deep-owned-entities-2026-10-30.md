# Deep-world owned-entity migration preflight — 2026-10-30

**Scope:** Preview-only validation for existing 48-layer saves, not live 384-layer migration.

## Reproduction / risk
The legacy loader filters some invalid vehicle and farm-animal records and caps
collections. A future height migration that ignores these records could silently
lose player-owned boats, carts, tamed mounts, breeding animals, and their positions.

## Change
Validate and detach vehicle (up to 80), tamed mount (up to 60), and farm-animal
(up to 24) records in `planLegacySaveMigration`. Keep absolute Y coordinates,
animal health/breeding state, mount saddle/tame state and unknown flat fields.
Reject malformed coordinates, dimensions, kinds, duplicate vehicle IDs and
oversized collections atomically. Missing collections remain compatible.

## Verification plan
`node --test tests/deep-owned-entities-preflight.test.cjs` and full Node
suite; desktop/mobile browser smoke tests through the existing workflow.
This code does not activate Y -64..319 in live gameplay. No personal texture
pack was available; existing browser tests use independently created fixtures.
No dedicated before/after video for this nonvisual preflight change.
