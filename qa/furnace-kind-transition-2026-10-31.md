# Furnace station-type transition regression — 2026-10-31

## Reproduction
Before this fix, opening an existing smoker or blast-furnace record as a normal furnace through `ensure(position, 'furnace')` left its specialized kind unchanged. Conversely, changing a burning normal furnace to a smoker/blast furnace retained its full burn timer despite doubling cooking speed, granting extra smelts from the same coal.

## Fix
Treat an omitted kind as a lookup/create request. Explicit kinds now correct the station type in either direction. Scale both active burn and original burn duration by the specialized/normal burn-rate ratio to conserve fuel's remaining smelting capacity. Reset partial cooking progress when a station type changes. Preserve all three inventory slots and existing save schema.

## Verification
`tests/furnace-kind-transition.test.cjs` covers both directions, fuel parity, progress reset, unchanged ordinary insertion, invalid kinds and save/restore. GitHub Actions runs the full Node regression suite and desktop/mobile Chrome smoke checks after the branch update.

## Limitations
This is a furnace state-engine correction, not a browser recording of a physical block replacement. No user-owned texture pack was supplied to this test. Browser smoke uses independently generated resource-pack fixtures. The playable Overworld height is unchanged.
