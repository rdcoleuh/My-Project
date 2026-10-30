# Smoker and blast furnace fuel parity — 2026-10-30

## Reproduction (engine regression)
Before this fix, a smoker or blast furnace completed a recipe every five seconds but burned coal for the full 80 seconds, smelting 16 items from one coal. An ordinary furnace produced only eight. The same imbalance applied to bamboo and other fuels.

## Change
New fuel ignition in smokers and blast furnaces uses half the normal burn duration, matching their half-length cooking timers. Ordinary furnaces remain unchanged. Already-burning fuel in older saved specialized stations is preserved, rather than retroactively changing the player's saved progress. No save format or artwork changed.

## Verification plan
Run `node --test tests/*.test.cjs`; the new tests cover all three station kinds, bamboo fuel, save/reload and legacy saved burners. Run the repository's desktop and mobile Chrome smoke workflow and verify the `gh-pages` deployment. Browser clips are post-fix gameplay, not pre-fix recordings; the before case is an engine-level reproduction.

## Limitations
The playable Overworld is still 48 layers, and a complete survival-to-endgame playthrough has not been verified. Player-owned texture packs are not available in CI; browser smoke uses an independently generated fixture.
