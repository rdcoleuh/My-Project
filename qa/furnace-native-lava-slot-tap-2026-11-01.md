# Native lava-bucket slot tap regression — 2026-11-01

## Reproduction before fix
With an open furnace, a lava bucket in its fuel slot and at least one additional lava bucket selected in the inventory picker, tap the native Fuel slot. The prior gesture planner incorrectly returned a deposit action because it assumed every occupied slot held 64 items. The furnace rejected that deposit, leaving the bucket trapped until the player used a separate Take Fuel button.

## Fix
The native gesture planner now consults the furnace engine's shared `slotCapacity` contract. A full nonstackable lava-bucket slot returns a withdrawal gesture, and an empty slot still accepts a single bucket. Ordinary 64-item coal and input stacks retain their existing behavior. No save format, recipe, fuel duration, or player-owned artwork changed.

## Verification plan
Run `node --test tests/*.test.cjs` and the desktop/mobile Playwright smoke suite. Both browser modes must tap the full lava fuel slot to withdraw, tap again to reinsert, verify capacity stays at one, and withdraw again before continuing the iron-smelting scenario. Capture `*-lava-native-withdraw.png` and `*-lava-native-reinsert.png` in the GitHub Actions gameplay artifact. Browser tests use an independently generated Bedrock resource-pack fixture, not a player-provided pack. A complete survival-to-boss playthrough and dedicated before/after video of this bug are not covered by this change.
