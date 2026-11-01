# Signed horizontal-coordinate codec — 2026-11-01

## Reproduction and change
The opt-in deep-world coordinate codec previously rejected every negative X/Z position, despite deep-world furnaces and streamed chunks supporting signed horizontal positions. Simply permitting negative values in the existing formula would alias saved edits and produce negative chunk-local array indices.

The codec now accepts optional `minX` and `minZ` origins, translates absolute coordinates to unique nonnegative indices, decodes to absolute coordinates, and uses global positive modulo for chunk-local indices. The mixed-height dimension codec propagates those origins. Existing codecs default to 0,0 and preserve all legacy indices.

## Regression coverage
`tests/deep-signed-horizontal-codec.test.cjs` checks signed coordinate round trips, -64/319 bounds, negative chunk seams, separate dimension offsets, migration round trips, atomic rejection of out-of-bounds edits, unchanged legacy indices, and unsafe origins.

## Scope
This is a staging codec, not a playable-world migration. The live game still uses H=48, SEA=14. No save schema, renderer, collision, networking, or terrain-generation integration is changed. No player-owned artwork is bundled. Browser gameplay recordings for this codec-specific change are not yet captured.
