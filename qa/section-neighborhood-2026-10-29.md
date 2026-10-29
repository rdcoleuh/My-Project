# Deep-world cross-chunk seam coordination — 2026-10-29

## Reproduction and fix
A vertical section could correctly capture adjacent chunk edge planes, but a block edit routed directly through a neighboring chunk store did not automatically invalidate the first chunk's mesh. Loading or unloading a neighboring chunk could likewise change visible faces without notifying the first chunk.

The new opt-in `MineWorldSectionNeighborhood` coordinator registers section stores by chunk coordinate, routes block edits and atomic batches, and invalidates the affected neighbor sections on west/east/north/south edges. Chunk load, replacement and unload invalidate all adjacent section meshes. Snapshot installation checks the registered store identity and neighbor revisions.

## Regression checks
Five Node tests cover negative Y, edge-specific dirty propagation, load/unload/replacement, invalid and restored batches, snapshot invalidation and incompatible profiles.

## Limits
This is a staging API. The playable game still uses the 48-layer legacy renderer. Live chunk loading, renderer integration, multiplayer propagation, deep-world migration, and a full survival playthrough remain unverified. No proprietary artwork is included.
