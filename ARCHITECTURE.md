# Ashen Vow Architecture

Ashen Vow is organized so game rules, world data, flow, rendering, and content can grow independently.

## State layers

- **Combat state** lives in `GameState`: current player/boss runtime values, hazards, projectiles, particles, phase and cooldowns.
- **Persistent world state** lives under `GameState.world`: boss life/death state, checkpoint state, generated regular-enemy configurations and general flags.
- `resetCombatState()` resets a fight without destroying persistent world state.
- Checkpoint rest behavior is centralized in `world/checkpoints.ts`.

## Scenes and flow

`SceneController` owns transitions between title, world, combat, pause, transition, dead and victory scenes. The allowed transition table in `flow/sceneTransitions.ts` is both runtime-checked and TypeScript-checked.

The legacy `GameMode` remains as a compatibility projection for input/UI code while the scene model becomes the authoritative flow state.

## Areas

`content/areas.ts` contains typed `AreaDefinition` records. Areas define:

- identity and kind
- display copy
- collision bounds
- spawn points
- exits
- boss association
- procedural art theme

Collision consumes generic circle/rectangle bounds through `constrainToArea()`; game systems do not need fight-specific boundary branches.

## Entities

Shared entity contracts distinguish actors, bosses, NPCs, interactables, projectiles and hazards. These are intentionally data-oriented rather than class-heavy, so future areas can declare content without coupling it to rendering.

## Enemies and bosses

Shared enemy identity metadata lives in `content/enemies.ts` as typed `EnemyDefinition` records. The definition owns reusable properties such as enemy category, display name, maximum health, rune reward and controller ID. Boss encounters in `content/fights.ts` reference an enemy definition rather than duplicating those values.

Regular overworld enemies are authored as fixed spawn slots in `world/enemySpawns.ts`. On new-world creation, each slot resolves once into a persistent `GeneratedEnemyConfig` (archetype, stationary/patrol state, weapon class and spell loadout). Grace respawns reconstruct runtime enemies from those saved configs rather than rerolling them.

Boss behavior is dispatched through the `BossController` interface using the controller ID declared by the enemy definition.

- `content/enemies.ts` — shared enemy definitions
- `bosses/aeronController.ts`
- `bosses/vaelController.ts`
- `systems/bossUpdate.ts` — boss controller registry/dispatcher
- `systems/worldEnemies.ts` — generic regular-enemy perception, pursuit and combat AI
- `content/weapons.ts` — shared weapon-class behaviour and visual identities
- `state/worldEnemyState.ts` — one-time generation and runtime reconstruction

This keeps enemy data separate from encounter-specific boss phases and attacks. Authored spawn placement stays stable while regular-enemy composition can vary per new world, and shared weapon-class data is reusable by future player equipment.

## Rendering

The Canvas renderer consumes the current area and its art theme. Procedural art themes live in `render/artThemes.ts`; arena and boss rendering use registries rather than central fight-ID conditionals where practical.

Gameplay state remains renderer-independent.

## Events

`GameEventBus` provides a lightweight typed event boundary for scene changes, area entry, boss defeat, player death and checkpoint rest. Systems can react without directly owning each other.

## Validation

Pull requests run `.github/workflows/ci.yml`, which performs the full TypeScript check and Vite production build before merge.

## Intended expansion path

The next world-scale feature can now be built as area/content data rather than by expanding the boss-demo assumptions in `Game.ts`. The planned overworld can add a new AreaDefinition, exits/interactables and a world scene while reusing persistent world state, scene transitions, generic bounds, events, checkpoints and existing boss controllers.


## Player progression

Player progression is data-driven through `src/game/content/progression.ts`.

- Players currently start at level 1 with Vigor, Endurance, Strength, Dexterity, Intelligence, Faith, and Arcane all at 10.
- Each committed attribute increase raises character level by one.
- Level 1 -> 2 costs 200 runes; each successive level costs 7.5% more than the previous level, rounded to a whole rune.
- Vigor drives the max-HP curve, ending at 630 HP at 99 Vigor.
- Endurance drives max stamina, ending at 750 stamina at 99 Endurance.
- Endurance also increases movement speed up to +10% and dodge distance up to +15%, both capped at 30 Endurance.
- Strength, Dexterity, Intelligence, and Faith are reserved for shared weapon/catalyst requirements and scaling.
- Arcane is intentionally levelable but currently has no gameplay effect.
- Leveling is performed at Grace. Changes are staged in a draft, previewed, and only spend runes when confirmed.
