# Partial imported hotbar sheet with explicit slot override — October 31, 2026

## Reproduction
The hotbar renderer previously set `useBackground=false` whenever even one imported slot sprite was present. For a player pack exposing a complete bar sheet plus a single separately authored slot, the full sheet disappeared and the remaining eight positions reverted to MineWorld's gray procedural tiles. This mixed two visual styles and ignored available player-imported art.

## Change
Retain the full nine-cell sheet behind a *partial* set of explicit slot overrides; paint explicit slot images above their corresponding positions. A generic slot sprite or all nine individual sprites remains authoritative, so the full sheet stays suppressed in those modes. Selection outline, accessible slot buttons, keyboard focus and game saves are unchanged. No proprietary bitmap assets are added.

## Verification
- `tests/hotbar-partial-sheet.test.cjs` exercises the actual production `refreshPackHotbarArt` renderer with partial, generic, complete and missing sprite cases.
- `scripts/browser-smoke.cjs` adds an original synthetic full-sheet-plus-one-slot fixture on desktop and mobile Chrome, checks CSS image precedence and selected outline, and captures screenshots `desktop-partial-sheet-slot-synthetic.png` and `mobile-partial-sheet-slot-synthetic.png`.
- The fixture is independently generated test artwork, **not** a user-owned Minecraft pack. Browser CI, deployment and downloadable artifact availability must be checked separately; this note is not a pass claim.
- Playable Overworld height remains 48 layers. No complete survival/end-boss playthrough is claimed.
