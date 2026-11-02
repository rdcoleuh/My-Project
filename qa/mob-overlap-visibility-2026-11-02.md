# Mob overlap visibility regression — 2026-11-02

## Reproduction
The previous `rayClear` implementation returned false for every ray shorter than 0.001 blocks, even when both points occupied the same unobstructed voxel. This could make a mob temporarily lose sight of a player when their positions overlapped.

## Fix
Allow zero-length and sub-0.001-block rays into the existing voxel traversal instead of rejecting them by distance. Retain the maximum-distance guard and stationary-face/edge solid-neighbor checks. No save format, imported artwork, or gameplay controls changed.

## Verification scope
The new Node regression tests cover exact overlap, close points in one voxel, stationary face cover and ordinary wall blocking. Browser and Pages status must be checked in GitHub Actions for the resulting commit. No claim of a full gameplay playthrough or dedicated before/after recording is made here.
