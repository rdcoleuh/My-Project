# Entity hitbox world-height and signed-origin regression — 2026-11-01

## Reproduction
The live collision helper accepted player hitboxes extending beyond the top of the 48-layer world: it checked X/Z maxima and Y minimum, but never checked Y maximum. It also assumed all world origins were zero, so a future signed Y=-64 Overworld would reject valid entities.

## Fix
Treat `width`, `height`, and `depth` as extents from optional `minX`, `minY`, and `minZ` origins (default zero). Reject invalid extents, check the full entity hitbox against all six world boundaries, and retain the existing shape-aware voxel intersection logic. This applies to the current collision helper without changing saved worlds or switching on the experimental deep world.

## Regression coverage
`tests/world-vertical-hitbox-bounds.test.cjs` covers the legacy Y=0..47 ceiling, Y=-64..319 future world, signed X/Z, malformed bounds, and collisions with solid blocks below zero. Tests use independently authored code and no imported proprietary textures.

## Limitations
This is a collision-boundary fix, not live 384-layer terrain integration. No dedicated before/after browser video is captured by this unit-test change. Full browser CI and deployment results must be checked separately.
