# Deep-world chunk streaming: atomic view preflight (2026-10-31)

## Reproduction
In the experimental 384-layer stream, load two chunks and call `loadAround` across a new view. A generator error in a later target previously occurred after earlier targets had been loaded, causing partial LRU eviction and seam invalidation despite the failed view transition.

## Fix
Generate and validate every missing chunk before changing residency. Reject duplicate mutable stores, evict only chunks outside the target view, and preserve overlapping stores and their edits. Existing single-chunk `load` behavior and the 48-layer playable world remain unchanged.

## Regression coverage
`tests/deep-stream-atomic-view.test.cjs` covers late generation failure, invalid stores, duplicate stores, overlapping-view preservation, full-view replacement and single-chunk LRU behavior.

## Limitations
This is an opt-in staging API, not the live renderer. The preflight can temporarily hold up to one additional view of section data, and arbitrary exceptions from user-supplied store methods during commit are not transactionally rolled back. Browser smoke footage exercises the playable legacy world, not this experimental view transition. User-owned texture packs are not available in CI.
