# Mob pursuit memory: invalid frame delta regression (2026-11-02)

## Reproduction before fix

The pure `MineWorldMobAIRules.pursuitPoint` helper accepted `dt='1'` and `dt=Infinity` because it used `Number(dt)||0`. A string advanced memory as if it were a real frame, and Infinity expired a two-second last-seen target immediately. These are malformed timing inputs, not valid simulation time.

## Fix

Require a finite, positive JavaScript number before aging last-seen memory. Valid finite elapsed time still expires the two-second pursuit window, including genuine multi-second tab suspension. New sightings still refresh the last-seen position. No save schema, network format, or proprietary artwork changed.

## Verification

Run `node --test tests/mob-pursuit-invalid-delta.test.cjs` and the repository's full Node test suite. The new regression tests cover invalid inputs, normal timing, sighting refresh, and service-worker asset inclusion. Browser gameplay clips are not represented as before/after recordings unless captured by a separate verified Chrome workflow. This change does not complete deep-world integration, furnace feature parity, or a full survival playthrough.
