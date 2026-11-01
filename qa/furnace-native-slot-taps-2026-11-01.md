# Furnace native-slot interaction — 2026-11-01

This increment makes the three existing furnace slots native buttons. Tap or press Enter/Space on an ingredient or fuel slot to add one selected item when available; when the selection cannot be added, tapping returns one from that slot. Shift-click adds a stack. Alt/Ctrl/Meta-click withdraws one, with Shift to withdraw a stack. Tapping output collects its stack; Shift-click collects one. Existing large add/take buttons remain for mobile access. All transfers continue through the pre-existing reconciled inventory API; no save format or furnace timer changes.

Regression coverage: gesture planning, touch/keyboard markup, inventory conservation, and browser-driven taps on desktop/mobile Chrome. The browser smoke script now captures furnace slot-tap screenshots. Resource-pack tests use independently generated fixtures, not player-owned artwork. This document describes intended verification; inspect GitHub Actions before treating any test as passed.

Limitations: This does not implement 384-layer live terrain, multiplayer furnace inventories, full gameplay progression, or a final-boss victory. Before-and-after defect-specific videos are not recorded by this change.
