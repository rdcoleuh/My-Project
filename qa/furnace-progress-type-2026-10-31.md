# Furnace save-progress type validation — 2026-10-31

## Reproduction
A legacy/modified save with a valid ingredient, one coal and `progress: "9"` (or `progress: [9]`) was accepted by `Number(r.progress)` in `furnace-engine.js`. It restored a nearly finished ten-second cook even though the duration was not a number. One second of simulation could produce an item. This is a save-validation issue, not evidence of an exploit in normal gameplay.

## Fix
Restore partial cooking only from finite JavaScript numbers. Reject strings, booleans, arrays, objects, NaN and infinities; clamp finite numeric values to the station duration and retain the existing completed-frame guard. Valid numeric progress and all inventories remain compatible.

## Verification
Pre-push local JavaScript assertions exercised malformed values and normal furnace, smoker and blast furnace progress. The committed Node tests cover malformed types, bounds, legitimate partial progress and a second save/reload. GitHub Actions status and browser gameplay evidence must be verified separately; this log does not assert a browser reproduction.
