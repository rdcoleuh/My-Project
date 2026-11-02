# HUD fallback cache and transparent-underlay validation — 2026-11-02

- Source: `classic-hud-art.js` now caches each of six independently drawn 11×11 heart/food RGBA glyphs once and returns defensive copies. The 0–20 point model and left/right half-icon orientation are unchanged.
- Source: `local-resource-pack.js` rejects a fully transparent optional empty-glyph underlay after decoding a user-imported resource pack. This prevents invisible art from being treated as a usable backing when synthesizing half icons.
- Regression: `tests/hud-pixel-cache-and-underlay.test.cjs` checks defensive copying, all 21 stat values, and the imported underlay alpha guard. Existing browser smoke exercises synthetic Bedrock HUD and hotbar packs in desktop/mobile Chrome.
- All fixtures are original/generated; no proprietary Minecraft artwork is included.
- The playable 48-layer Overworld and current furnace rules are unchanged. Full deep-world integration and endgame playthrough remain unverified.

- CI follow-up: 956 Node tests passed on `90d6aec`, but desktop Chrome reached the glass furnace and failed to collect output because the test clicked the output button before the 250ms UI refresh enabled it. The smoke runner now waits for the button to become enabled before collection. Re-test is required; no gameplay-engine change was made for this failure.
