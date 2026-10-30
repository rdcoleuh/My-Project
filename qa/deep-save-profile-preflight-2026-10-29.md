# Deep-world save profile preflight — 2026-10-29

This increment tags **newly saved live worlds** with `legacy-0-47` and refuses to decode unknown or future deep-height profiles in the 48-layer live engine. Previously, future deep saves could be silently interpreted with the wrong index stride.

`MineWorldWorldDepth.planLegacySaveMigration` is an **opt-in preview only**. It validates all three dimension edit maps and reindexes Overworld edits to Y -64..319 without mutating saved data; Nether/End indices retain their legacy profile. It rejects malformed, duplicate and incompatible records instead of returning partial conversion.

**Not completed:** terrain and sea-level migration, player/entity position mapping, chunk streaming, collision, lighting, multiplayer protocol, browser playthroughs and live deep-world activation. Do not use the preview to replace an existing save. No proprietary assets were used.
