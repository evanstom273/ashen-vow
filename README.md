# Ashen Vow

A compact dark-fantasy action boss duel inspired by the combat rhythm, stamina management, dodge timing, sparse presentation, and oppressive atmosphere of Souls-style action RPGs.

**Play it here:** https://evanstom273.github.io/ashen-vow/

## About

Ashen Vow began as a six-minute playable prototype generated from the prompt:

> "Make me a game. Inspired by Elden Ring"

The original prototype was created with ChatGPT Sites, then exported as normal editable source code and moved into this repository for further development.

The player enters a ruined sanctum and faces **Aeron, the Hollow King** in a short, repeatable boss encounter built around reading telegraphed attacks, managing stamina, dodging, striking, casting sorcery, healing, and exploiting recovery windows.

## Current features

- Real-time boss combat
- Stamina management
- Directional dodge roll with invulnerability frames
- Melee attacks
- Sorcery with tap and charged casts
- Interruptible healing
- Boss attack telegraphs and punish windows
- Three boss attack patterns
- Second phase transition at 50% health
- Keyboard, touch, and gamepad input
- Responsive browser UI
- Lightweight procedural visuals, particles, screen shake, and Web Audio effects
- Death, retry, victory, and replay flow

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | WASD / Arrow Keys | Left Stick |
| Dodge | Space | B / Circle |
| Strike | J | R1 |
| Sorcery | K, release to cast | R2 |
| Heal | E | X / Square |
| Pause | Esc | Menu / Start |

## Development

Ashen Vow is a canvas-first browser game built with **Vite**, **TypeScript**, **HTML5 Canvas**, **CSS**, the **Web Audio API**, and the **Gamepad API**. There is no React or external game engine in the current stack.

### Requirements

- Node.js 22+ recommended
- npm

### Commands

```bash
npm install
npm run dev
npm run build
npm run typecheck
npm run preview
```

- `npm run dev` — local development server with hot reload
- `npm run build` — typecheck and produce a static production build in `dist/`
- `npm run typecheck` — TypeScript checking only
- `npm run preview` — serve the production build locally (uses the GitHub Pages base path)

### Project structure

```text
index.html                     Vite entry HTML (HUD, overlays, canvas shell)
src/
  main.ts                      application bootstrap
  style.css                    responsive UI styling
  assets/                      reserved for future images, audio, and data files
  game/
    Game.ts                    game loop orchestration and mode flow
    types.ts                   shared domain types
    constants.ts               world/arena math helpers
    content/                   typed game content (player tuning, Aeron boss data)
    state/                     initial/reset state factories
    input/                     keyboard, touch, and gamepad adapters
    systems/                   combat, player actions, boss AI, projectiles, hazards
    effects/                   particles and screen shake helpers
    render/                    Canvas 2D renderer
    audio/                     Web Audio wrapper
    ui/                        DOM HUD and overlay controllers
.github/workflows/static.yml   GitHub Pages deployment
```

Simulation, rendering, and input remain independent of any UI framework so future menu-heavy UI (for example React) can be added later without rewriting combat logic.

## Deployment

Production builds are deployed automatically to GitHub Pages when changes are pushed to `main`.

The workflow runs `npm ci`, `npm run build`, and publishes the contents of `dist/`. Vite is configured with `base: '/ashen-vow/'` so assets resolve correctly at https://evanstom273.github.io/ashen-vow/.

## Documentation

- [`Ashen-Vow-GDD.md`](./Ashen-Vow-GDD.md) — Game Design Document
- [`Ashen-Vow-TAD.md`](./Ashen-Vow-TAD.md) — Technical Architecture Document
- [`Ashen-Vow-source.zip`](./Ashen-Vow-source.zip) — original exported prototype source

## Status

**v0.2 — Vite + TypeScript foundation**

The current version is intentionally focused on a single boss duel. Exploration, character builds, equipment, levelling, NPCs, procedural generation, multiple bosses, and a broader world are outside the current prototype scope and may be explored in future development.
