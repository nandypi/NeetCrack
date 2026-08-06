# NeetCrack — Project Documentation

This `docs/` folder is the result of a full read-through of `DATA/` (1,471 files,
~7.2 GB) and `test.html`, plus two rounds of product decisions, done **before
writing any application code**, per the project brief. It exists to give the
implementation phase a shared, accurate understanding of the content model,
the rendering pipeline, and the chosen tech stack — with every decision
that needed a human call surfaced and answered rather than silently guessed.

## Contents

- **[data-model.md](./data-model.md)** — every JSON shape the app touches:
  `DATA/` (scraped, §1–11 — Categories → Courses → Sections → Lessons →
  (Article | Problem) → Code/Video) and `user-data/` (app-owned, §12 —
  profiles, per-profile progress, shared cache).
- **[rendering-pipeline.md](./rendering-pipeline.md)** — line-by-line
  walkthrough of `test.html`'s markdown→HTML pipeline (preprocessing,
  `marked`, KaTeX, Prism, `::tabs-start`/`::tabs-end`, iframe/YouTube
  handling), plus how to port its DOM-manipulation prototype code to React.
- **[tech-stack.md](./tech-stack.md)** — the chosen stack, target versions,
  and rationale for the non-obvious calls.
- **[decisions.md](./decisions.md)** — every decision locked in, grouped by
  topic. Treat as constraints, not suggestions.
- **[open-questions.md](./open-questions.md)** — whatever's still genuinely
  ambiguous or undecided. **Read this before starting implementation.**

## Top-level facts

- **5 categories**, **11 courses**, split across two distinct content
  models, distinguished by the `problemBased` field on each course entry
  in `Categories.json` (not by inference):
  - **7 video-based courses** (`problemBased: false`) — Section → Lesson →
    narrated video (local `.mkv`, always the playback source) + written
    article + multi-language code snippets.
  - **4 interactive-problem courses** (`problemBased: true`; Python for
    Beginners, Python for Coding Interviews, Python OOP, SQL for
    Beginners) — Section → Lesson → a coding challenge with starter code
    and a reference solution, shown **read-only** (no grading/execution —
    the app is a viewer, not a judge).
- **128 lessons ship a local `.mkv` video file** (7.2 GB total); this is
  always the playback source — the manifest's `vimeo` field is ignored.
- **19 standalone cheatsheets**, referenced by id from individual lessons
  (`"cheatsheet": "graph-crash-course"`).
- The only custom markdown syntax in the entire corpus is
  `::tabs-start` / `::tabs-end` (lesson articles only); everything else is
  standard (GFM-ish) markdown, `$…$` / `$$…$$` KaTeX math, and a handful
  of raw HTML `<iframe>`/`<div>` blocks for embedded YouTube videos.
- `test.html` is a **rendering-pipeline prototype**, not a wired-up app: it
  renders one hardcoded markdown string via direct DOM manipulation and
  loads every library from a public CDN. None of the actual `DATA/`
  content is loaded by it, and it isn't written in React — see
  rendering-pipeline.md §6 for what changes when porting it.
- **Progress & profiles**: multiple local profiles (id-keyed, not
  name-keyed), each with its own completion store; a shared, disk-
  persisted, never-expiring cache for the network-fetched images/YouTube
  thumbnails that are the app's one offline exception. No delete UI in v1.
- **Error handling** is per-lesson/per-field: a corrupt or missing piece of
  data degrades only that piece (e.g. "Video unavailable") — never the
  whole page or app. **Performance**: markdown is parsed lazily, only when
  a page is opened, not at startup.
- **Tech stack**: Electron + React 19 + Vite + TypeScript + Tailwind CSS v4
  + shadcn/ui + React Router + Zustand + Zod + marked + KaTeX + Prism.js +
  Fuse.js + electron-builder — see tech-stack.md for versions and the
  reasoning behind the less-obvious picks.

No application code was written as part of this documentation pass.
