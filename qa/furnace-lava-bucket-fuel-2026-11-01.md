# Furnace lava-bucket fuel — 2026-11-01

## Behavior
- A single player-owned `lavaBucket` now burns for 1000 seconds in a furnace (500 seconds in a smoker/blast furnace, matching their faster burn rate).
- The consumed fuel becomes an empty `bucket` in the fuel slot; withdraw it before adding new fuel. No new artwork is bundled.
- Normal insertion caps lava buckets at one per fuel slot. Malformed/older saves containing a stack of lava buckets are kept intact and cannot ignite until the player withdraws the excess; this avoids destroying unreturned containers.
- Existing smelting recipes, three-slot UI, saves, and other fuels are unchanged.

## Regression coverage
`tests/furnace-lava-bucket-fuel.test.cjs` covers burn duration, returned container, nonstacking, malformed restored stacks, specialized stations, and save/reload.

## Limitations
This is furnace-engine and existing UI integration, not a new bucket-filling mechanic. Browser smoke workflow is expected to exercise general desktop/mobile gameplay, but a dedicated before/after lava-bucket recording has not been captured. Synthetic imported texture packs are not the user's owned packs. The live 384-layer Overworld remains incomplete.
