# Furnace frame-delta validation — 2026-10-31

## Reproduction
Prior engine converted elapsed time using `Number(seconds)||0` and clamped it to 60. Calling `tick(Infinity)` on a fueled furnace with eight raw iron smelted six items immediately and consumed 60 seconds of coal. Numeric strings such as `'10'` were also accepted as elapsed time.

## Fix
Require a finite positive JavaScript number before running any furnace simulation. Reject Infinity, NaN, negative values, strings, objects, null and undefined without mutating input, fuel, output, burn, or progress. Preserve the existing 60-second cap for finite suspended frames.

## Regression coverage
`tests/furnace-frame-delta.test.cjs` covers infinite time, NaN/objects, numeric strings, zero/negative time, partial progress preservation, subsequent normal smelting, and the 60-second cap.

## Scope
This is an engine-level correctness fix, not a claim that a full furnace survival gameplay scenario or final boss was completed. Browser smoke recordings, when available, are general gameplay evidence and not dedicated before/after footage of this engine-only defect. Imported textures in CI are independent synthetic fixtures, not the player's personal packs.
