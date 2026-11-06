# Giant Dash: Number Gates

An original HTML5 lane-runner game. Steer **Pip**, a little sprout-sprinter,
through number gates to grow, dodge shrink-gates and spiky rocks, then dash
down **Grumple**, the boulder-boss at the end of each level. Mechanics only
inspired by the lane-runner / bigger-number-gates genre — no copied art,
code, names, characters, or assets from any existing game. Every title,
character, drawing, and tune here is original.

## Files

- `index.html` — the whole game. Plain HTML5 + vanilla JS + Canvas, single
  self-contained file. No engine, no external assets, no network needed.
- `test.js` — headless real-click test (Playwright + system Chromium).
- `test-shots/` — screenshots captured by the test run.
- `test-run-final.log` — full output of the final passing test run.

## How to play

- **Steer:** `←` / `→` or `A` / `D`, swipe left/right, or tap the left/right
  third of the track. Touch + mouse supported.
- **Green `+N` gates** grow you. **Blue `×2` gates** double your size.
  **Red `−N` gates** shrink you. **Spiky rocks** cost a life. **Gold stars**
  are bonus points.
- **Boss:** at the end of each level Grumple appears. His size is set by the
  level (20 on level 1, +4 per level, 96 on level 20). Press **DASH!**
  (button, `Space`, or tap) to lunge at him. If you are bigger than him, each
  dash knocks off one of his 3 HP. If you are smaller, the dash bounces off,
  costs a life — but he tires a little (shrinks 15%) and you grow +5, so the
  fight stays winnable.
- **Lives:** 3 per run (max 5, +1 on level clear). Lose them all and it is
  game over; retry restarts the current level with your score rolled back to
  the level start.
- **20 levels:** longer tracks, faster speed, denser rocks and red gates.
  Beat level 20's boss for the win screen.
- **Pause:** `P` / `Esc` / pause button (auto-pauses when the tab hides).
  **Mute:** `M` / music button.

## How to run

Open `index.html` in any modern browser (desktop or mobile), or serve the
folder:

```sh
cd ~/workspace/playables-inspired/tall-runner
python3 -m http.server 8130
# then open http://localhost:8130/index.html
```

Audio starts on the first click (browser autoplay rule). Music is an
original 16-step loop in C major pentatonic, synthesized with WebAudio;
all SFX (gate, multiply, bad gate, hit, coin, dash, boss, win, lose) are
synthesized too — no audio files, no copyrighted music.

## Test results (actually run, headless, real clicks)

Command (from this folder):

```sh
NODE_PATH=/home/hatch/workspace/tools/pw-shot/node_modules node test.js \
  "file:///home/hatch/workspace/playables-inspired/tall-runner/index.html" ./test-shots
```

Final run: **ALL TESTS PASSED — 15/15 checks, zero console/page errors.**
Exit code 0. What was verified with real input (mouse clicks on the DOM
buttons, real `ArrowLeft`/`ArrowRight` key presses, `window.__giantDash()`
state reads):

| # | Check | Evidence |
|---|-------|----------|
| 1 | Loads, menu screen | `screen=menu`, level 1, size 10, 3 lives |
| 2 | Start → playing level 1 | click `#btn-start` → `screen=playing`, level 1 |
| 3 | Level 1 played legitimately to the boss | auto-steered to good/`×2`/coin lanes by reading the live state; reached boss with **size 82, 6 gates hit** (size 108 / 7 gates in an earlier run) |
| 4 | Boss fight state reached | `bossState=fight`, boss size 20 |
| 5 | Boss defeated → level clear | size set to 200, 3 real DASH clicks → `screen=clear`, boss HP 0 |
| 6 | Next → level 2 | click `#btn-next` → `screen=playing`, level 2, size reset to 10 |
| 7 | Pause → paused | `screen=paused` |
| 8 | Resume → playing | `screen=playing` |
| 9–10 | Mute toggles on then off | `muted=true`, then `muted=false` |
| 11 | Undersized dash bounce → game over | lives set to 1, size 5 vs boss 20, DASH → `screen=gameover`, lives 0 |
| 12 | Retry → same level, lives restored | `screen=playing`, level 2, lives 3, score rolled back |
| 13 | Debug jump to level 20 | `screen=playing`, level 20, boss size 96 |
| 14 | Level 20 boss defeated → win screen | 3 DASH clicks at size 300 → `screen=win`, final score 7107 |
| 15 | No console errors / page errors | none recorded across the whole run |

Screenshots in `test-shots/`: `01-menu.png`, `02-level1.png`,
`03-boss.png`, `04-clear.png`, `05-paused.png`, `06-gameover.png`,
`07-win.png`, `08-boss-fight.png` — all visually inspected: menu, gates,
boss, and win screen all render as intended.

### Notes / known headless quirks (not game bugs)

- Headless Chromium under SwiftShader delivers only ~0.4–1 animation frame
  per second, so the test run takes ~2.5 minutes. The game loop clamps
  frame delta at 0.5s so game time still tracks real time at low frame
  rates; on a normal 60fps device the game runs at full speed.
- During the mute test the game keeps running unattended, so a rock hit
  cost a life mid-test (lives 3→2) — real gameplay, not a test failure.
- The level-20 check uses the `window.__giantDashDebug` test hooks
  (`setLevel`, `warpToBoss`, `setSize`, `setLives`) to reach the final boss
  quickly; levels 1–2 and the boss mechanics were also exercised through
  real play and real DASH clicks. The hooks are test-only and do not affect
  normal play.

## Originality

No assets from any existing game are used. Pip (sprout-sprinter), Grumple
(boulder-boss), all track/scenery drawing, the gate/obstacle designs, the
level generator, and the music melody are original to this file.
