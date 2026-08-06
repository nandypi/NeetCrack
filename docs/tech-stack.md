# Tech Stack

Chosen stack, pinned to specific versions where a version is meaningful.
Versions below were the current stable releases at time of writing (checked
against npm/project release pages) — **re-verify the exact patch number
against the registry when actually scaffolding** (`npm view <pkg> version`),
these move weekly; what's locked in is the major/minor line and the
reasoning, not the literal patch digit.

No application code or `package.json` exists yet — this is the target for
whenever scaffolding starts, not a record of something already set up.

| Package | Target version | Role |
|---|---|---|
| `electron` | `41.x` (latest stable line) | desktop shell, native file/video access |
| `react` / `react-dom` | `19.2.x` | UI |
| `vite` | `8.x` | dev server + renderer bundler |
| `electron-vite` | `5.x` | wires Vite's build/HMR to Electron's main + preload + renderer processes |
| `typescript` | `5.9.x` (latest **5.x**, not 7.x) | types |
| `tailwindcss` | `4.3.x` | styling |
| `shadcn/ui` | n/a — CLI, not a pinned dependency | UI components (see below) |
| `react-router` | `7.18.x`, **declarative/data mode**, not framework mode | in-app navigation |
| `zustand` | `5.0.x` | UI/session state |
| `zod` | `4.4.x` | runtime schema validation for `DATA/` JSON and `user-data/` files |
| `marked` | `18.x` | markdown → HTML |
| `katex` | `0.18.x` | math rendering |
| `prismjs` | `1.30.x` (**not** an early v2) | syntax highlighting |
| `fuse.js` | `7.5.x` | fuzzy search across courses/lessons/cheatsheets |
| `electron-builder` | `26.x` | packaging/distribution |

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
version does Vite 8 need on the machine running `npm run build`" with
"what Node version ships inside the `.exe`/`.app`" — they're unrelated.
