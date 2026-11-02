# Deep-world bounded geometry batches — 2026-11-01

## Reproduced problem
A 16x16x16 checkerboard section exposes 12,288 faces. The previous
`buildTriangles` bridge rejected all geometry above its default 8,192-face
limit. This was safe for memory but could make dense terrain sections disappear
once the experimental 384-layer world is connected to the live renderer.

## Change
Added opt-in `MineWorldSectionFaces.buildTriangleBatches(plan,{maxFaces})`
and `planMesh(...,{geometry:{batched:true,maxFaces}})`. Batches are bounded
to at most 8,192 faces each (1,572,864 bytes of vertex data per draw), with
smaller budgets supported. The full packed plan is validated before any GPU
buffer allocation and copied to prevent caller mutation during construction.
Each batch uses the existing original triangle builder and preserves imported
atlas UV callbacks, shading, signed X/Z coordinates and negative Y.

Existing `buildTriangles` and non-batched callers retain their behavior.
No gameplay or save data format is changed.

## Regression
Five tests cover 12,288-face dense sections, total face conservation,
per-draw memory bounds, identical UV/vertex order against the single-buffer
builder, early rejection of corrupt plans, signed-coordinate mesh claims,
stale-lease rejection and empty sections. All fixtures use original synthetic
block IDs and UV coordinates.

## Limitations
The new batch API remains experimental; normal gameplay still uses H=48,
SEA=14. Total memory for all batches may still be substantial if retained
simultaneously. A future live renderer should upload and release per draw,
respect frame budgets, and implement save/multiplayer migration. No player
texture pack was available for this test; no dedicated before/after gameplay
clip is claimed.
