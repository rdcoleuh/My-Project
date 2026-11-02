# Furnace dialog guidance and keyboard focus — 2026-11-02

## Reproduction and fix
The furnace's three slots and fuel/cook meters worked, but a full or incompatible output slot silently stalled smelting. Players saw unchanged progress without knowing why. Keyboard Tab from the last control could also leave the open modal and reach the world behind it. An invalid UI frame delta could poison the repaint accumulator.

Added an actionable, non-live furnace status hint for empty input, unsupported recipe, blocked output, missing fuel, malformed legacy lava-bucket stacks, and active recipe ETA. The hint reads real machine state; it does not grant items or modify the smelting engine. Added Tab and Shift+Tab containment among enabled controls, preserving Escape and the existing return-focus behavior. Reject non-finite/negative repaint deltas and reset the accumulator on each opening.

## Regression coverage
New Node tests cover normal cooking, blocked outputs, specialized recipes, legacy lava stacks, both Tab boundaries, focus recovery, and redraw guards. Desktop and mobile Chrome smoke script now checks the actual hint, keyboard wrapping, and captures a synthetic-resource-pack furnace screenshot. All textures in the browser fixture are independently generated; no personal pack was available.

## Limitations
The full Y=-64..319 world is not activated. This does not change furnace simulation timings, saved records, multiplayer formats, or HUD textures. A full survival-to-final-boss playthrough is not claimed. CI run and deployment results must be checked separately after this commit.
