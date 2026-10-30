# Deep-world save-version and player-position preflight — October 30, 2026

## Reproduction and fix
Before: an untagged save with an unknown future version (e.g. 14) passed the legacy 48-layer height guard. Loading it could interpret future indices using the wrong stride and subsequently overwrite the original save. The experimental migration preview also reindexed block edits without checking the saved player's or dimension travel positions.

After: the legacy loader refuses malformed, negative, and post-v13 save versions before mutating the world. Untagged historical saves and current v13 saves remain supported. The opt-in migration preview validates the current dimension plus saved player/Overworld/Nether/End coordinates and returns detached, frozen coordinate snapshots with unchanged absolute Y. Invalid coordinates reject the entire preview. No saved world is rewritten.

## Verification scope
- Deterministic regression: tests/deep-save-position-preflight.test.cjs covers forward-version rejection, legacy compatibility, four position records, invalid dimensions/coordinates, and no source mutation.
- Existing profile tests updated for the more accurate refusal message.
- Browser smoke and Pages deployment must be confirmed from the GitHub Actions runs for this commit; this note itself is not a pass claim.
- Playable Overworld remains 48 layers. The 384-layer Y=-64..319 codec and renderer remain experimental, and no actual world migration or endgame playthrough is claimed.
- No user-provided resource pack is available in this run; existing browser tests use independently created synthetic fixtures. No proprietary Minecraft artwork was included.
- No dedicated before/after browser video of this preflight-only change was captured.
