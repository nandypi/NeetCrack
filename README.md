# NeetCrack

A locally-run Electron desktop app for browsing personally-scraped course content
(videos, articles, code samples, interactive coding problems, cheatsheets) with local progress
tracking across multiple local profiles. Fully offline except for a couple of remote images/embeds
— see [`docs/decisions.md`](./docs/decisions.md) for the full rationale.

**Current status: scaffolded, no application features yet.** The app launches and shows a
placeholder screen proving the Electron + React + Vite pipeline works end to end. Lesson browsing,
`DATA/` parsing, profiles, video playback, and the markdown rendering pipeline are all still to be
built — see [`docs/`](./docs/) for the full spec before starting on any of that.

## Prerequisites

- **Node.js 20+** and npm (this project was scaffolded against Node 24; anything reasonably recent
  works — Vite/Electron's own requirements are the binding constraint, not this app's code).
- **`DATA/`** — Keep the data folder to show.

## Getting started

```sh
npm install
npm run dev
```

`npm run dev` starts the Vite dev server for the renderer and launches the Electron app with hot
reload. Closing the window (or Ctrl+C in the terminal) stops it.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run the app in development mode (HMR renderer + Electron) |
| `npm run build` | Type-checked production build (`electron-vite build` → `out/`) |
| `npm run start` | Preview a production build (`electron-vite preview`) without packaging it |
| `npm run typecheck` | `tsc --noEmit` across both TS projects (`src/main`+`src/preload`, and `src/renderer`) |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run format` | Format the codebase with Prettier |
| `npm run format:check` | Check formatting without writing changes |
| `npm run dist` | Build then package with `electron-builder` (installers land in `dist/`) — not yet run/verified, see [`docs/tech-stack.md`](./docs/tech-stack.md) |

## Project layout

```
src/
├── main/        # Electron main process (window creation, lifecycle)
├── preload/     # contextBridge API exposed to the renderer
└── renderer/    # React 19 app (Vite root: src/renderer)
    └── src/
        ├── App.tsx        # currently just a placeholder screen
        ├── main.tsx       # React entry point, sets up React Router (hash mode)
        └── lib/utils.ts   # shadcn/ui's cn() helper

electron.vite.config.ts   # main/preload/renderer build config
components.json            # shadcn/ui config (no components added yet)
electron-builder.yml       # packaging config
docs/                      # the actual spec — read before implementing anything
DATA/                       # gitignored scraped course data (not included in this repo)
user-data/                  # gitignored — created by the app at runtime (profiles, progress, cache)
```

## Tech stack

Electron, React 19, Vite (via `electron-vite`), TypeScript, Tailwind CSS v4, shadcn/ui, React
Router, Zustand, Zod, marked, KaTeX, Prism.js, Fuse.js, electron-builder. Full version table and
the reasoning behind the non-obvious choices (including two version pins that had to deviate from
their original target once actually installed): [`docs/tech-stack.md`](./docs/tech-stack.md).

## Documentation

Everything about the data model, rendering pipeline, product decisions, and open questions lives in
[`docs/`](./docs/) — start with [`docs/README.md`](./docs/README.md). `CLAUDE.md` has the
condensed version for AI coding agents working in this repo.
