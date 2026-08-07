# Tech Stack

Chosen stack, pinned to specific versions where a version is meaningful.

**The scaffold now exists** (see root [README.md](../README.md) for how to
run it) — `package.json` is the actual source of truth for exact installed
versions; the table below is kept in sync with it, but if the two ever
drift, trust `package.json`. Two entries below (`vite`, `electron`) had to
deviate from the originally-targeted line once real installation was
attempted — see "Deviations from the original target" at the bottom for
why, before assuming a newer number is simply better.

| Package | Pinned version | Role |
|---|---|---|
| `electron` | `30.5.1` (not `41.x` — see deviations) | desktop shell, native file/video access |
| `react` / `react-dom` | `19.2.x` | UI |
| `vite` | `7.3.x` (not `8.x` — see deviations) | dev server + renderer bundler |
| `electron-vite` | `5.0.0` | wires Vite's build/HMR to Electron's main + preload + renderer processes |
| `@vitejs/plugin-react` | `5.2.x` | React fast-refresh plugin for Vite (not part of the original list — required by `electron-vite`) |
| `typescript` | `5.9.x` (latest **5.x**, not 7.x) | types |
| `tailwindcss` / `@tailwindcss/vite` | `4.3.x` | styling |
| `shadcn/ui` | n/a — CLI, not a pinned dependency | UI components (see below) |
| `react-router` | `7.18.x`, **declarative/data mode**, not framework mode | in-app navigation |
| `zustand` | `5.0.x` | UI/session state |
| `zod` | `4.4.x` | runtime schema validation for `DATA/` JSON and `user-data/` files |
| `marked` | `18.x` | markdown → HTML |
| `katex` | `0.18.x` | math rendering |
| `prismjs` | `1.30.x` (**not** an early v2) | syntax highlighting |
| `fuse.js` | `7.5.x` | fuzzy search across courses/lessons/cheatsheets |
| `electron-builder` | `26.x` | packaging/distribution |
| `eslint` | `10.8.x` (bumped from the originally-assumed `9.x`) | linting |
| `prettier` | `3.9.x` | formatting |

## Non-obvious choices, explained

**TypeScript stays on the 5.x line, not the just-released 7.0.**
TypeScript 7 is a from-scratch rewrite (the Go-based "tsgo" compiler) that
only just went stable. A rewrite of that size means the plugin/tooling
ecosystem (ESLint's TypeScript parser, editor integrations, any
Vite/Electron-adjacent type-checking tooling) needs time to catch up. For a
v1 build, the mature, universally-compatible 5.x line is the safer choice;
revisit once the ecosystem has caught up to 7.x.

**Prism.js stays on 1.x.** Prism v2 is in development but the v1 line is
still the current release (in maintenance mode, security-fixes-only, but
that's fine for a fixed, known set of ~9 language grammars that aren't
going to change). Don't reach for a v2 alpha/beta.

**`prism-sql` isn't a separate package.** It's one of the language
components bundled inside `prismjs` itself
(`prismjs/components/prism-sql`), loaded the same way as the other 8
language components `test.html` already loads. See
[decisions.md](./decisions.md#rendering).

**`electron-vite` is an addition, not part of the original stack list.**
Vite and Electron don't talk to each other out of the box — something has
to build and hot-reload the main process, preload script, and renderer
together. `electron-vite` is the standard, actively-maintained tool for
that (vs. hand-rolling separate build configs for each process, or the
lighter-weight `vite-plugin-electron`). Low-risk, swappable later without
touching any application code or data model — flag if a different bridge
is preferred.

**`shadcn/ui` has no version to pin.** It isn't installed as a runtime
dependency — its CLI (`npx shadcn add <component>`) copies component
source directly into the repo, which you then own and can edit. What
*does* get pinned are the underlying packages that generated code imports
(Radix UI primitives, `lucide-react`, `class-variance-authority`,
`tailwind-merge`, `clsx`) — those get added to `package.json`
automatically by the CLI as each component is added, at whatever their
current versions are at that time. No separate decision needed here.

**React Router runs in declarative/data mode, not framework mode.**
React Router v7 folded in Remix and can run as a full SSR framework — not
applicable here, there's no server, this is a packaged offline SPA.
Use `createHashRouter` (or `createMemoryRouter`), not
`createBrowserRouter`: Electron loads the packaged renderer from a
`file://` URL, and the History API's `pushState` doesn't resolve relative
paths the way it does when served over `http(s)://` from a real origin.
Hash-based routing (`#/course/...`) sidesteps that entirely and is the
standard pattern for Electron + React Router.

**Zod validates data at the `DATA/`/`user-data/` boundary.** Since the app
reads hundreds of scraped JSON files plus its own `user-data/` files, Zod
schemas are the mechanism for the "one corrupt lesson shouldn't crash the
app" error-handling rule (see [decisions.md](./decisions.md#error-handling))
— a manifest or lesson file that fails to parse against its schema is
treated as that one entry being unavailable, not a fatal error.

**Vite's Node requirement is a build-machine concern, not a shipped-app
one.** Vite only runs at dev/build time; Electron bundles its own Node.js
runtime for the packaged app's main process. Don't conflate "what Node
version does Vite need on the machine running `npm run build`" with "what
Node version ships inside the `.exe`/`.app`" — they're unrelated.

## Deviations from the original target (found during actual scaffolding)

Picking versions from release pages (as the table above originally did) and
actually installing them are different exercises — two conflicts only
showed up once `npm install` was run for real:

- **Vite is `7.3.x`, not `8.x`.** `electron-vite@5.0.0`'s `peerDependencies`
  cap Vite at `^5.0.0 || ^6.0.0 || ^7.0.0` — it doesn't support Vite 8 yet.
  Forcing 8 would mean an untested/broken pairing with the one tool that
  bridges Vite and Electron. `@vitejs/plugin-react` is pinned to `5.2.x`
  for the same reason (its `6.x` line requires Vite 8). Revisit once
  `electron-vite` publishes a release supporting Vite 8.
- **Electron is `30.5.1`, not `41.x`.** Electron 39+ ships a native
  zip-extraction helper binary as part of its own `npm install` step.
  On the machine this was scaffolded on, a Windows Application Control
  policy blocks that specific binary from executing — confirmed to fail
  identically regardless of install location (repo root vs. a temp
  folder), so it's a policy match on the file itself, not a path rule.
  Electron 30.x predates that native helper and installs cleanly.
  **Tradeoff, not a free lunch:** `npm audit` flags the accumulated CVEs
  fixed between Electron 30 and the current release (mostly
  sandbox/context-bridge/IPC edge cases — see the advisory list `npm audit`
  prints). This app's exposure is narrower than a typical Electron app
  (fully offline, never navigates to a remote/untrusted origin, renders
  only first-party bundled `DATA/` content — see decisions.md's Data &
  scope and Rendering sections), but "narrower" isn't "zero." Actually
  closing this gap means either getting the Application Control policy on
  the dev machine to allow that binary, or finding a different Electron
  install path — not something to route around by disabling the policy.
  **Revisit this pin periodically**, not just once.
- **ESLint is `10.8.x`, not `9.x`.** The original table assumed 9.x because
  that was ESLint's latest at the time of the first documentation pass;
  by the time of scaffolding, 10.x was already the current stable and
  every plugin in use (`typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`, `eslint-config-prettier`) supports it —
  simple version drift, not a compatibility conflict like the two above.
