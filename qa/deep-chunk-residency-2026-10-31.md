# Deep-world bounded chunk residency bridge — 2026-10-31

Base branch head: `fd9898bbf8cace3e0b450806bf817e502e3cd5c1`.

## Reproduction / risk
The staged 384-layer generator, writable section store, horizontal neighbor
coordinator and deep-world edit codec were previously separate APIs. There was
no bounded loader that could evict deep chunks, replay edits when reloading,
and invalidate neighboring meshes on streaming transitions. Keeping all
384-layer chunks resident would be expensive on mobile.

## Implementation
`MineWorldSectionNeighborhood.createDeepChunkStream()` connects those
existing staging components with a maximum-resident-chunk LRU (default nine).
It validates all saved deep edits, maintains independent per-chunk edit maps,
replays placed blocks and mined air on reload, keeps unloaded chunks distinct
from air, invalidates horizontal seams through the existing coordinator,
supports atomic validation of absolute-world edit batches, and refuses
oversized radius loads before changing the cache. Generator failures do not
evict the current chunk set. Tests include actual deterministic 384-layer
terrain and bedrock generation, negative Y, the top layer, LRU eviction,
mesh-claim invalidation, replay and malformed saves.

## Scope and limitations
This bridge is opt-in and does not change `index.html`'s playable H=48,
SEA=14 world. It does not migrate legacy saves or enable deep-world collision,
lighting, multiplayer transport, WebGL section meshes, or 384-layer gameplay.
The generated chunk still starts as a full 384-layer array before section
compaction. No user-provided proprietary texture pack is included.
Browser gameplay smoke recordings, when available, cover the existing
playable world rather than this staged bridge.
