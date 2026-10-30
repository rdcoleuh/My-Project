# Furnace transfer balance reconciliation — 2026-10-30

## Reproduction and fix
A buggy inventory adapter could report a successful debit without removing
items, causing a furnace deposit to manufacture items. Conversely, an adapter
could add items while reporting a failed credit, leaving the output in place
and duplicating materials on the next collection. A reported credit greater
than the requested amount could also withdraw too much from a furnace.

Deposits now compare the observed inventory count with the expected debit;
withdrawals compare observed credit with the reported and requested amounts.
Mismatches fail closed and attempt to reverse the actual inventory delta.
Ordinary and legitimate partial transfers remain supported.

## Verification scope
- Deterministic Node regression tests: tests/furnace-transfer-balance.test.cjs
- Existing furnace, save, texture-pack and desktop/mobile smoke suites run in
  GitHub Actions on push to gh-pages.
- This is an inventory-adapter fault injection, not a visual gameplay bug.
  Generic gameplay recordings are not before/after demonstrations of the
  injected defect; no dedicated before/after recording is claimed.
- Resource-pack browser tests use independently generated fixtures unless
  an actual player-imported pack is explicitly supplied.
- Live Overworld remains the legacy 48-layer format. This change does not
  activate the experimental Y -64..319 world or modify saved world formats.
