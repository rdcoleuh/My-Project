# Deep-world collision preflight — 2026-11-01

## Reproduction and fix
The experimental deep stream's getWorld() delegated to a neighborhood with no registered profile. Reading before the first load or after unloading the final chunk threw instead of reporting the chunk as unloaded. Now it returns null for unloaded valid positions.

Added sampleCollision(box,isSolid) to the experimental 384-layer stream. It samples an exclusive-max AABB with a 512-cell limit, reports clear/solid/unloaded, and treats unloaded cells as blocking movement until terrain streams in. Callers supply block collision rules, so fluids and non-cube shapes are not misclassified by this layer.

## Verification scope
Six Node tests exercise pre-load and post-unload reads, negative Y, upper Y, exact block faces, fluid predicates, cross-chunk seams and malformed/oversized queries. This is an opt-in staging API; the playable renderer and collision controller still use the legacy 48-layer world. No gameplay footage of this API is claimed until integrated into live play.
