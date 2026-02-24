# Corkboard

Vue 3 + Vite web application.

## Tech Stack

- **Vue 3** (v3.5.28) — Composition API with `<script setup>` syntax
- **Pinia** (v3.0.4) — State management
- **Vite** (v7.3.1) — Build tool and dev server
- **Vitest** — Unit testing with jsdom environment
- **ESLint + Oxlint** — Linting (run sequentially via `run-s`)
- **Prettier** — Code formatting (print width: 100, single quotes, no semicolons)
- **Node** — v22 (see `.nvmrc`)

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
  main.js            # App entry point — creates Vue app, installs Pinia, mounts to #app
  App.vue            # Root component
  assets/            # CSS and static assets
  components/        # Reusable Vue components
    __tests__/       # Vitest unit tests (*.spec.js)
    icons/           # SVG icon wrapper components
  stores/            # Pinia stores (Composition API style)
public/              # Static files served as-is
index.html           # HTML entry point
```

## Key Conventions

- Path alias `@` maps to `./src/`
- Test files live in `__tests__/` subdirectories alongside the code they test
- Stores use Composition API style (`defineStore` with `ref`/`computed`)
- All linting and formatting is auto-fix on save in VS Code
