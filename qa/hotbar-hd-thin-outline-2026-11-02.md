# Imported HD hotbar outline compatibility — 2026-11-02

## Reproduction
A valid player-owned 8x hotbar strip (1456x176 bordered or 1440x160 seamless) can contain a continuous one-source-pixel outline around each 160x160 slot. The outline occupies 636/25600 pixels (2.48%), below the previous per-cell 5% alpha threshold. As a result, a complete nine-slot pack image was discarded in favor of procedural fallback. This is a source-image validation issue, not a blur or CSS scaling issue.

## Fix
Keep the existing 5% visible-alpha requirement for ordinary filled art. For lower-coverage cells, additionally accept a thin continuous edge outline with at least 75% visible pixels on each of the four sides (allowing up to two source-pixel inset). All nine cells must pass; incomplete sheets continue to fall back. No bitmap artwork is bundled or copied.

## Regression checks
- 4x and 8x, bordered and seamless player-pack dimensions.
- Continuous one-pixel outlines accepted.
- One blank slot rejects the whole sheet.
- Scattered isolated pixels rejected.
- Native 1x/2x sheets continue to use the existing coverage threshold.

## Limits
This tests the resource-pack validation logic. A personal Java/Bedrock pack was not available; independently generated RGBA fixtures are used. Browser screenshot/video verification and GitHub Pages deployment must be confirmed separately after CI. No deep-world migration or furnace behavior changed.
