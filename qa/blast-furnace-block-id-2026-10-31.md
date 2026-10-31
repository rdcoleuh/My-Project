# Blast furnace block registry mismatch — 2026-10-31

## Reproduction (source inspection before fix)
The block registry identifies 156 as **Blast Furnace**, 157 as **Smoker** and 158 as **Cartography Table**. The blast-furnace crafting recipe incorrectly yielded block 158, and the interaction, replacement and browser-smoke code also treated 158 as a blast furnace. A crafted blast furnace therefore displayed cartography-table artwork; a real block 156 could not be opened, and a real cartography table could be opened as a furnace.

## Fix
The recipe now yields 156. Furnace interactions, replacement cleanup, debug bridge and both desktop/mobile browser-smoke fixtures recognize 20, 156 and 157 only. Block 158 is not a furnace. Existing saved blast-furnace *machines* with corresponding block-158 edits are conservatively migrated to block 156 on load, preserving their slots, timers and positions, with a backup attempt and dirty-save tracking. Ambiguous un-opened block-158 placements and inventory stacks are **not** automatically converted because they may be legitimate cartography tables.

## Verification plan
Run all Node tests and desktop/mobile Chrome browser smoke on GitHub Actions. New tests exercise recipe mapping, saved-machine migration, idempotence, dimension isolation, non-migration of cartography tables and source integration. Desktop/mobile browser smoke must place block 156, smelt iron, and reject block 158 as a furnace. Existing gameplay videos use a clearly labeled synthetic Bedrock fixture, not player-owned Minecraft art.

## Limitations
This does not enable the experimental Y -64..319 Overworld; live worlds remain at the legacy 48-layer height. Existing ambiguous block-158 inventory stacks are preserved without reinterpretation. A full survival-to-final-boss playthrough is not established by these smoke tests.
