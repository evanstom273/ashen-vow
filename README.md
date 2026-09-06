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

## Tech

Ashen Vow is a fully client-side browser game built with:

- HTML5 Canvas
- Vanilla JavaScript
- CSS
- Web Audio API
- Gamepad API

There is no framework or build step required. The main playable source lives in:

- `index.html` — structure and UI
- `style.css` — visual design and responsive layout
- `game.js` — simulation, movement, combat, boss AI, input, rendering, particles, hazards, and audio

GitHub Pages deployment is handled automatically through `.github/workflows/static.yml` whenever changes are pushed to `main`.

## Documentation

- [`Ashen-Vow-GDD.md`](./Ashen-Vow-GDD.md) — Game Design Document
- [`Ashen-Vow-TAD.md`](./Ashen-Vow-TAD.md) — Technical Architecture Document
- [`Ashen-Vow-source.zip`](./Ashen-Vow-source.zip) — original exported prototype source

## Status

**v0.1 — Playable prototype**

The current version is intentionally focused on a single boss duel. Exploration, character builds, equipment, levelling, NPCs, procedural generation, multiple bosses, and a broader world are outside the current prototype scope and may be explored in future development.
