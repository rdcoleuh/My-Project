# Creeper fuse validation — 2026-11-02

## Reproduction on gh-pages
Before this change, `creeperTick(Infinity, 0.1, true)` returned `{fuse:1.5, explode:true}`, and `creeperTick("1.5", 0.1, true)` did the same. A non-finite elapsed time `creeperTick(0, Infinity, true)` also advanced the fuse by 0.1 seconds instead of ignoring the invalid delta.

## Fix
Accept only finite numeric saved fuse values and finite positive numeric frame deltas. Invalid fuse values restart from zero, while invalid frame deltas do not advance the countdown. The existing 0.1-second maximum frame step, 1.5-second fuse, and defusing behavior remain intact. No save schema, mob art, or gameplay control changed.

## Regression
`tests/mob-creeper-fuse-validation.test.cjs` exercises invalid fuse values, invalid elapsed time, normal detonation, defusing, and service-worker cache invalidation. Run `node --test tests/mob-creeper-fuse-validation.test.cjs` or the full `node --test tests/*.test.cjs` suite.

## Evidence and limits
The bug was reproduced using the current GitHub source in a JavaScript runtime before editing; the patched pure function passed seven direct assertions before commit. Browser smoke tests and Pages deployment are tracked by the push-triggered GitHub Actions workflow and must be checked separately. No before-and-after browser recording of this isolated mob timer bug was captured. The game remains on the legacy 48-layer playable Overworld; full deep-world integration and a completed survival playthrough are unverified.
