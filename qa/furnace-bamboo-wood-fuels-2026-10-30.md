# Furnace bamboo and wooden-fuel reproduction/fix — 2026-10-30

## Reproduced defect
The furnace engine accepted the loose inventory item `bamboo` as fuel, but world-generated bamboo is also available as a placeable `block:45`. That harvested block was absent from `FUEL` and therefore could not appear in the furnace fuel selector or ignite a furnace. Craftable wooden stations and accessories were also missing from the fuel catalog.

## Fix
Commit [55852d264e0974a43100377066e80caf085faa17](https://github.com/rdcoleuh/My-Project/commit/55852d264e0974a43100377066e80caf085faa17) adds harvested bamboo, crafting tables, chests, barrels, composters, and supported wooden accessories to the independently authored fuel registry. The loose bamboo item remains compatible. Four bamboo blocks now provide four 2.5-second burns, sufficient for one ten-second iron smelt.

## Verification
The [GitHub Actions regression and browser run](https://github.com/rdcoleuh/My-Project/actions/runs/41113763038) completed successfully on October 30, 2026: **645 Node tests passed, 0 failed**, and desktop and mobile-touch Chrome smoke tests passed. The smoke script uses actual in-browser furnace placement, inventory selection, four harvested bamboo blocks, ten-second cooking, output collection, and cleanup. It saves `desktop-furnace-bamboo-smelt-synthetic.png` and `mobile-furnace-bamboo-smelt-synthetic.png`.

The [first successful artifact](https://github.com/rdcoleuh/My-Project/actions/runs/41113763038/artifacts/13003604353) contains browser videos and screenshots. The generated resource pack is an **independently authored synthetic fixture**, not a player-supplied Java/Bedrock texture pack. No proprietary Minecraft artwork was copied. The first run's final video clips were generically labeled for HUD/workbench; the next workflow update gives these clips accurate bamboo-furnace labels.

## Limits and next steps
The videos are **after-fix gameplay**, not a verified before/after pair: the original missing-fuel-picker defect was established by code inspection and regression tests, and no pre-fix browser recording was captured. The public Pages deployment workflow succeeded, but direct independent gameplay retrieval has not been established here. The playable Overworld remains at H=48, SEA=14; the experimental Y -64..319 generator is not live. A complete survival-to-final-boss playthrough has not been verified.
