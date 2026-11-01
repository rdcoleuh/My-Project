# Deep-world terrain preflight — 2026-11-01

## Reproduction and fix

The experimental signed-coordinate terrain generator accepted an arbitrary safe-integer SEA even when it exceeded the chunk's vertical profile. A large value could make the per-column water loop run for millions of iterations, freezing a mobile tab. It also validated saved edit identifiers only after caves, ore veins, trees and structures were generated, wasting substantial work before rejecting a corrupt save.

The generator now requires SEA to lie within the chunk's [minY, minY+H-1] range, and validates all edit keys and block IDs before allocating or generating terrain. Replaying valid saved edits (including air and bedrock modifications) is unchanged. Legacy H=48/SEA=14 and staged H=384/minY=-64/SEA=63 remain supported. This is a staging safety change; it does not activate the deep Overworld in live gameplay.

## Regression coverage

`tests/deep-generator-preflight.test.cjs` covers extreme and fractional sea levels, legacy and deep generation, late malformed Map entries rejected before the ore generator runs, unchanged caller-owned save maps, and signed-coordinate air/bedrock edit replay.

## Browser evidence limitations

Existing desktop/mobile Chrome smoke workflows exercise live legacy gameplay and synthetic independent resource-pack fixtures, not this experimental deep-world generator. They do not constitute a full survival playthrough, a player-owned texture-pack test, or before-and-after gameplay footage of the preflight guard.
