# Deep cavern band — 2026-11-02

## Scope
Staged **Y=-64..319** Overworld only. Deep cave noise threshold now tapers from 0.745 at Y=-56 and -8 to 0.670 at Y=-32. The same seeded world-coordinate noise is reused without additional samples, avoiding per-chunk seams and extra generator noise cost. Existing 48-layer worlds are unchanged. No third-party art or code is bundled.

## Reproduction and expected change
With seed 85721 at chunk (312,312), the Y=-40..-24 underground air-cell count increases from 257 to 606 across 16x16 columns. The adjacent (312,312)/(313,312) X-border cave-air agreement in the -56..-8 band is 758/784. The bedrock floor stays at Y=-64.

## Verification
Local JavaScript preflight evaluated the repository's actual ore and world generators, compared original and changed legacy chunk bytes, counted deep air cells and checked the chunk seam and bedrock. Node CI and browser smoke results must be checked separately after pushing; the live game still uses H=48, SEA=14. No deep-world gameplay video or boss playthrough is claimed.
