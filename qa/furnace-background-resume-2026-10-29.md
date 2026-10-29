# Furnace background-tab resume — 2026-10-29

## Reproduction
1. In a private Survival world, place a furnace, load nine raw iron and one coal.
2. Leave the furnace window open, then background/suspend the browser for 30–60 seconds.
3. On returning, the old live render loop passed at most one second to the furnace engine, even though the elapsed frame interval was much longer. Smelting lagged behind elapsed time.

## Fix
The live render loop now passes up to 60 seconds of real elapsed time to the existing bounded furnace engine, while ordinary physics remains capped at 0.05 seconds. This limits CPU catch-up work and prevents unbounded offline smelting. Existing furnace save data is unchanged.

## Regression coverage
The Node suite checks the live-loop clock limit, a 60-second catch-up with a one-hour simulated pause, output quantities, fuel depletion, and save/restore continuation. Browser smoke tests cover furnace UI and resource-pack fixtures but do not reproduce a real 60-second suspended mobile tab. Before/after video of this specific bug is not captured by the current workflow.

## Limitations
Only the most recent 60 seconds are simulated after a long suspension. This is deliberate for bounded CPU work and is not full offline furnace processing. No user-owned resource pack is available to the CI environment.
