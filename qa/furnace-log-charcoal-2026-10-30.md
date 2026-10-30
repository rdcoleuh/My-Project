# Furnace charcoal parity — October 30, 2026

## Reproduction and fix
Before: the live furnace recipe map cooked only oak log (`block:5`) into charcoal. Other registered logs (poplar, spruce, birch, acacia, jungle, mangrove, cherry, pale oak and dark) were valid fuels but were rejected in the input slot, blocking a common survival progression route.

After: all ten independently registered MineWorld log types cook into charcoal in ten seconds. Planks remain fuel only. Existing furnace state and saves retain their schema. No Minecraft bitmaps or proprietary code are bundled.

## Evidence
- Deterministic tests: `tests/furnace-log-charcoal.test.cjs` covers all ten log IDs, fuel conservation, non-log rejection, save/restore at Y=-38, and incompatible output blocking.
- Browser smoke: `scripts/browser-smoke.cjs` now loads cherry log (`block:40`) through the actual input selector after iron smelting, waits for charcoal output, collects it, and captures desktop/mobile screenshots named `*-furnace-cherry-charcoal-synthetic.png`.
- Texture-pack limitation: the browser fixture is independently generated and is not the user's imported Minecraft pack.
- Video limitation: existing CI records general browser gameplay. No dedicated before/after video is claimed for this change.
- Deep-world limitation: playable terrain remains 48 layers; this furnace logic supports negative-Y positions but does not integrate the 384-layer renderer.

## Verification status
Implementation prepared for GitHub Actions Node tests, desktop/mobile Chrome smoke, and Pages deployment. Consult the corresponding workflow runs for actual pass/fail status; this document does not claim they have completed.

## Browser-fixture correction
The first CI run passed all 587 Node tests but desktop Chrome failed before charcoal smelting: `MineWorldBridge.grantLoot('block:40',1)` rejected every block key because the QA grant helper only accepted named bag items. The helper now uses the existing `validHotbarKey` guard, which validates registered block IDs and named items, while retaining the survival-mode and 1–8 quantity restrictions. The first failed run did **not** verify charcoal in Chrome; consult the new run for re-test results.
