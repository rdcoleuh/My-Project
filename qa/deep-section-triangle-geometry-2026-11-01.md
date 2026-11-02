# Deep-world section triangle geometry bridge — 2026-11-01

## Problem
The 384-layer section store and exposed-face planner had no way to produce the
interleaved triangle vertices required by the existing MineWorld WebGL shader.
A future live renderer would have to reconstruct faces independently and could
lose imported atlas UV orientation or accidentally allocate excessive GPU buffers.

## Change
Added an **opt-in** `MineWorldSectionFaces.buildTriangles(plan, options)`
adapter with signed world X/Z origins, absolute negative Y, outward-wound
triangles, face shading, optional original block cuboids and player-provided
atlas UV callbacks. The buffer matches the live shader's 8-float stride.
`createSectionNeighborhood().planMesh(...,{geometry:{...}})` now optionally
returns that buffer while preserving the stale-claim check. Default planning
remains unchanged and makes no vertex allocation.

A configurable 8,192-face default cap (~1.5 MiB of vertex data per section)
guards mobile memory. Larger sections can opt in to a cap no greater than
24,576 faces. Invalid geometry, UVs, shapes and origins fail closed.

## Reproduction / regression
Before this change there was no triangle-geometry API for section plans.
New tests verify triangle winding, 384-layer negative Y, signed X/Z,
UV corner order, block cuboids, allocation budgets, invalid inputs and
coordinator claim behavior. Tests use only original synthetic data.

## Limitations
This is a staging bridge, **not** live 384-layer gameplay. Live chunks still
use H=48, SEA=14 and the original renderer. The adapter does not render
complex non-cuboid models or merge transparent faces. No player-owned pack was
available for visual verification; tests use synthetic UV callbacks.
No dedicated before-and-after gameplay video exists for this staged change.
