# Ashen Vow — Technical Architecture Document

**Version:** 0.1  
**Runtime:** Browser JavaScript, HTML5 Canvas, CSS  
**Deployment:** Static Site hosted by ChatGPT Sites

## Architecture overview
Ashen Vow is a single page, client-side game. `index.html` defines the HUD, start/death/pause overlays, touch controls, and canvas. `style.css` defines the responsive dark fantasy presentation. `game.js` owns all simulation, input, rendering, audio, and UI synchronisation.

```text
index.html
 ├─ style.css       responsive layout and visual tokens
 └─ game.js
     ├─ input adapters (keyboard, touch, Gamepad API)
     ├─ simulation state and update loop
     ├─ combat and collision rules
     ├─ particle/hazard effects
     ├─ Canvas renderer
     └─ HUD/overlay synchronisation
```

## Runtime model
The browser calls `requestAnimationFrame(frame)`. Each frame computes a clamped delta time, updates the simulation, renders the arena, and repeats. Simulation coordinates use a 1000 × 740 world space centred on the arena. Rendering translates and scales this world space to the viewport, preserving the same combat geometry on desktop and mobile.

## State
Top-level state includes:

- `mode`: title, play, pause, dead, or win.
- `player`: position, health, focus, stamina, flasks, facing, roll, invulnerability, cooldowns, healing, and charge state.
- `boss`: position, health, facing, finite-state-machine state, attack timer, attack target, combo counter, and phase flash.
- `shots`: active sorcery projectiles.
- `hazards`: temporary blast and expanding ring hazards.
- `particles`: short-lived visual effects.
- `phase2`: whether the boss has crossed the 50% health threshold.

## Boss finite-state machine

```text
idle → windup → attack → recover → idle
                 ↘
                  death / victory
```

`idle` approaches the player and selects an attack when its timer expires. `windup` exposes the attack telegraph and stores the relevant target position. `attack` applies damage and movement. `recover` gives the player a punish window. Phase transition temporarily uses the recover state while the radial effect is emitted.

## Input architecture
Keyboard events map physical keys to logical actions. Touch buttons use pointer events and feed the same action functions. The Gamepad API is polled every update; axes feed movement and button edges trigger actions. This keeps combat rules independent from the input device.

Logical action functions are:

- `action(key)`: handles dodge, strike, cast start, heal, and pause.
- `cast()`: converts a held cast into a basic or charged projectile.
- `moveInput()`: combines keyboard, arrow, touch, and stick movement.

## Combat rules
All combat is real-time and distance based. Melee checks the player-to-boss distance at the moment of the swing. Projectiles move with velocity and check distance to the boss each update. Damage is blocked while `player.inv > 0`. Arena containment clamps both actors to the circular boundary. Temporary hazards check the player against their current radius.

## Rendering
Canvas 2D renders the following layers in order:

1. Full-screen background and vignette.
2. Radial arena and masonry tiles.
3. Arena rings, radial seams, pillars, fog gate, and lamps.
4. Boss telegraphs and active hazards.
5. Actors, weapons, projectiles, and particles.
6. Atmospheric dust and screen shake.

The player and boss are stylised procedural canvas shapes rather than external image assets. This keeps the prototype portable and avoids loading or licensing dependencies.

## UI integration
The HUD is updated directly from simulation state at the end of each update: health, focus, stamina, flask count, status text, boss health, and phase text. Body classes control title/play visibility. Overlay copy changes for pause, death, and victory.

## Audio
A small Web Audio layer creates short oscillator envelopes for sword attacks, spells, damage, healing, and phase transition. Audio is initialised after the first user gesture to comply with browser autoplay policies. If Web Audio is unavailable, the game remains playable silently.

## Responsive behaviour
CSS uses viewport sizing and media queries. On coarse pointers, touch controls appear and the keyboard footer is hidden. The canvas itself scales through `resize()`. No external framework or build step is required.

## Deployment structure
The static deployment contains:

```text
.openai/hosting.json
 dist/index.html
 dist/style.css
 dist/game.js
```

`static.directory` is `dist`. The site is deployed privately as **Ashen Vow**.

## Verification performed
The source was syntax checked with Node. A headless simulation check exercised melee damage, charged sorcery, dodge invulnerability, healing, phase transition, and player death. Browser visual QA was not run for this version.

## Future technical work
Potential next steps include a data-driven attack definition format, hitbox visualisation/debug mode, animation state objects, sound asset management, gamepad remapping, pause-safe audio handling, and a larger scene system if exploration is added.
