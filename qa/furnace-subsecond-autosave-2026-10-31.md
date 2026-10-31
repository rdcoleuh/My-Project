# Furnace sub-second autosave regression — 2026-10-31

## Reproduction
A furnace can consume residual fuel or cool a partial cook for less than one second and then become idle. The previous render loop accumulated only frames with `r.changed` and did not set `dirtySave` until their total elapsed time reached one second. If no further furnace changes occurred, the eight-second autosave could skip that changed machine state.

## Fix
Set `dirtySave` on every furnace tick reporting `changed`, even for 1 ms. The existing periodic save timer still throttles actual localStorage writes; no additional write is performed per frame. This preserves the current save schema, furnace recipes, HUD, imported artwork, and world dimensions.

## Verification plan
Run `node --test tests/furnace-subsecond-autosave.test.cjs`, then the full Node suite and desktop/mobile Chrome smoke workflow. Tests execute the actual render-loop fragment with simulated 1 ms, 200 ms, unchanged, and suspended-frame inputs. They verify that the dirty mark happens immediately and that unchanged frames do not mark dirty.

## Recording and pack provenance
This is a save-state scheduling defect, not a visible bitmap change. General browser smoke recordings, if CI produces them, do not constitute a before-and-after video of this defect. No user-owned Java/Bedrock pack is supplied to this run; existing synthetic pack fixtures are independently generated and must not be labeled as the user's textures. Full deep-world activation and a complete survival playthrough are not claimed.
