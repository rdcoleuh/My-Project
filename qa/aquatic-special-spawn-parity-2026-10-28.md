# Aquatic and special mob spawning parity — 2026-10-28

## Source comparison
- Minecraft Wiki, [Sniffer](https://minecraft.wiki/w/Sniffer): sniffers hatch from eggs recovered through archaeology; they do not spawn from a biome's ordinary passive spawn list.
- Minecraft Wiki, [Phantom](https://minecraft.wiki/w/Phantom): phantoms require a player to have gone at least three game days without rest and other sky/light conditions; they must not be rolled as generic plains/meadow nighttime monsters.
- Minecraft Wiki, [Drowned](https://minecraft.wiki/w/Drowned): drowned are hostile underwater undead and naturally appear in oceans and rivers.
- Minecraft Wiki, [Spawn](https://minecraft.wiki/w/Spawn): oceans and rivers have aquatic-specific wildlife rather than ordinary farm animals.

## Reproduced code defects
1. Drowned was marked `neutral`, so its AI did not target players until provoked.
2. Sniffers were selected as naturally spawning warm-ocean wildlife despite being egg-only.
3. Phantoms were rolled as generic plains/meadow monsters without an insomnia counter.
4. The initial and periodic wildlife loops never chose fish, squid, dolphins or other aquatic creatures in ocean/river biomes.

## Changes
- Drowned is hostile and eligible in the river/ocean hostile-biome pool.
- Removed sniffer and phantom from generic natural spawn pools; both remain summonable in Creative.
- Added bounded aquatic-biome selection (fish, squid and dolphins), wired into initial and periodic wildlife spawn attempts. The existing `spawnOne` water-column and collision guards remain authoritative; dry coordinates cannot create fish.
- Updated service-worker cache label so returning browsers refresh the new rules. No world-save schema, imported artwork, or gameplay inventory data changed.

## Known limitations
- Phantoms are **not yet naturally spawned**; future work needs a persistent time-since-rest statistic, roof/sky checks, and flying spawn placement.
- Aquatic spawn weights, school sizes, biome-specific Y/depth/light checks, and water-column suitability still differ from Java/Bedrock.
- Drowned can be chosen by the night hostile loop, but daytime underwater spawning and conversion from submerged zombies are not implemented.
- The game has simplified swimming AI and collision; this does not establish full feature parity.
- Node/Chrome CI, Pages deployment, and recordings must be inspected after publishing. Fixture packs are not user-supplied game textures.
