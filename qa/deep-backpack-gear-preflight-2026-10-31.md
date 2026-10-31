# Deep-world migration preflight: backpack, gear and experience (2026-10-31)

## Reproduction / impact
The legacy save stores player-owned `bag` counters, `tools`, `armor`, and `experienceTotal`.
Before this change, `planLegacySaveMigration(...).playerItems` included inventory counters,
stack records, hotbar references and Java slots, but **omitted** these additional fields.
A future height migration built from that preview could silently lose collected materials,
equipped gear and earned experience. The current 48-layer game and its saves were not
modified by this preview-only change.

## Fix
- Include detached, recursively frozen backpack, tool, armor and experience previews.
- Accept up to 512 backpack keys for the current expanded crafting catalog; bound
  total metadata nodes and reject accessors, cycles and invalid item keys.
- Reject negative, fractional, oversized or non-finite backpack counters; preserve
  strict namespaced item keys and existing 2,000,000 XP bound.
- Validate equipped tool/armor records without changing the original save.
- Keep all new preview fields `null` when absent in older saves.

## Regression coverage
`tests/deep-player-backpack-preflight.test.cjs` checks valid equipment, 200-key
backpacks, frozen detached copies, optional legacy fields, malformed data,
accessor-backed fields and invalid XP. CI runs the complete Node suite and
desktop/mobile Chrome smoke tests on every `gh-pages` push.

## Limitations
This is **not** a live Y -64..319 migration. Runtime terrain, chunk rendering,
collision, multiplayer and saved-world migration remain on the legacy 48-layer
world until independently implemented and tested. The test fixture contains
only original MineWorld item names; it is not an imported Minecraft pack.
This data-preflight defect is not directly observable in a gameplay recording;
the linked Actions artifact records general desktop/mobile browser smoke tests,
not before/after footage of this particular data-validation change.
