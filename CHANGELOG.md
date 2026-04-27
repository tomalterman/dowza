# Changelog

## v1 — Initial scaffold from arcade-template (`<short-sha>`)

**What changed**

- Created repo from `../arcade-template`: copied `src/engine/`,
  `src/template.html`, `src/game.js`, `src/game-sounds.js`, `build.js`,
  and `.github/workflows/build.yml`.
- Customized `src/game-config.js` for Dowza: `title`, `subtitle`,
  `firebasePath: 'highscores-dowza'`, `localStoragePrefix: 'dowza'`.
- Added `package.json`, `README.md`, `CLAUDE.md`, `.gitignore`.
- Game logic still placeholder Block Dodge code from the template;
  next version will replace `src/game.js` with real Dowza gameplay.

**Why**

Standing up the scaffold separately from the gameplay so the build
pipeline, GitHub Pages workflow, and Firebase path are wired up before
any game-specific code lands. This mirrors how Tiny Kitty Garden was
seeded.
