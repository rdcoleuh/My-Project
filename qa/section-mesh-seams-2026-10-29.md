# Section mesh seam snapshots — 2026-10-29

This change adds an opt-in `materializeClaimWithSeams(job)` API to the experimental deep-world section store. It returns the detached center slice plus a one-voxel-thick upper and lower neighboring Y plane in x-major, z-minor order. The two planes permit a future mesher to cull hidden faces at vertical section boundaries without copying whole adjacent slices. World-floor and world-ceiling planes are `null`.

Regression coverage: negative Y, three adjacent slices, detached data, Y boundary planes, stale-claim rejection after a seam edit, and successful retry. Existing `materializeClaim` behavior and saved-world formats remain unchanged.

**Limitations:** The live game still renders 48-layer chunks; this opt-in snapshot API is not yet wired to the live renderer. Horizontal neighboring chunk faces, lighting, collision, multiplayer migration and full 384-layer gameplay remain outstanding. This commit contains no user texture packs or proprietary artwork. No before/after gameplay video of this experimental API is claimed.
