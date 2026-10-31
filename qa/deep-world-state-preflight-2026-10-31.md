# Deep-world world identity and toolbar preflight — 2026-10-31

## Reproduction
The 48-to-384-layer migration preview already preserved edits, furnace stacks and survival progression but omitted seed, seed label, weather, camera orientation, flight flag, Creative hotbar and backpack display order. A future migration based only on this preview could lose user settings or regenerate a different landscape while preserving placed blocks.

## Implementation
Added frozen detached `worldState` and `playerViewState` records. `playerItems` now includes `creativeHotbar` and `inventoryOrder`. Invalid fields and accessor-backed weather/view data fail closed; older saves without optional fields remain supported. Seven Node regression cases cover preservation, isolation, invalid values and the unchanged live profile.

## Limitations
This is preview-only; the live Overworld is still H=48, SEA=14. Rendering, collisions, chunk streaming, save migration and multiplayer remain unfinished. Browser smoke is not a deep-world playthrough. No player-owned texture pack was available for this run; existing smoke uses independently created synthetic fixtures. No before-and-after gameplay video is claimed for this preflight-only defect.
