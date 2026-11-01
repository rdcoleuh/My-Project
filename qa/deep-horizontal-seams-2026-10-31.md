# Deep-world horizontal chunk seam invalidation (2026-10-31)

## Reproduction and scope
The opt-in deep-world section store could invalidate its own vertical mesh sections after block edits, but it had no neighbor-aware setter. A future renderer using two adjacent section stores could retain an already claimed mesh after a block changed on their shared X/Z boundary. That stale mesh can hide or show a face incorrectly. This is a staging API issue, **not a claim that the live 48-layer renderer exhibited this exact bug**.

## Change
Added `createSectionStore().setWithNeighbors(x,y,z,block,{west,east,north,south})`. On a real boundary change, the edited section and its vertical seam neighbor are dirtied by the existing setter, and only the matching horizontal neighbor stores receive `markNeighborBoundaryDirty(y)`. Validate neighbor dimensions and store identity before any voxel mutation. No-op edits do not enqueue mesh jobs. Missing/unloaded neighbors are accepted; the chunk loader remains responsible for initial mesh construction.

## Tests and evidence
`node --test tests/deep-horizontal-seams.test.cjs` checks stale lease rejection, corner notifications, no-op edits, incompatible neighbor rejection before writes, unloaded neighbors and neighbor-aware snapshots. The complete Node suite and desktop/mobile browser smoke tests run in GitHub Actions after push.

## Limitations
This opt-in API is not yet connected to the live renderer. The playable Overworld still uses H=48, SEA=14. Full Y -64..319 world integration, cross-chunk orchestration, safe saves, multiplayer, and full survival playthrough remain unfinished. Browser smoke videos exercise the existing game; they are not before/after footage of this staging API. Any imported textures in CI are independently created test fixtures, not the user's resource pack.
