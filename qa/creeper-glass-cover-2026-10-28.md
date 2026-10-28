# Creeper blast cover: glass-block regression (2026-10-28)

## Reproduction before fix
A creeper detonating behind a two-block-high glass wall could still damage a nearby survival player. The explosion exposure check used the same passability predicate as mob vision. That predicate intentionally treats glass (block ID 9) as transparent, so all three explosion rays passed through it.

## Fix
The host simulation now uses `mobBlastPassable` for creeper explosion exposure, backed by the pure `blastBlockPassable` helper. Glass and other solid blocks stop blast rays, while air, water, and small crops retain the existing simplified passability model. Sight through glass is unchanged. No save schema or textures were modified.

## Verification
`tests/mob-ai-rules.test.cjs` checks full glass walls, partial glass cover, air, and the live host integration. The desktop/mobile Chrome smoke runner checks the same blast ray helper using independently created block-ID fixtures. The smoke tests do not place an actual glass wall in a saved survival world, and the existing gameplay recordings are not before-and-after clips of this fix.

## Follow-up
Record a real survival encounter with glass cover on desktop and mobile, using an explicitly labeled original test pack unless a user-imported pack is available. Verify multiplayer damage behavior and avoid claiming a complete progression playthrough until performed.
