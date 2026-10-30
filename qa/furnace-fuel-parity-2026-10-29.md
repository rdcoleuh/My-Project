# Furnace fuel parity — 2026-10-29

## Reproduction
Before this change, `MineWorldFurnace.create().insert(position, 'fuel', 'blazeRod', 1)`, `'block:116'`, and the craftable boat/raft items returned zero. These inventory items were available in MineWorld, but the furnace UI never offered them as fuel.

## Fix
Extend the original furnace fuel catalog with coal blocks (800 seconds), blaze rods (120 seconds), four boat/raft items (60 seconds), and dark logs (15 seconds). Existing fuel keys and recipes are unchanged. No proprietary bitmap or code is bundled.

## Verification contract
`tests/furnace-expanded-fuels.test.cjs` checks burn durations, actual smelt counts, save/restore, fuel consumption, and rejection of nonfuel items. `scripts/browser-smoke.cjs` grants a blaze rod in a fresh survival fixture, selects it through the real three-slot furnace UI, verifies the 120-second flame timer, waits for iron output, and saves dedicated desktop/mobile screenshots. These browser checks use synthetic, independently generated resource-pack fixtures, not a user-owned pack.

## Limitations
This increment does not implement lava buckets, smokers, blast furnaces, hoppers, multiplayer furnace synchronization, or deep-world rendering. The live Overworld still uses the legacy 48-layer profile. Before-and-after gameplay video capture for this specific fuel bug is not implemented; the existing Actions workflow records the browser smoke session.
