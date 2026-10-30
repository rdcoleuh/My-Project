# Furnace namespaced save compatibility — 2026-10-30

## Reproduction

A saved furnace containing `modded:ore/raw_cobalt` in its input, `modded:charcoal_brick` as fuel or `other.mod:ingots/cobalt` as output previously dropped those valid stacks on live restoration. The deep-world migration preview rejected the same stacks. Such player-owned items must remain retrievable even when this build has no recipe for them.

## Fix

Live furnace restore and the non-mutating deep-world preflight now accept bounded, lowercase namespaced resource identifiers with safe path segments. Existing MineWorld item keys and numeric block keys retain their previous rules. Unknown items remain inert: they cannot be newly deposited as fuel or ingredients and cannot ignite or smelt. Invalid/prototype-like keys and malformed paths remain rejected.

## Verification

Run `node --test tests/furnace-namespaced-save.test.cjs` and the full `node --test tests/*.test.cjs` suite. Browser smoke and deployment results must be checked separately in Actions. No user-provided texture pack is bundled or redistributed. This does not activate the experimental 384-layer Overworld.
