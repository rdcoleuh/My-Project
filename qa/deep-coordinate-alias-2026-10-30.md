# Deep-world coordinate alias protection — 2026-10-30

## Reproduction
The staged coordinate codec previously computed `index(0,48,0)` as 48 in the legacy 48-layer profile, which is the valid index for `(0,0,1)`. Similarly, a negative Y could alias a preceding column. The chunk-local formula accepted out-of-bounds coordinates, and an oversized `chunkSize` could exceed exact integer indexing even with a tiny world.

## Fix
Reject invalid absolute coordinates with `null` before producing global or local indices. Check the chunk-local stride for safe integer precision during profile creation. No valid coordinate, legacy save index, network dimension offset, or world format is changed. Increment the service-worker cache to deliver the revised module.

## Regression
`tests/deep-coordinate-alias.test.cjs` checks legacy boundary aliasing, deep negative Y, malformed coordinates, oversized chunk strides, and valid old/deep index identity. The active playable Overworld remains 48 layers; this is a prerequisite safety fix, not a 384-layer activation.

## Browser and media
Automated desktop/mobile gameplay evidence comes from the existing workflow. No dedicated pre-fix browser recording was captured for this pure codec bug. Browser pack imports use an independently created fixture, not a user-provided Minecraft resource pack.
