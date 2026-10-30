# Furnace background cooking during backpack and crafting (2026-10-30)

## Reproduction
In Survival, place a furnace, insert two raw iron and a blaze rod, then close the furnace. Open the backpack/crafting screen while a new cherry log is smelting. Before this fix the render loop stopped furnace ticks because `paused` was true and the furnace dialog was closed. Progress remained unchanged until the backpack closed.

## Fix
Allow the existing bounded, save-aware furnace tick to continue while the Survival backpack/crafting panel is visible. The Escape/pause menu still suspends simulation. No changes to save formats, inventory transfers, recipes, fuel timers, artwork or multiplayer.

## Verification plan
- Node regression test: source condition, pause/physics contract, and partial-cook/save continuity.
- Desktop and mobile Chrome smoke: open backpack during a real cherry-log smelt, verify progress increases while the backpack is visible, capture screenshots, reopen the same furnace and collect charcoal.
- Resource-pack smoke uses a clearly labeled independently generated Bedrock fixture, not the user's pack.
- Recordings from the browser smoke workflow demonstrate gameplay, not a separately captured before/after pair.

## Remaining
Deep Overworld integration (Y -64..319), actual multiplayer furnace inventory synchronization, and a full survival-to-boss playthrough remain incomplete.
