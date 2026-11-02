# MineWorld Java/Bedrock-inspired feature parity tracker — 2026-11-02

This checklist describes **MineWorld's independently authored implementations**, not a claim of full Minecraft compatibility. Mark a feature complete only after real browser gameplay verification. User-supplied resource packs remain private and are not redistributed.

| Feature | Current evidence | Status / next gate |
| --- | --- | --- |
| Nine-slot hotbar, selection, icons | `hotbar-sprite-uv.js`, `classic-hud-art.js`, resource-pack importer | Implemented; player-pack and mobile visual QA ongoing |
| Ten hearts and ten food icons (0–20, half icons) | `classic-hud-art.js`, survival HUD tests | Implemented; screen-reader/manual pack QA ongoing |
| Java ZIP/JAR and Bedrock texture packs | `local-resource-pack.js`, browser smoke fixtures | Synthetic imports tested; no personal pack available in CI |
| Three-slot furnace, smelting recipes, fuels, timers, persistence | `furnace-engine.js`, `furnace-ui.js` | Implemented; long survival-playthrough validation ongoing |
| Crafting table and inventory interaction | `index.html`, inventory UI tests | Partially implemented; end-to-end recipe QA needed |
| Deep Overworld Y=-64..319, sea 63 | `world-depth.js`, `world-chunks.js` | Experimental generator only; playable world still H=48, SEA=14 |
| Deep caves, ores, bedrock, aquifers | `world-chunks.js`, `overworld-ores.js` | Deterministic preflight/tests, pocketed lava; no live deep-world playthrough |
| Mob navigation, sight, attack, creeper fuse | `mob-ai-rules.js`, `mob-expansion.js` | Implemented in part; hands-on combat QA needed |
| Mob skins, textures, animation | `mob-pixel-art.js`, `entity-texture-maps.js`, `mob-motion.js` | Partial; imported-pack and frame-by-frame visual QA needed |
| Structures, Nether, End, final boss | `world-chunks.js`, `nether-world.js`, `end-world.js` | Progression unverified; no claimed final-boss victory |
| Multiplayer and saved-world migration | `multiplayer.js`, `world-depth.js` | Legacy path active; deep-profile integration/migration pending |
| Desktop/mobile Chrome gameplay video | `scripts/browser-smoke.cjs`, GitHub Actions | Smoke clips captured in CI; full survival playthrough pending |

Priority gates: safely enable the deep profile for new worlds while preserving legacy saves; validate chunk/section memory, physics, rendering, multiplayer, save migration and FPS; then test survival progression with recorded, reproducible bugs and fixes.
