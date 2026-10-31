# Deep-world namespaced dropped-item preflight — 2026-10-31

A valid future/custom dropped item such as `modded:ore/raw_cobalt` previously failed the legacy-save migration preview, even though player inventories and furnaces accepted the same key. This prevented safe migration planning for player-owned loot.

The preview now accepts bounded namespaced identifiers up to 192 characters, preserves dimension, coordinates, quantity and nested metadata, and rejects malformed identifiers without mutating the save. Five regression tests cover three dimensions, metadata detachment, syntax and length, atomic rejection, and consistency with inventory and furnace slots.

**Scope:** preview-only; no actual world migration, rendering change or gameplay scenario has been completed. Live Overworld still uses H=48 and SEA=14. Isolated JavaScript sanity checks passed before commit; consult the GitHub Actions run for Node and browser results. Any recorded gameplay is general smoke-test footage, not a before/after reproduction of this preview-only defect. No user-owned resource pack was available.
