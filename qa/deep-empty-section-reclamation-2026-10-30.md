# Deep-world empty-section memory reclamation — 2026-10-30

## Reproduction

The opt-in 384-layer section store allocated a full 4096-byte Uint8Array after placing one block in an otherwise empty 16x16x16 section. Removing the final block left the 4096-byte array allocated until a caller explicitly invoked compact(), even though the occupancy counter was already zero. In a future streamed Overworld this would accumulate unnecessary per-chunk memory on mobile.

## Fix

After a successful block edit, when the section's exact non-air counter reaches zero, immediately release its payload and mark the section as uniform air. This is O(1) and does not change save data, block indices, rendering contracts, or the live 48-layer world. Existing dirty mesh revisions still invalidate in-flight builds and schedule a remove job. A later placement allocates a fresh copy-on-write payload.

## Verification scope

Three Node regression tests exercise memory reclamation, partially occupied sections, post-reclamation placement, stale GPU claims, and mesh removal scheduling. Full browser smoke and deployment status are determined by GitHub Actions; this code change does **not** enable 384-layer gameplay or demonstrate a complete playthrough. No player-owned resource pack was available in this execution environment.
