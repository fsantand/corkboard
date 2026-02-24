# Corkboard

A Vue 3 + Vite interactive corkboard app. Users add polaroid-style cards to a cork-textured board, drag them around, connect them with strings, and edit their title/description/photo from a side panel. State persists to `localStorage`.

## Tech Stack

- **Vue 3** (v3.5.28) — Composition API with `<script setup>` syntax
- **Pinia** (v3.0.4) — State management
- **Vite** (v7.3.1) — Build tool and dev server (with `vite-plugin-vue-devtools`)
- **Vitest** (v4.0.18) — Unit testing with jsdom environment
- **ESLint + Oxlint** — Linting (run sequentially via `run-s`)
- **Prettier** (v3.8.1) — Code formatting (print width: 100, single quotes, no semicolons)
- **Node** — v22 (engines: `^20.19.0 || >=22.12.0`)

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test:unit    # Run unit tests with Vitest
npm run lint         # Run oxlint then eslint (both with --fix)
npm run format       # Prettier format src/
```

## Project Structure

```
src/
  main.js                      # App entry point — creates Vue app, installs Pinia, mounts to #app
  App.vue                      # Root component — renders <CorkBoard />
  assets/
    main.css                   # Global styles
    base.css                   # CSS variables / reset
    background.png             # Cork texture (tiled board background)
    logo.svg
  stores/
    corkboard.js               # Main store — items, connections, connect mode, localStorage persistence
    counter.js                 # Scaffolding leftover (unused by the app)
  components/
    CorkBoard.vue              # Board container: renders items, strings, toolbar, aside
    BoardItem.vue              # Draggable polaroid card with pushpin and delete button
    StringLayer.vue            # SVG overlay drawing curved string connections between pins
    BoardToolbar.vue           # Top-left toolbar (+ Card button, Cancel Connect button)
    ItemAside.vue              # Collapsible right sidebar for editing hovered/selected card
    CardContent.vue            # Expanded card content view (currently not wired into the board)
    AddPhotoModal.vue          # Modal for attaching a photo (file upload or URL)
    __tests__/
      HelloWorld.spec.js       # Scaffolding test (not updated for current app)
    icons/                     # SVG icon wrapper components (scaffolding, unused)
      IconCommunity.vue
      IconDocumentation.vue
      IconEcosystem.vue
      IconSupport.vue
      IconTooling.vue
public/
  favicon.ico
index.html                     # HTML entry point
```

## Core Data Model (`corkboard.js`)

Each **item** has: `id`, `x`, `y`, `rotation`, `zIndex`, `title`, `description`, `photoSrc`, `width`.

Each **connection** has: `id`, `fromId`, `toId`.

Store actions: `addItem`, `updateItem`, `moveItem`, `deleteItem`, `startConnect`, `finishConnect`, `cancelConnect`, `removeConnection`.

State persisted under `localStorage` key `corkboard-state`.

## Key Conventions

- Path alias `@` maps to `./src/`
- Test files live in `__tests__/` subdirectories alongside the code they test
- Stores use Composition API style (`defineStore` with `ref`/`computed`)
- All linting and formatting is auto-fix on save in VS Code
- Cards are positioned absolutely; `zIndex` increments on every move to bring the active card to front
- Connect mode: click a pushpin to start, click another pushpin to finish, Esc to cancel
- Right-click a string to remove the connection
