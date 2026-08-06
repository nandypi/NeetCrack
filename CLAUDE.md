# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

**No application code exists yet.** This repo currently contains only scraped source data (`DATA/`),
a rendering-pipeline prototype (`test.html`), and a documentation pass done *before* implementation.
If you're asked to "start building" or "implement the app", read all of `docs/` first — it is the
spec, including the chosen tech stack. Do not re-derive the data model, rendering approach, or stack
from scratch; it's already been fully reverse-engineered and decided.

## What this project is

A locally-run Electron desktop app for browsing personally-scraped NeetCode course content
(videos, articles, code samples, interactive coding problems, cheatsheets) with local progress
tracking (mark lesson complete/incomplete) across multiple local profiles. Original one-line brief
is preserved at the top of git history in `docs/PRD.md` (now superseded by the docs below, but
useful for original intent/wording).

## Reading order for docs/

1. **`docs/README.md`** — index and top-level facts.
2. **`docs/data-model.md`** — the authoritative shape of every JSON file the app touches: both
   `DATA/` (scraped, read-only, §1–11) and `user-data/` (app-owned: profiles/progress/cache, §12).
   Read this before writing any code that parses either.
3. **`docs/rendering-pipeline.md`** — line-by-line walkthrough of `test.html`'s markdown→HTML
   transform, plus (§6) how to port its DOM-manipulation prototype code to React idioms. Read
   this before touching lesson/article/problem/cheatsheet rendering.
4. **`docs/tech-stack.md`** — the chosen stack with target versions and rationale for the
   non-obvious calls (TypeScript 5.x not 7.x, hash routing, why `electron-vite` was added, etc.).
5. **`docs/decisions.md`** — everything locked in; treat as constraints, not suggestions. Grouped
   by topic (data/scope, video/code, profiles, caching, rendering, error handling, performance,
   tech stack).
6. **`docs/open-questions.md`** — whatever's still genuinely undecided. If implementation work
   touches one of these areas, either follow an existing decision in `docs/decisions.md` or raise
   the question rather than silently guessing.

## Key decisions (full detail in docs/decisions.md)

- `DATA/` is immutable, read-only fixture data — never modified by the app, never committed
  (gitignored, ~7.2 GB). Two content models share the same `Category/Course/Section/Lesson` tree:
  7 video-based courses (`article.json` + `code.json` + local `.mkv`) and 4 problem-based courses
  (`problem.json`, no video) — distinguished by the `problemBased` field on each course entry in
  `Categories.json`, not by inference. Full shapes: `docs/data-model.md` §1–11.
- The app is a **viewer with progress tracking, not a code judge/grader** — no execution,
  submission, or test-case checking anywhere. `problem.json`'s judge/analytics fields are never
  read. `customProblem` is ignored; `suggestedProblems` renders as a checkbox list.
- **Video**: a plain `<video src="file://...">` pointed at the local `.mkv` — confirmed working
  (playback, seeking, correct duration/dimensions) via a throwaway Electron spike, no `ffmpeg`
  remux or native player needed. Manifest `vimeo` is ignored. Custom controls (not the browser's
  native bar) provide youtube-style resume-from-last-position, seeking, and speed control, all
  backed by ordinary `currentTime`/`playbackRate`. Don't use `canPlayType()` to gate playback —
  it underreports support for this container. Full detail: `docs/decisions.md` §Video & code.
- **Multiple local profiles**, id-keyed (never name-keyed) under `user-data/profiles/<id>/`, with
  a shared (not per-profile) `user-data/cache/` for network-fetched images/YouTube thumbnails,
  persisted to disk with no expiry. No delete UI in v1 (edit `profiles.json` by hand if needed).
  Exact shapes: `docs/data-model.md` §12.
- **Error handling is per-lesson/per-field fault isolation**: a corrupt or missing piece of data
  (video, article, image, YouTube thumbnail) degrades only that piece, never the whole page or
  the whole app — including at startup index build time.
- **Performance**: startup only builds a lightweight metadata index (manifests + progress, no
  markdown parsing); article/problem/cheatsheet content is read and rendered lazily, only when
  that page is opened.
- **Rendering**: `test.html`'s preprocessing pipeline applies to lesson **articles** only (the
  only place `::tabs-start`/`<iframe>` occur); problem/cheatsheet markdown uses a simpler pass.
  Add `prism-sql` (bundled in `prismjs`, not a separate package). The DOM-manipulation parts of
  `test.html` (`wireTabs`, `innerHTML`, manual Prism re-highlighting) need to become React state/
  effects when ported, not be copied as-is — see `docs/rendering-pipeline.md` §6.
- **Tech stack**: Electron, React 19, Vite (+ `electron-vite` as the build bridge), TypeScript
  5.x, Tailwind CSS v4, shadcn/ui, React Router v7 (hash routing, declarative mode — not
  framework/SSR mode), Zustand, Zod, marked, KaTeX, Prism.js 1.x, Fuse.js, electron-builder. Full
  version table and rationale: `docs/tech-stack.md`.

## `test.html` — rendering prototype, not the app

A standalone, hardcoded prototype of the markdown→HTML pipeline the real lesson/problem/
cheatsheet viewer needs to reproduce. It loads `marked`, KaTeX, and Prism from a public CDN and
renders one hardcoded markdown string via direct DOM manipulation — it does not read from `DATA/`
and is not written in React. See `docs/rendering-pipeline.md` (full walkthrough + §6 porting
notes) and `docs/tech-stack.md` (real, npm-installed versions of the same libraries) before
touching any rendering code.
