# Deep-world villager trade preflight — 2026-10-31

The version-13 save includes villagerProgress (resident XP, offer-use counters and last restock day), but the 384-layer migration preview previously omitted it. A migration using only the preview could reset unlocked tiers or refill offers.

The preview now validates and preserves up to 500 villager records as detached, frozen data. Invalid IDs, XP, restock days, offer counters, accessors and unsafe object keys abort the entire preview. Missing fields in older saves remain compatible. No live terrain or save migration is enabled.

New Node tests cover preservation, independence, legacy saves, malformed and hostile data, collection limits, and unchanged live height. GitHub Actions browser smoke, artifact and Pages status are checked after pushing. Tests use synthetic resource-pack fixtures, not user-owned textures.
