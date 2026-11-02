# Deep-world absolute-elevation precision regression — 2026-11-02

## Reproduction (before fix)

The opt-in `MineWorldWorldDepth.sectionizeChunk` accepted a four-layer
section with `minY = Number.MAX_SAFE_INTEGER - 3`. Its exclusive upper
bound, `minY + height`, was not a safe integer. JavaScript rounded
that boundary, allowing inaccurate section limits and potentially aliased
absolute-Y reads. The same unchecked construction path was used by
`createSectionStore`.

This is a **deep-world staging-code defect**, not evidence that a live
48-layer world was corrupted. No saved world was changed.

## Fix

Validate the exclusive upper Y bound with
`Number.isSafeInteger(minY + height)` before allocating or exposing
sections. Unsafe inputs now throw `RangeError`. Legitimate deep-world
Y=-64..319, legacy Y=0..47, and precisely representable boundary
coordinates continue to work. The service-worker cache version was
incremented for browser delivery.

## Reproduction / regression

`node --test tests/deep-section-safe-elevation.test.cjs`

The tests cover unsafe high-Y spans, the last representable exclusive
upper bound, read/write behavior, negative safe-integer minima, and the
normal deep-world profile. The regression suite and desktop/mobile browser
smoke tests run through `.github/workflows/mineworld-tests.yml`.

## Video and imported pack limitations

This change only affects the not-yet-enabled deep-world section codec;
there is no honest in-game before/after scene to record for it. The
workflow's browser smoke videos are general gameplay evidence, not a
demonstration of a playable 384-layer Overworld. Browser resource-pack
tests use independently generated fixtures, not a user's copyrighted
Java/Bedrock textures. No full progression playthrough or boss defeat
is claimed.

## Remaining integration

The live game still uses H=48 and SEA=14. Enabling Y=-64..319 and
sea level 63 requires versioned save migration, world generation,
collision/render streaming, networking, and mobile performance tests.
