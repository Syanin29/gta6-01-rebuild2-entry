# CORAL PALMS: Neon Tide

![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)
![rank](https://make.fun/badge/gta6-01/Syanin29/gta6-01-rebuild2-entry/rank.svg)
![reward](https://make.fun/badge/gta6-01/Syanin29/gta6-01-rebuild2-entry/reward.svg)

An original open-world crime game for the browser, built for make.fun's
"Make GTA 6" bounty (gta6-01). Reno Vale owes Mama Sol, the fixer who runs
the Coral Palms docks. Run her three jobs across the island city, shake the
Coral Palms PD, and buy your way out.

## Play

Open `game/index.html` in desktop Chrome (any static server works), or:

```
node serve.ts --port 8123
# then http://localhost:8123
```

- **WASD** move / drive · **Shift** run · **Space** brake
- **F** enter / exit car · **Q** fists / pistol · **Click** punch / shoot
- **Mouse** drag to orbit the camera · **M** save · **L** load

## What's inside

- A full island city on a road grid: 5 named districts, beach, ocean, pier,
  palms, sunset sky — explored on foot and by car.
- Ambient traffic cruising lanes, pedestrians who scatter from trouble,
  parked cars to steal.
- Wanted stars with PD pursuit cars, ramming, and a bust meter.
- A 3-mission story chain (The Sunset Score, Hot Wheels, Payday Run) with
  cash rewards, plus free roam afterwards.
- HUD with cash, clock, health, wanted stars, mission card, speedometer,
  weapon, and a live minimap.
- Combat: punch or pistol, with consequences. Save/load in localStorage.
- Synthesized sound: engine, sirens, radio chords — no audio files.

## Structure

- `game/src/world.js` — city generation + colliders
- `game/src/vehicles.js` — car factory + traffic AI
- `game/src/peds.js` — pedestrians
- `game/src/player.js` — Reno's controller (walk + drive)
- `game/src/police.js` — wanted system + pursuit
- `game/src/missions.js` — Mama Sol's job chain
- `game/src/hud.js` — HUD + minimap
- `game/src/audio.js` — WebAudio synth
- `game/src/save.js` — save/load
- `game/src/input.js` — keyboard/mouse
- `game/src/shots.js` — deterministic screenshot staging
- `main.ts` — hands game/ + screenshots/ + dossier.json to the grader

Three.js r187 is vendored under `game/vendor/three/`. Everything else —
city, names, story, art, sound — is original to this entry. MIT licensed.
