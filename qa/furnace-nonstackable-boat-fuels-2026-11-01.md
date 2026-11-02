# Furnace fuel slot: nonstackable boats and rafts (2026-11-01)

## Reproduction

Before this change, MineWorld's furnace fuel slot used the default 64-item capacity for craftable boats and rafts. The Add Stack control could debit up to 64 boats and put them in one fuel slot. Vanilla-style boat and raft fuel is nonstackable, like the existing lava-bucket fuel container.

## Change

The furnace engine's shared slot-capacity rule now limits boat, spruceBoat, cherryBoat, raft, and lavaBucket to one per fuel slot. The native slot gesture planner and inventory-transfer UI already consume this rule, so keyboard, touch, and Add Stack all share the same restriction. Normal coal, bamboo, and ingredient stacks remain at 64. Existing saved overstacked boat fuel is retained, withdrawable, and consumed over time; it is not silently discarded or truncated.

## Test plan

- Node regressions: all four boat variants, Add Stack debit conservation, native tap withdrawal, and a restored legacy stack that continues smelting.
- Desktop and mobile Chrome smoke: use a **synthetic** fixture resource pack, grant test boats, verify disabled Add Stack, deposit one, screenshot the three-slot UI, and withdraw with the native fuel-slot button.
- Verify full Node suite, browser runs, Pages deployment, and branch SHA in GitHub Actions. Record actual results only after the workflows complete.

## Limits

This is a focused furnace fuel-capacity parity increment, not activation of the experimental 384-layer Overworld. No player-owned Minecraft bitmap textures are distributed. Browser screenshots and recordings, when uploaded, use independently generated fixture textures rather than a user's personal resource pack. A full survival playthrough and final boss remain unverified.
