# Deep section edit-batch snapshot — 2026-11-01

## Reproduction

The experimental 384-layer section store validated each entry in `applyEdits` but saved references to the caller's mutable arrays. A generator that changed its second yielded array after validation caused the first voxel to be applied, then `set()` threw for the changed second block ID. This violated the advertised all-or-nothing preflight guarantee and could leave saved replay or multiplayer batches partially applied.

## Fix

Snapshot x, absolute y, z, and block ID into new primitive tuples during validation. Read each property once, validate the detached tuple, and only then apply the entire batch. Existing sequential update-count and mesh-invalidation behavior is unchanged. No save schema or 48-layer playable world behavior changes.

## Verification plan

Five Node regressions cover late mutations, reused iterator arrays, getter single-read behavior, failed preflight preserving an in-flight mesh claim, and unchanged duplicate-edit/seam semantics. CI additionally runs the repository's full Node suite and desktop/mobile Chrome smoke tests. Browser smoke recordings do **not** demonstrate this experimental section-store fix. The resource-pack smoke fixture is independently generated, not a player-provided Minecraft pack. Live Y=-64..319 gameplay, multiplayer integration, and a full survival playthrough remain unverified.
