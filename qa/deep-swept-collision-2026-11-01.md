# Deep-world swept collision preflight — 2026-11-01

## Reproduction and fix
A destination-only collision check can miss a full solid voxel when a sprinting or falling AABB moves several blocks between simulation frames. This staged deep-world bridge now exposes `sweepCollision(box, motion, isSolid)`: it checks the starting box and traverses movement in at most quarter-block steps, stopping at the first solid or unloaded cell. It reports the last verified-clear movement fraction, collision coordinates and number of samples.

## Safety and limits
Motion is capped at 16 blocks per call (at most 65 AABB samples); existing per-sample 512-cell budget still applies. Both endpoints are validated before reading terrain. Unloaded chunks block motion. The caller supplies solid-vs-fluid rules; partial-block hitboxes and exact continuous contact time are not represented. This is **experimental only**, not integrated with the live H=48 game. No saves, resource packs or proprietary bitmap artwork are modified.

## Validation
Added seven Node tests for tunneling, unloaded seams, negative Y, diagonals and fluids, initial penetration, invalid motion and unchanged legacy height. The new API was also executed directly in a JavaScript sandbox before committing. CI and browser-smoke results must be checked independently.
