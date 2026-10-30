# Imported half-heart underlay parity — 2026-10-30

## Reproduction
In Survival, take one point of damage (19/20 health), then import an independently generated Bedrock resource pack containing a filled heart and empty heart but **no half-heart sprite**. The half icon was composed from a clipped full sprite over MineWorld's procedural empty heart, even though the pack supplied its own empty art. The mismatch was visible in the unfilled half.

## Fix
For a half heart or food icon, resolve the pack's empty sprite through the existing generation-aware sprite cache. Use that player-imported empty image as the underlay whenever available; otherwise retain the procedural empty outline. After the asynchronous lookup, reject stale results when the pack/generation changes or the icon is detached. Preserve half clipping direction, ten-icon HUD, labels and nearest-neighbor scaling. No proprietary bitmaps are committed.

## Verification
Node regression tests exercise full+empty without half, missing-empty fallback, and stale pack replacement. Desktop/mobile Chrome smoke scripts import a synthetic full+empty pack, verify the rendered underlay source and decoded image dimensions, and capture a screenshot. These fixtures are **original test artwork**, not the user's Minecraft pack. A full survival playthrough and endgame completion are not established by these tests.
