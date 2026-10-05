# Repository guidance

## Run and verify
- Open `src/index.html` directly in a browser; no dependency installation or build is required.
- There is no package manifest, automated test suite, lint/typecheck config, or CI workflow. Verify gameplay in the browser and check the console for errors.
- For gameplay changes, check Start/restart, buffered arrow-key turns, tunnel wrapping, dot scoring, life loss, and win/loss overlays. Restart must restore dots, score, lives, and actor positions.

## Runtime constraints
- Scripts are classic browser scripts sharing globals, not ES modules. Preserve the order in `src/index.html`: `maze.js` → `game.js` → `render.js` → `main.js`; top-level declarations share a namespace.
- `main.js` owns DOM/input, overlays, and the animation loop; it calls `update(game)` only while playing, but `draw(ctx, game, frame)` every frame. Keep game rules in `game.js` and rendering in `render.js`.
- Movement uses cells per animation frame, not elapsed time. Turns and dot consumption occur at integer-cell alignment (`aligned()`); speed changes must preserve that alignment or actors can skip decisions/collisions with walls.
- Treat `MAZE` as the pristine template. Mutate only the row-by-row copy in `game.grid`; render that copy so eaten dots disappear and restarting restores them.
- Tile values are `0` empty, `1` wall, `2` dot, `3` ghost-house door. The door blocks Pac-Man but not ghosts; horizontal edge wrapping is restricted to `TUNNEL_ROW`.
- Geometry is coupled: the 28×31 maze and `TILE = 20` match the 560×620 canvas in `src/index.html` and wrapper in `src/css/style.css`. Update these together if dimensions change, and recheck tunnel/spawn coordinates.

## Spec workflow
- The README identifies this as a spec-driven development exercise. For requested spec work, read `.agents/skills/spec/SKILL.md` (and its `template.md`) or `.agents/skills/spec-impl/SKILL.md` rather than inventing a workflow.
- Specs use `specs/NN-slug.md`; no specs exist yet. The implementation skill requires human approval of the spec and pauses for review between steps; branch creation is controlled by `specs/.spec-config.yml` and defaults to automatic.
