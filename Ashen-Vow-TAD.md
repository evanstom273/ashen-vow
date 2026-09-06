# Ashen Vow — Technical Architecture Document

**Version:** 0.2  
**Runtime:** Vite, TypeScript, HTML5 Canvas, CSS  
**Deployment:** GitHub Pages (static build from `dist/`)

## Architecture overview

Ashen Vow is a single-page, client-side, canvas-first game. `index.html` defines the HUD shell, overlays, touch controls, and canvas. `src/style.css` defines responsive presentation. TypeScript modules under `src/game/` own simulation, input, rendering, audio, and DOM synchronisation.

```text
index.html
 └─ src/main.ts
     ├─ style.css
     └─ game/
         ├─ Game.ts                 loop orchestration, modes, lifecycle
         ├─ types.ts                domain interfaces
         ├─ constants.ts            world/arena helpers
         ├─ content/              typed balance and boss definitions
         ├─ state/                  create/reset factories
         ├─ input/                  keyboard, touch, gamepad adapters
         ├─ systems/                combat, player, boss, projectiles, hazards
         ├─ effects/                particles and shake decay
         ├─ render/                 Canvas 2D renderer
         ├─ audio/                  Web Audio wrapper
         └─ ui/                     DOM HUD and overlay controllers
```

The game loop and simulation state remain independent of DOM rendering. HUD elements are updated from simulation state each frame; they are not the authoritative source of gameplay state.

## Runtime model

`Game` bootstraps input bindings, audio initialisation, and a `requestAnimationFrame` loop. Each frame computes clamped delta time, updates simulation (unless paused), renders the arena, and repeats. Simulation coordinates use a ~1100 × 850 world space centred on the arena. Rendering translates and scales this world space to the viewport.

## Tooling

| Command | Purpose |
|---|---|
| `npm install` | install dev dependencies (Vite, TypeScript) |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | typecheck (`tsc`) then Vite production build to `dist/` |
| `npm run typecheck` | TypeScript checking only |
| `npm run preview` | serve the production build locally |

Dependencies are intentionally minimal: Vite and TypeScript only.

## State

Top-level state includes:

- `mode`: title, play, pause, dead, or win
- `player`: position, health, stamina, flasks, facing, roll, invulnerability, cooldowns, healing, and charge-related timers
- `equippedSpellId` and `spells`: per-spell remaining casts and cooldown timers
- `boss`: position, health, facing, finite-state-machine state, attack timer, attack target, combo counter, and phase flash
- `shots`: active sorcery projectiles
- `hazards`: temporary blast and expanding ring hazards
- `particles`: short-lived visual effects
- `phase2`: whether the boss has crossed the 50% health threshold

State is created via `createInitialGameState()` and reset via `resetCombatState()` when a new attempt begins.

## Content separation

Hardcoded prototype values are grouped under `src/game/content/`:

- `playerDefaults.ts` — player starting stats and action tuning
- `spells.ts` — spell definitions (max casts, cooldown, projectile tuning, rest recharge flag)
- `aeron.ts` — Aeron boss stats, phase labels, and attack definitions
- `arena.ts` — arena geometry constants

Systems in `src/game/systems/` execute behaviour using this data. Adding another boss or attack pattern should primarily mean adding content definitions and wiring selection logic, not rewriting combat primitives.

## Boss finite-state machine

```text
idle → windup → attack → recover → idle
                 ↘
                  death / victory
```

`idle` approaches the player and selects an attack when its timer expires. `windup` exposes the attack telegraph and stores the relevant target position. `attack` applies damage and movement. `recover` gives the player a punish window. Phase transition temporarily uses the recover state while the radial effect is emitted.

## Input architecture

`InputSystem` maps keyboard, touch, and Gamepad API input into logical action keys consumed by player/combat systems:

- `handleAction(key)` — dodge, strike, cast start, heal, pause
- `castSorcery()` — converts a held cast into a basic or charged projectile
- `getMovementInput()` — combines keyboard, arrow, touch, and stick movement

Gameplay systems do not depend on which physical device triggered an action.

## Combat rules

All combat is real-time and distance based. Melee checks player-to-boss distance at swing time. Projectiles move with velocity and check distance to the boss each update. Damage is blocked while `player.inv > 0`. Arena containment clamps both actors to the circular boundary. Ring hazards compare the player's distance to an expanding radius.

## Rendering

`CanvasRenderer` draws layers in the same order as the original prototype:

1. Full-screen background and vignette
2. Radial arena and masonry tiles
3. Arena rings, radial seams, pillars, fog gate, and lamps
4. Boss telegraphs and active hazards
5. Actors, weapons, projectiles, and particles
6. Atmospheric dust and screen shake

Actors remain procedural Canvas shapes rather than external image assets.

## UI integration

`DomHud` updates health, equipped spell remaining casts, stamina, flask count, status text, boss health, and phase text from simulation state. `OverlayController` manages title/pause/death/victory copy and the `body.playing` class. Plain DOM/CSS is used throughout; no component framework is involved in the game loop.

## Audio

`AudioManager` creates short oscillator envelopes for attacks, spells, damage, healing, and phase transition. Audio initialises after the first user gesture. If Web Audio is unavailable, the game remains playable silently.

## Responsive behaviour

CSS uses viewport sizing and media queries. On coarse pointers, touch controls appear and the keyboard footer is hidden. The canvas scales through `CanvasRenderer.resize()`.

## Assets

Future external assets should live under:

```text
src/assets/images/
src/assets/audio/
src/assets/data/
```

These directories are reserved placeholders. The current build still uses procedural visuals and synthesized audio.

## Deployment

GitHub Actions workflow `.github/workflows/static.yml`:

1. checks out the repository
2. runs `npm ci`
3. runs `npm run build`
4. publishes `dist/` to GitHub Pages

Vite `base` is set to `/ashen-vow/` in `vite.config.ts` so scripts and styles resolve under the project Pages URL.

`hosting.json` at the repository root is a legacy ChatGPT Sites export artifact and is not used by the current GitHub Pages pipeline.

## Migration notes (v0.1 → v0.2)

This release is an architectural migration only. Gameplay timings, controls, boss behaviour, HUD copy, and procedural presentation were preserved from the original monolithic `game.js` implementation.

Preserved prototype quirks documented for future reference:

- Player max HP/SP are hard-coded to 100 in multiple places rather than always referencing shared constants.
- Spell charges replenish when entering/resting at the sanctum (starting or retrying an attempt), not mid-fight.
- Boss attack selection uses a simple rotating combo counter rather than weighted or reactive AI.
- Ring hazard collision uses a fixed tolerance band (`abs(distance - radius) < 13`).
- Sorcery charge visual particles spawn probabilistically (`Math.random() < 0.5`).
- Death/victory overlay updates are delayed by 1000 ms via `setTimeout`.

## Future technical work

Potential next steps include additional typed boss content files, hitbox visualisation/debug mode, animation state objects, external sound assets, gamepad remapping, pause-safe audio handling, and optional React (or similar) for menu-heavy UI outside the canvas loop.
