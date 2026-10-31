# Paused furnace autosave regression — 2026-10-31

## Reproduction (previous behavior)

1. Start a Survival world, place a furnace and open its three-slot interface.
2. Add raw iron and fuel; keep the interface open for more than eight seconds.
3. The engine advances cooking in the requestAnimationFrame callback, but the render function returns early for the paused overlay before reaching the normal eight-second autosave check.
4. A browser tab killed while the interface remains open can lose unsaved smelting progress and output.

## Fix

The existing eight-second save timer now advances while the furnace or backpack overlay is open, using bounded real elapsed frame time. It remains inactive for the Escape/pause menu. Active gameplay uses the same helper without duplicate clock increments. No save-format changes, resource-pack copies or world-height activation.

## Verification plan

Run the Node regression suite and desktop/mobile Chrome smoke workflow. In the real browser smoke test, wait for two iron ingots, assert that localStorage already contains at least one ingot in the saved furnace record *before* closing the interface, and capture screenshots. Existing synthetic resource-pack fixtures are not the user's imported artwork.

## Limitations

This is a local single-player autosave fix, not full Overworld depth migration or endgame progression. Video artifacts are generic browser recordings, not a dedicated before/after video of this defect.
