# Peaceful difficulty parity audit — 2026-10-28

## Reproduced from source

The previous difficulty switch and simulation tick deleted every hostile and boss entity, including the Ender Dragon and shulkers, but retained neutral spiders, endermen and zombified piglins. Those neutral mobs could still attack after becoming angry. This differed from Minecraft's Peaceful rules. The live dragon branch also applied breath damage without checking difficulty.

## Change

- Introduced a pure, testable `peacefulDisposition` classifier for existing entities and future spawns.
- Peaceful now removes standard hostile mobs, the Wither and aggressive neutral spider/enderman/zombified-piglin variants; it keeps the Ender Dragon, shulkers, piglins and passive livestock.
- Prevented disallowed mob summons/spawns in Peaceful. Kept the surviving mobs non-aggressive and disabled dragon breath damage in Peaceful.
- No changes to saves, resource packs, network authority or artwork. Regression tests exercise actual difficulty-switch logic and integration guards.

Reference: https://minecraft.wiki/w/Difficulty (Peaceful section; reviewed 2026-10-28). This is a targeted gameplay comparison, not a claim of full Java/Bedrock parity.

## Feature-by-feature comparison backlog (presence is not parity)

| Area | Repository evidence | Status / next verification |
|---|---|---|
| Survival HUD / hotbar | `classic-hud-art.js`, `hotbar-sprite-uv.js`, `local-resource-pack.js` | Implemented pathways; test real user-owned packs, transparency and half icons. |
| Blocks / item visuals | `pixel-materials.js`, `block-item-icons.js`, `java-model-faces.js` | Partial; audit all IDs, UV orientations and side/top mappings. |
| Inventory / crafting | `java-inventory-ui.js`, `java-slots.js`, `index.html` | Partial; run full recipes, workstation and touch-input playthrough. |
| Mob spawning / Peaceful | `mob-ai-rules.js`, `index.html` | Targeted regression added; verify browser behavior and multiplayer. |
| Mob textures / motion | `mob-pixel-art.js`, `mob-motion.js`, `animal-models.js` | Partial; inspect face orientation, imported pack UV and animation parity. |
| Biomes / structures | `villages.js`, `world-chunks.js` | Implementations exist; systematic seed/structure comparison pending. |
| Nether / End / boss | `nether-world.js`, `end-world.js`, `index.html` | Implementations exist; full survival victory unverified. |
| Multiplayer / saves | `multiplayer.js`, `world-library.js` | Regression tests exist; long-session compatibility testing pending. |

## Verification requirements

Run Node tests, desktop/mobile browser smoke tests and inspect deployment status. Browser smoke recordings from this run are not automatically before/after proof of Peaceful-mode behavior. No personal resource pack is accessible in CI; any imported-texture tests use independently generated fixtures. A full survival victory has not been demonstrated.
