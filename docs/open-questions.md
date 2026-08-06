# Open Questions / Ambiguities

Per the project brief, anything ambiguous or requiring a product call is
surfaced here rather than silently guessed at.

Three rounds of questions — video source, `jsonPath: null`, problem-course
ordering, `customProblem`, image offline strategy, `code.json` vs. manifest
`code` map, judged test cases, SQL Prism support, per-problem `difficulty`,
frozen product analytics, `DATA.zip`, tech stack + versions, multi-profile
mechanics, cache scope, and `.mkv` container playback — have all been
resolved; see [decisions.md](./decisions.md) and
[tech-stack.md](./tech-stack.md). The `.play-button`/`.play` CSS mismatch
was resolved directly (rename to one consistent class) since it didn't
need a product decision, just an engineering call — same as the
`electron-vite` build-bridge addition and the lesson-completion key
format, both in decisions.md.

**Nothing is currently open.** New entries belong here as soon as
implementation surfaces a genuine product decision that isn't already
covered by decisions.md — don't let this go stale by leaving resolved
items in place (see git history for prior rounds if the resolution
rationale is ever needed).

## Resolved: `.mkv` container playback (was open question #1)

Verified with a throwaway Electron spike (plain `<video>` element, real
lesson `.mkv` files from `DATA/`, not integrated into the app, deleted
after) rather than left as a guess:

- **Playback works out of the box.** A plain `<video src="file://...mkv">`
  loads, plays, and decodes correctly in Electron's Chromium — no `ffmpeg`
  remux, no native player embed, no extra dependency needed.
- **Seeking works.** Setting `currentTime` fires `seeked` and lands
  exactly on target.
- **Duration and dimensions are detected correctly.** `loadedmetadata`
  reports real values (e.g. `1301.973s` / `1920x1080` for one sample,
  cross-checking almost exactly against that lesson's `length: 22` minutes
  in the course manifest; a second sample from a different course behaved
  identically).
- **No console/video errors** on either sample tested.
- **MIME type**: a `fetch()` against the `file://` URL reports
  `content-type: video/x-matroska` (status 200) — Chromium's file handler
  does correctly identify the container. Interestingly,
  `video.canPlayType('video/x-matroska')` reports `""` (empty — i.e.
  Chromium doesn't *advertise* support for the container) even though
  actual playback succeeds. **Don't use `canPlayType()` to gate whether a
  video can play** — it undersells real support here; detect failure via
  the `error` event on an actual load attempt instead, per the
  fault-isolation rule in decisions.md's Error handling section.

**Decided:** use a plain `<video>` element pointed at the local `.mkv`
`file://` path, with custom controls built on top of it (not the browser's
default native control bar, for visual consistency with the rest of the
UI). Resume-from-last-position, seeking, and playback speed are all native
`<video>` capabilities (`currentTime`, `playbackRate`) confirmed working
in the spike — see [decisions.md](./decisions.md#video--code) for the
resume-position storage design.
