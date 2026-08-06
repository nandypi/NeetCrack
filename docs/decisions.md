# Decisions

Locked in. Treat as constraints, not suggestions. Anything not covered here
and not obviously implied by it belongs in [open-questions.md](./open-questions.md),
not a silent guess.

## Data & scope

- `DATA/` is immutable and never modified by the app.
- Only lesson completion is persisted; section/course progress (e.g. "12/35
  lessons done") is always derived from it at read time, never stored
  separately.
- The app is offline-only and requires no authentication.
- The app is a **viewer with progress tracking, not a code judge/grader**.
  There is no code execution, submission, or test-case checking anywhere.
  `problem.json`'s judge/execution fields (`test_cases`, `custom_test_cases`,
  `test_case_count`, `test_case_type`, `sqlStartupScript`, `allow_customize`)
  and frozen product analytics (`submissionHistory`, `submissionCount`,
  `acceptedCount`, `company_tags`, `completed` inside the scraped JSON) are
  never read. For problem-course lessons, "completed" means the user marked
  it done after reading through it — same sense as a video lesson, not a
  judged pass.
- `DATA.zip` was a backup archive and has been moved out of the repo —
  irrelevant, don't reference it.

## Video & code

- Video playback always uses the lesson's local `.mkv` file. The manifest's
  `vimeo` field is ignored entirely — never read, never used as a fallback
  or identifier. If the `.mkv` is missing, show "Video unavailable" (see
  Error handling below for the general fault-isolation pattern this is one
  instance of).
