# Deep-world async mesh claim ownership — 2026-10-31

## Reproduction (pre-fix)

Two different section stores each containing one non-air block issued mesh claims with `index=0`, `revision=0`, and `claimId=1`. Claims had no originating store identity. Passing store B's claim to store A yielded `a.canInstallClaim(bJob) === true`, `a.materializeClaim(bJob).data[0] === 3`, and `a.ackDirtySection(bJob) === true`. The foreign acknowledgement erased A's pending mesh work.

## Fix

Attach the originating `storeId` to every asynchronous mesh lease. Reject foreign claims in both the common lease validator and the acknowledgement/release path. Existing voxel storage, save formats, and legitimate local lease/retry semantics are unchanged. This extends the previous detached-snapshot identity fix to the job token itself.

## Regression tests

`tests/deep-mesh-claim-store-isolation.test.cjs` covers cross-store materialization, installation, acknowledgement and release; forged store IDs; and normal same-store retry. CI runs `node --test tests/*.test.cjs`.

## Browser evidence limitations

The affected API is experimental staging for a 384-layer world, not the active 48-layer renderer. General desktop/mobile gameplay recordings cannot demonstrate this specific before-and-after fix. Synthetic original-art resource-pack fixtures in browser smoke tests are not player-imported Minecraft assets.
