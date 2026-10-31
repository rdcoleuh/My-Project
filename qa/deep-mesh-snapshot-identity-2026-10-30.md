# Deep-world mesh snapshot identity regression — 2026-10-30

## Reproduction

The experimental vertical-section mesh store uses an asynchronous claim/acknowledge workflow. Before this change, `canInstallClaimWithNeighbors` compared the active claim and the detached snapshot only by section index and revision. Two different chunk stores both starting at revision 0 and section 0 could therefore accept one another's detached voxel data. Similarly, releasing and retrying a claim without a voxel edit reused the same revision, allowing an old worker snapshot to pass as the new claim's result.

## Fix

Each detached mesh snapshot now carries the originating `storeId` and the exact `claimId`. Installation rejects snapshots with a different store or lease, in addition to the existing section revision, neighbor identity, and neighbor revision checks. This is an experimental deep-world staging API change, not a live renderer switch or save migration.

## Regression checks

`tests/deep-mesh-snapshot-identity.test.cjs` covers cross-chunk swaps with identical revisions, expired/retried claims, propagation through vertical and horizontal seam snapshots, and neighbor invalidation. The existing section-store and neighborhood tests continue to cover normal successful installs and asynchronous invalidation.

## Gameplay evidence and limitations

This defect is in the opt-in 384-layer staging mesh system; the current playable world still uses the legacy 48-layer renderer. A browser gameplay clip cannot directly demonstrate the unactivated code path. Node tests are the direct reproduction and verification. General browser smoke recordings, if uploaded by CI, must not be labeled before/after footage of this defect. Resource-pack smoke tests use original synthetic fixtures unless a user-owned pack is explicitly supplied.
