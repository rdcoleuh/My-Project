# Furnace: one-at-a-time output collection (2026-10-29)

## Reproduction before the change
Smelt two iron ingredients in a furnace. The interface offered only **Collect output**, so a player could not withdraw a single ingot while leaving the other in the output slot. This made stack management unnecessarily imprecise, particularly on touch screens.

## Change
Add an accessible, touch-sized **Collect 1** button alongside **Collect output**. Both use the existing transactional withdrawal helper: inventory capacity is checked before removing an ingot, and the control is disabled when the output slot is empty. No save format, recipes, textures, or world data are changed.

## Regression plan
- Node: smelt three items, withdraw one twice, withdraw the remainder, and verify item conservation; verify full inventory leaves output untouched.
- Desktop and mobile Chrome: import the independently generated synthetic Bedrock resource-pack fixture, smelt two iron ingredients using blaze-rod fuel, click **Collect 1**, verify one output remains and the accessible slot count updates, then collect the remainder. Capture separate desktop/mobile screenshots and browser videos through GitHub Actions.
- These tests do not prove a complete survival playthrough or any user's personal resource pack. No copyrighted texture artwork is bundled.
