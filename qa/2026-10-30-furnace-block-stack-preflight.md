# Furnace block-stack migration preflight regression — 2026-10-30

## Reproduction
The preview-only `planLegacySaveMigration` accepted ordinary furnace item keys but rejected valid `block:<id>` keys. Its regular expression accidentally used two backslashes before `d` in a JavaScript regex literal, matching a literal backslash instead of decimal digits. Real charcoal inputs (e.g. cherry log `block:40`), fuel (`block:116`) and output (`block:9`) caused a preflight failure. Previous tests covered only ordinary item keys.

## Fix
Corrected the furnace stack key pattern to recognize block IDs 1–999 without allowing malformed identifiers. Added deterministic Node regression coverage for all three furnace slots, single/two/three-digit IDs, mixed inventory, invalid keys, frozen detached previews, preserved absolute Y and untouched source saves. Bumped the service-worker cache key for offline clients.

## Verification and limitations
A direct V8 reproduction confirmed the previous code threw `Invalid saved furnace input stack`, while the corrected code preserved the original three block stacks. Full Node and browser smoke verification must be confirmed from GitHub Actions after the commit. This is **preview-only** migration validation: live Overworld height remains 48 with sea level 14. No deep-world activation, browser before/after recording, personal Minecraft resource-pack testing or final-boss victory is claimed.
