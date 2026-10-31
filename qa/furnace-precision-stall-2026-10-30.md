# Furnace precision stall — reproduction and fix (2026-10-30)

## Reproduction
Restore a valid furnace with `input=rawIron`, `fuel=coal`, `burn=0.000000001`, `burnTotal=80`, `progress=0`. Previously `tick(10)` calculated a step below `1e-7` and broke out, leaving a positive burn value forever. No new coal could ignite, and no smelting occurred.

A separate valid save with `progress=9.999999999`, `burn=30`, and two raw iron items also stalled just before the first smelt completed. A furnace with no spare fuel and a near-zero burn remainder could fail to cool its unfinished recipe.

## Fix
Normalize sub-threshold positive burn values to zero before choosing whether to refuel or cool. Complete recipes whose remaining cook gap is below the existing step epsilon, preserving remaining elapsed time for the next item. No saved schema, recipe, artwork, or world coordinates change.

## Regression coverage
`tests/furnace-precision-boundaries.test.cjs` covers refueling, near-complete cooking, unfueled cooling, and ordinary multi-item smelting. Browser smoke tests are broader gameplay checks and do not explicitly reproduce these precision edge cases. No before/after browser video was captured for this logic-only defect.
