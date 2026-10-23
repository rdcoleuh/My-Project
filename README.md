# MineWorld 3.6 — Survival Inventory, Expanded Crafting & Rideable Mounts

**Play now:** https://rdcoleuh.github.io/My-Project/

MineWorld is an **independently authored**, Minecraft-inspired browser voxel survival game. It does not include or depend on proprietary Mojang/Microsoft game assets or code.

## New Survival inventory

- **36 visible inventory slots per page**, with 64-item resource stacks, item icons, counts, paging, and search. Extra stacks are accessible on following pages so existing saves aren't truncated. Specific pieces of equipment stack individually.
- Tap a stack and choose **Equip / Hotbar**, **Eat / Use**, **Drop 1**, or **Drop Stack**. Drag one stack onto another to reorder them on a desktop.
- Crafted armor is equippable in head/chest/legs/feet slots and reduces damage. Equipped armor, inventory order, vehicles, block stacks, items, world edits, and progression are saved.
- Creative remains a **separate saved world** with unlimited placeable blocks, no Survival resource transfers, and no shortcut to Survival progress.
- The fixed-size Backpack is a paged view of the existing resource ledger, rather than a full slot-constrained Minecraft inventory: it does not yet implement cursor-held stacks, container transfers, or strict 36-slot carry limits.

## Crafting catalog

The original recipe selection is preserved and **220 additional authored recipes** are available (267 recipe entries total in this release). Search and filter recipes by category, station, and craftability:

- Basic planks, sticks, torch, crafting table, furnace, storage barrel, chests, and workstations.
- Wood/stone/iron/gold/diamond tools, sword/pickaxe/hoe/axe/shovel; Netherite upgrades; bows and shields.
- Leather/iron/gold/diamond/Netherite armor, furniture, food, farms, ore processing, building blocks, rails, carts, boats, rafts, redstone components, End and Nether items.
- Basic **crafting table, furnace, and smithing table** station requirements, with actual resources consumed and results placed in the saved Survival bag.

**Important:** 267 entries are **not every Minecraft crafting recipe**. Some crafting results are stored items only; complex redstone machines, storage containers, potions, enchanting, and many transport details do not have exact vanilla gameplay behavior. Recipes are original approximations, not reproductions of an official crafting table.

## Rideable creatures and transport

Approach a rideable and tap **RIDE** (or **M** on a keyboard). Press again (or hold **Shift**) to dismount. Use the left mobile joystick or WASD to steer. Some species need a saddle, harness, or taming food, plus a steering item.

- **Overworld:** horse, donkey, mule, camel, llama (limited steering), pig, skeleton horse and zombie horse.
- **Nether:** strider on lava, with saddle and Warped Fungus on a Stick.
- **Happy Ghast:** craft a harness; ride as a simplified flying mount (Space to ascend on desktop, Jump on touch devices).
- **Crafted vehicles:** oak, spruce and cherry boats, bamboo rafts, and minecart variants. Craft then deploy them from the bottom of the Gear & Crafting menu.
- Controls exist on both mobile and desktop. Boat floats at local water level, with simplified steering. Minecarts **do not yet follow physical rail networks**. Riders' player positions are shared in multiplayer, with best-effort positioning for ridden mobs, but vehicles are not fully server-authoritative or guaranteed to synchronize across clients.

## How to play

Select **Survival** from the home screen, mine blocks and collect items, then tap **🎒 Gear** or press **I**. Craft a table and tools, collect more supplies, and use the Inventory tabs and search to find specific recipes. Craft a boat or look for animals, then tap Ride. Your Survival save is separate from Creative, so changing modes will not transfer items or gear.

## Testing and known limits

- Syntax checks passed for game and catalog JavaScript.
- Simulated browser checks passed for Survival startup, all 36 backpack slots on desktop and a touch device, recipe catalog, crafting table, boat crafting/deployment/mount/dismount, stored vehicles, and mounted camel interaction.
- Gameplay on an actual iPhone/iPad and cross-device multiplayer mount synchronization remain unverified.
- There are no permanent dedicated multiplayer servers; the public PeerJS/WebRTC rooms are browser-hosted and peer-owned.
- External permission to use actual Minecraft code/assets is not provided; this release is an independently created sandbox and **is not Minecraft Java Edition**.
