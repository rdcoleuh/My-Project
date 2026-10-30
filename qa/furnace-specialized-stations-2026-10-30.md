# Specialized furnace stations — 2026-10-30

## Reproduction
Crafted Smoker (block 157) and Blast Furnace (block 158) previously behaved as inert blocks. Only block 20 opened the furnace interface, so neither specialized station could cook.

## Fix
- Route block 157 and 158 interactions through the existing accessible three-slot furnace UI.
- Persist station kind per world coordinate; legacy snapshots default to ordinary furnaces.
- Smoker accepts food and cooks in 5 seconds; blast furnace accepts ores/metals and cooks in 5 seconds. Ordinary furnace remains 10 seconds.
- Recipe selectors exclude unsupported ingredients; mining or replacing any station returns stored items.
- No copyrighted artwork was bundled.

## Test scope and limitations
Node tests exercise recipe gates, timers, save/restore, legacy fallback and independent inventories. Desktop/mobile Chrome smoke tests attempt real placement, UI transfers and output collection using independently generated texture fixtures. This is not a complete survival playthrough. The 384-layer world remains staging-only.
