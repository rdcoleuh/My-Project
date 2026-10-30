# Deep-world migration: detached owned-entity metadata (2026-10-30)

## Reproduction
A legacy save can include optional nested metadata on a vehicle or dropped item. The preview previously returned Object.freeze({...record}), which froze only the outer object. Editing preview.vehicles[0].custom.colors[0] changed the original saved object.

## Fix
Deeply clone and freeze JSON-compatible metadata in the preview. Reject cycles, accessors, non-finite values, unsupported objects, and over-budget records without mutating the save. Preserve valid future-compatible nested fields.

## Regression coverage
tests/deep-owned-metadata-preflight.test.cjs covers nested vehicle metadata, dropped-item metadata, invalid metadata, and size/depth limits.

## Limitations
This remains preview-only. Live Overworld still uses 48 layers; no actual deep-world migration or browser playthrough is claimed here.
