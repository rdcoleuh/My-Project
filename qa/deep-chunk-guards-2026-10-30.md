# Deep chunk allocation and saved-edit validation — 2026-10-30

## Reproduction
The experimental chunk generator allocated `16 × 16 × H` bytes before checking `H`, so an invalid height could request excessive mobile memory. During saved-edit replay, an out-of-range block ID was assigned directly into a `Uint8Array`: 256 silently became 0 (air), and 511 became 255.

## Fix
Bound staged chunk profiles to the currently supported 384-layer vertical range, check integer chunk coordinates, and validate each saved edit index and block ID before replay. Throw on corrupt edits rather than silently rewriting their meaning. No original world data is modified by the generator.

## Regression coverage
`tests/deep-chunk-guards.test.cjs` covers malformed and oversized heights, out-of-range chunk positions, invalid saved edit IDs/indices, valid legacy/deep block edits, and non-Map input.

## Limitations
This protects the opt-in deep generator and existing legacy generator; it does **not** activate the 384-layer Overworld in `index.html`, migrate saves, or prove a complete survival playthrough. No proprietary assets are included.