- **Playback mechanism: a plain `<video src="file://...">` element**, not
  an `ffmpeg` remux step or a native player embed. Confirmed working via a
  throwaway Electron spike against real sample `.mkv` files (not integrated
  into the app, deleted after) — see
  [open-questions.md](./open-questions.md#resolved-mkv-container-playback-was-open-question-1)
  for the results. Don't use `video.canPlayType()` to decide whether a
  video can play — it reports no support for `video/x-matroska` even
  though actual playback works fine; detect failure via the `error` event
  on a real load attempt instead (same fault-isolation pattern as
  everything else in Error handling).
- **Build custom playback controls**, not the browser's native control
  bar, so the UI is visually consistent with the rest of the app.
  Resume-from-last-position, seeking, and variable playback speed are all
  ordinary `<video>` element capabilities (`currentTime`, `playbackRate`),
  confirmed working in the same spike:
  - **Resume**: persist `currentTime` per lesson per profile (throttled —
    e.g. on `timeupdate` at most every ~5s, plus on pause/unload, not on
    every frame) to `user-data/profiles/<id>/progress.json`
    (`videoPositions`, see data-model.md §12). On opening a lesson, seek to
    the saved position if one exists and it's not within the last ~5% of
    the video (treat "basically finished" as start-over, not an awkward
    resume 30 seconds from the end).
  - **Seeking**: a custom scrub bar driving `video.currentTime` directly —
    confirmed to fire `seeked` and land exactly on target.
  - **Speed**: a speed picker (e.g. 0.5x–2x) driving `video.playbackRate`
    directly — confirmed to take effect immediately.
  - Resume position is separate from the `completed` flag — finishing a
    video does **not** auto-mark a lesson complete; completion stays an
    explicit user action (see Data & scope above), resume position is
    purely "where to start playback from."
- Ignore the manifest's `code` map / `baseCodeUrl` (remote GitHub paths)
  entirely. `code.json` is the sole source of truth for lesson source code.
- `customProblem` is ignored entirely — no bespoke interactive visualizer
  widgets (Union-Find, Dijkstra, etc.) are in scope. A lesson with
  `customProblem` set renders exactly like any other lesson.
- `suggestedProblems` (LeetCode slugs) render as a plain checkbox list on
  the lesson page — link text out to LeetCode + a local "I did this"
  checkbox that's just part of that lesson's own progress state. No judged
  content behind the slug.
- Per-problem `difficulty` in `problem.json` is ignored (empty in every
  sample). Only course-level `difficulty` (`Categories.json`) is shown.

## Data fixes (already applied to `Categories.json`)

- `jsonPath` is now populated for all 11 courses — the original scrape's
  `null` for the 4 problem courses was a data bug and has been patched
  directly in the file.
- A new `problemBased: boolean` field was added to every course entry —
  `true` for the 4 problem courses. It's the authoritative signal for which
  content model a course uses (prefer it over inferring from `link`'s
  `/courses/`-vs-`/problems/` prefix). For problem-based courses, lesson
  order is the manifest array order; folder listing order is never used.

Full JSON shapes for both fields: [data-model.md §2](./data-model.md#2-categoriesjson).

## Profiles & progress storage

- Multiple local profiles, identified by a generated id, never by their
  display name (names are just a label — not filesystem-safe, not
  guaranteed unique, and renaming a profile must never break its storage).
- `user-data/profiles.json` is the profile index. `user-data/profiles/<id>/`
  holds that profile's own data (progress store). Exact shape:
  [data-model.md §12](./data-model.md#12-user-data-app-owned-not-scraped).
- On startup: read `profiles.json`. If it doesn't exist or has zero
  profiles, show a one-field "name your profile" first-run screen and
  create the first profile from it. Otherwise, load `lastProfile` directly
  into the app — no profile-picker screen on every launch.
- Opening/switching to a profile updates `lastProfile` in `profiles.json`.
- **No delete UI in v1.** If a profile needs removing, edit
  `profiles.json` (and remove its `user-data/profiles/<id>/` folder) by
  hand. This is intentional, not a placeholder for "later" — deleting a
  profile discards its entire completion history, and skipping the UI
  avoids building confirmation/undo flows for something that isn't needed
  yet.
- Lesson completion needs a stable key that works across both content
  models, since nothing in the source data provides one single id shared
  by video and problem lessons. Decided: `problemId` for problem-course
  lessons (already a clean global slug, see data-model.md §4); `courseId` +
  `sectionName` + `folderName` joined for video-course lessons (folder
  names are stable since `DATA/` is immutable, but aren't globally unique
  across courses, so the course id has to be part of the key). See
  data-model.md §12 for the exact key format.

## Caching (network-fetched content)

- Images (`imagedelivery.net`) and YouTube thumbnail cards are the *only*
  things allowed to need network — everything else (video, article/problem/
  cheatsheet text, code) is fully local. See Rendering below for why images/
  YouTube specifically can't be local.
- The cache is **shared across all profiles**, not per-profile — the
  underlying `DATA/` content is identical regardless of who's viewing it;
  only completion state is per-profile.
- Persisted to disk, no expiry, no eviction/size cap. The dataset never
  changes and images are small relative to the 7.2 GB of video, so an
  unbounded cache is fine. Location: `user-data/cache/` (shared, outside
  any profile folder) — see data-model.md §12.

## Rendering

- Markdown rendering is based on the existing preprocessing pipeline in
  `test.html`, but that exact pipeline (iframe-protect → tabs-protect →
  `marked.parse()` → restore) only applies to **lesson articles**, the only
  place `::tabs-start`/`::tabs-end` and `<iframe>` YouTube embeds occur.
  Problem descriptions and cheatsheet content are plain markdown (headings,
  prose, tables, plain fenced code blocks, `$...$` math, no tabs/iframes) —
  route those through a simpler pass that skips the iframe/tabs protect-
  and-restore steps and goes straight to `marked.parse()` + KaTeX + Prism.
  Don't run the full article pipeline where the syntax it exists for can't
  occur. Full walkthrough: [rendering-pipeline.md](./rendering-pipeline.md).
- `test.html` manipulates the DOM directly (`innerHTML`, manual
  `querySelectorAll`/click-handler tab wiring). That's fine for a
  standalone prototype but must be ported to React idioms, not copied
  verbatim — see rendering-pipeline.md §6 for the specific translation
  notes (tab state, Prism highlighting timing, math rendering timing).
- Add `prism-sql` — it's a language component bundled inside the `prismjs`
  package itself (`prismjs/components/prism-sql`), not a separate npm
  dependency — so SQL course problem/cheatsheet code blocks get
  highlighted. The prototype's Prism setup doesn't load it.
- The `.play-button`/`.play` CSS-vs-markup class name mismatch in
  `test.html` is dead prototype code, not an intentional design choice —
  when porting, use one consistent class name (e.g. keep `.play` and point
  the CSS rule at it).
- No HTML sanitization before rendering is fine to carry forward as-is —
  all markdown is first-party bundled content from `DATA/`, not user or
  network input, so the trust boundary `test.html` assumes still holds.

## Error handling

Fault isolation is per-lesson and per-field, not all-or-nothing:

- Missing/corrupt `.mkv` → show "Video unavailable" in place of the player;
  the rest of the lesson page (article, code, suggested problems) still
  renders normally if its own data is present and valid.
- Missing/corrupt `article.json`/`problem.json` → show an
  "Article unavailable" (or "Problem unavailable") message in that section
  only; other parts of the same lesson page (video, code) still render.
- A failed image load → a placeholder (broken-image state), not a broken
  page.
- A failed YouTube thumbnail/card load → a placeholder card, not a broken
  page.
- This generalizes to startup index building too: one lesson/course with
  malformed JSON must not crash the whole app. Skip/flag that entry (e.g.
  render it as unavailable in navigation) and keep indexing the rest.

The underlying rule: a corrupt or missing piece of `DATA/` degrades the one
thing it affects, never the whole page or the whole app.

## Performance

- Startup only builds a **metadata index**: `Categories.json` + every
  course manifest (for section/lesson listing, ids, titles, ordering,
  `problemBased`) + the active profile's progress store. This is cheap
  (JSON structure only, no markdown) and is why rebuilding it on every
  launch is fine (see below).
- Markdown is **not** parsed at startup. `article.json` / `problem.json` /
  cheatsheet content is only read and run through the rendering pipeline
  when that specific lesson/problem/cheatsheet page is actually opened.
- The startup index is rebuilt on every launch (dataset is static/local, so
  no incremental index cache is needed) — this refers to the lightweight
  metadata index above, not content parsing.

## Tech stack

Electron + React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui +
React Router + Zustand + Zod + marked + KaTeX + Prism.js + Fuse.js +
electron-builder, as specified. Full version table and rationale for the
non-obvious calls: [tech-stack.md](./tech-stack.md).
