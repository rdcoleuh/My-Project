# Deep chunk saved-edit replay — 2026-11-01

## Reproduction
The experimental `world-chunks.js` generator traversed the entire world save Map twice per generated chunk: once to validate all edits and again after terrain generation to locate edits in that chunk. Large explored saves repeatedly paid this cost when streaming or revisiting chunks.

## Fix
Combine validation with a per-chunk edit filter. Reject any invalid global edit before generating terrain; retain only edits belonging to the requested chunk, then replay those edits after ores, caves, bedrock and structures. Keep original Map and serialized indices unchanged, including negative X/Z, Y=-64/319, and explicit air edits. No live-world height switch or migration.

## Regression coverage
`tests/deep-single-pass-edits.test.cjs` checks one iteration per chunk, signed seam isolation, legacy air/placed-block replay, and early rejection of a late corrupt edit before ore generation. The existing full Node and desktop/mobile Chrome smoke workflow remains authoritative for CI and recorded gameplay.

## Limitations
This is a deep-world streaming optimization and correctness guard, not live integration of the 384-layer Overworld. Gameplay video may only cover existing 48-layer gameplay. No user-owned Minecraft pack was supplied for this change; browser fixtures are independently generated.
