# Ashen Vow — Game Design Document

**Version:** 0.1  
**Status:** Playable browser prototype  
**Genre:** Dark fantasy action boss duel  
**Platform:** Desktop and mobile web; gamepad support where available

## Vision
Ashen Vow is a compact, skill focused duel inspired by the readable attack rhythms, stamina management, dodge timing, sparse presentation, and oppressive atmosphere of modern dark fantasy action RPGs. The player enters a ruined sanctum and faces Aeron, the Hollow King. Every attack is telegraphed; survival depends on reading the wind up and committing to a short punish window.

## Player experience
The intended loop is:

1. Enter the sanctum.
2. Read Aeron's wind up.
3. Move, dodge, strike, or cast.
4. Recover stamina and create another opening.
5. Push the king below half health and survive his remembered second phase.
6. Defeat him or return wiser after death.

The game is designed for short repeatable attempts rather than exploration or inventory management.

## Core systems

### Movement and stamina
WASD, arrow keys, left stick, or touch controls move the player around a circular arena. Movement is constrained to the arena boundary. Stamina regenerates when the player is not rolling or charging sorcery.

### Dodge
Space, controller B/○, or the touch Dodge button performs a directional roll. A roll costs 25 stamina and grants approximately 0.34 seconds of invulnerability. The player’s input direction determines the roll direction; with no direction, the roll follows the player’s facing.

### Melee
J, controller R1, or Strike performs a short sword attack. It costs 18 stamina, has a brief cooldown, and deals 65 damage when Aeron is within range. Attacks are intentionally short range and reward proximity after a missed boss attack.

### Sorcery
K, controller R2, or Cast begins a spell. Releasing quickly fires a basic projectile for 65 damage at a cost of 14 focus. Holding long enough charges the spell; a charged projectile costs 28 focus and deals 150 damage. Focus regenerates slowly.

### Healing
E, controller X/□, or Heal consumes one of three Crimson draughts. Healing takes roughly one second and restores 58 health. The player can be interrupted by damage.

### Boss
Aeron has 1,200 health and three attack patterns:

- **Crescent sweep:** A close area attack with a visible circular wind up.
- **King’s lunge:** A fast linear charge toward the player’s last position.
- **Ashen rupture:** A delayed blast at the player’s last position; in phase two it also creates a ring hazard.

The boss alternates between approach, wind up, attack, and recovery. Recovery is the primary punish window.

### Second phase
At 50% health, Aeron enters **The Crown Remembers**. The arena flashes, a radial shock ring appears, attack timings accelerate, and the rupture attack gains an additional expanding ring hazard. The phase transition is announced and visually distinct.

## Failure and victory
At zero player health, the attempt ends with a death screen and a retry button. At zero boss health, the player receives the Vow Fulfilled victory screen and may immediately face the king again.

## Presentation
The visual direction is a dark, desaturated sanctum: moss green stone, bronze light, faded ivory UI, ember red health effects, and pale cyan sorcery. The interface is deliberately sparse, with health, focus, stamina, healing count, boss health, phase, and controls visible without covering the arena.

## Controls

| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | WASD / arrows | Left stick | D-pad |
| Dodge | Space | B / ○ | Dodge |
| Strike | J | R1 | Strike |
| Sorcery | K, release to cast | R2 | Cast |
| Heal | E | X / □ | Heal |
| Pause | Esc / pause button | Menu / Start | Pause button |

## Scope boundaries
This prototype intentionally excludes exploration, character creation, equipment, levelling, NPCs, multiplayer, save data, procedural generation, and a broader world map. Those are possible future expansions, not part of the current playable slice.

## Success criteria
The prototype succeeds when a new player can begin immediately, understand the controls, see boss wind ups, dodge attacks, use both spell strengths, reach the second phase, and receive a clear victory or death state.
