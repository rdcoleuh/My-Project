# Transparent imported HUD sprite fallback — October 28, 2026

## Reproduction
A player-imported Java/Bedrock texture pack may contain a fully transparent PNG placeholder for the heart, hunger, hotbar background, or selected-slot sprite. Before this fix, the importer accepted the PNG because it had valid dimensions, then replaced MineWorld's visible procedural fallback with invisible artwork. An opaque empty-heart background could also hide that the requested full/half-heart foreground was blank.

## Fix
Validate decoded sprite alpha in the browser before compositing optional empty-icon underlays. Fully transparent imported sprites return null so the existing procedural HUD/selected-slot fallback remains available. RGB values with alpha=0 do not count as visible. The normal draw order and resource-pack cache remain unchanged. No Minecraft bitmap art was added.

## Verification
Node regression: synthetic alpha-channel tests, 447/447 passing on GitHub Actions run 40694152850. Desktop and mobile Chromium smoke tests passed on that run, including an independently generated transparent PNG fixture. GitHub Pages deployment of commit 8b3163ffd1072844e7623058d7a5d3533081612a succeeded on run 40694152301.

## Limitations
The fixture is independently generated, not the user's Minecraft resource pack. The browser recordings are general gameplay clips, not a before-and-after capture of this specific bug. A complete survival-to-final-boss playthrough remains unverified.
