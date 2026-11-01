# Deep-world saved edit replay guard — 2026-11-01

The experimental 384-layer chunk streamer now checks each generated section against its saved block edits before installing it. A generator that ignores saved placed blocks or explicit mined-air edits is rejected instead of silently losing player modifications. Existing loaded chunks are preserved on rejection. Generated stores must also expose the memory statistics method required by the stream's mobile budget accounting.

Scope: experimental deep-world module only. The live game still uses H=48 and SEA=14; no full-depth gameplay or player-imported pack is claimed here. The regression test fixture creates independent block arrays without proprietary textures.

Tests: `tests/deep-edit-replay-guard.test.cjs`. Browser smoke recordings, if produced by CI, demonstrate the existing live game rather than this staging module.
