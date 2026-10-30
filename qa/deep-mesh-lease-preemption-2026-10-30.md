# Deep-world mesh lease preemption — 2026-10-30

## Reproduction (before fix)
A worker claims a section mesh, then the player edits a voxel before the mesh is installed. The old claim is correctly marked stale, but its in-flight reservation remains. Calling `claimDirtySectionsNear` immediately returns no work; the section cannot rebuild until the stale worker acknowledges or the 30-second lease expires. Edits on vertical seams can block two sections. Horizontal chunk-boundary notifications have the same issue.

## Fix
Invalidate the old in-flight reservation whenever a section revision changes. The dirty flag and revision still advance, and old claim IDs cannot acknowledge or install meshes. The next frame may claim a fresh mesh job. No voxel indexing, save format, or gameplay world-height constant changes.

## Verification
- Reproduced the old stalled claim in the connected repository code.
- Executed patched code in a JavaScript runtime: a seam edit invalidated both claims, both sections could be reclaimed immediately, and new seam snapshots included the edited voxel.
- Added Node regression tests for unchanged edits, immediate retry, late worker acknowledgements, vertical seam invalidation and horizontal boundary notifications.
- GitHub Actions Node and browser results are tracked separately; no dedicated before/after browser video of this experimental-only subsystem is claimed.

## Scope
The 384-layer section store remains experimental. The playable Overworld is still 48 layers. No copyrighted Minecraft assets were added.
