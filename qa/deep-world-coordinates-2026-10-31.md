# Absolute-coordinate section bridge — 2026-10-31

## Reproduction
The staging section coordinator accepted signed chunk coordinates but required callers to calculate local coordinates themselves. Using truncation for negative world X/Z places -1 in chunk 0 instead of chunk -1. Separately, neighbor lookup at Number.MAX_SAFE_INTEGER / MIN_SAFE_INTEGER overflowed to an unsafe integer and threw *after* register or set had already mutated state.

## Fix
Added `worldToChunk(x,y,z)`, `getWorld(x,y,z)`, and `setWorld(x,y,z,block)` for absolute coordinates. Floor division handles negative X/Z and preserves absolute Y. Missing chunks return null on reads and reject writes; no chunk is silently generated. Neighbor offsets outside JavaScript's safe-integer range are treated as unloaded rather than throwing after a mutation. The service-worker cache version was advanced.

## Verification scope
Seven Node regression tests cover negative X/Z, positive chunk seams, Y=-64/319, unloaded chunks, invalid writes, and safe-integer boundary overflow. Existing section-neighborhood and mesh tests remain in the CI suite. Desktop/mobile Chrome smoke testing and GitHub Pages deployment are evaluated by their existing workflows.

## Limitations
This is a staged API, **not live 384-layer gameplay**. It does not change index.html's H=48 / SEA=14, rewrite saves, update multiplayer wire formats, or complete the endgame playthrough. Browser pack tests use independently generated fixtures, not a user's imported copyrighted artwork. No dedicated before/after video is promised for a non-rendered staging API.
