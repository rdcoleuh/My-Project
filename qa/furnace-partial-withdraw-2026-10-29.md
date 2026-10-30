# Furnace partial-stack withdrawal — 2026-10-29

## Reproduction before the fix
Place three raw iron in a furnace and add coal. After four seconds of progress, withdraw one input item through the engine. The original `take` reset smelting progress to zero even though two identical ingredients remained. The furnace interface also offered only whole-stack withdrawal, making precise transfers difficult on touch devices.

## Change
The furnace engine now resets cooking progress only when the final input item is removed. The furnace dialog has separate 44px-minimum Take 1 and Take input/fuel actions. Inventory credits still occur before engine debits and are rolled back on a rejected transfer. Both controls preserve the existing save schema and imported texture rendering.

## Verification targets
- Node regression: partial ingredient withdrawal retains the 4-second cook progress and finishes in six additional seconds; removing the final ingredient resets progress.
- Node regression: one-item inventory transfer is bounded, atomic, and rejects invalid limits.
- Node regression: fuel-stack withdrawal does not extinguish already-burning fuel.
- Desktop/mobile Chrome smoke: click Take 1, verify the remaining input quantity, return the item, then smelt iron with blaze-rod fuel. Capture `desktop-furnace-take-one.png` and `mobile-furnace-take-one.png`.
- GitHub Actions: complete Node suite, Chrome smoke, artifact upload, Pages deployment.

## Limits
The Chrome smoke does not time a four-second partial smelt; that timing scenario is covered by deterministic Node tests. This does not integrate the 384-layer Overworld into the live renderer. Texture-pack browser tests use independently created fixtures, not a user's personal pack. Existing gameplay videos are not dedicated before-and-after recordings.
