# Dowza

An arcade game built from the shared
[`arcade-template`](../arcade-template).

## Play Locally

Open `index.html` in a modern browser, or run a local static server:

```sh
npm run build
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

```text
dowza/
  src/
    game-config.js   Game title, controls, Firebase config
    game-sounds.js   Web Audio sound definitions
    game.js          Dowza-specific game logic
    template.html    Shared arcade shell copied from arcade-template
    engine/          Engine modules (canvas, sound, input, loop, etc.)
  build.js           Builds index.html from src/
  index.html         Built playable game (root copy for GitHub Pages)
  dist/index.html    Built deployable game
  CHANGELOG.md       Version history
```

## Relationship To `arcade-template`

This repo is a downstream game. Shared engine improvements should usually start
in `../arcade-template`, then be copied forward deliberately.
