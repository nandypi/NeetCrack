# Rendering Pipeline (`test.html`)

`test.html` is a **296-line standalone prototype** of the article rendering
pipeline. It is not wired to `DATA/` at all — the markdown it renders is a
single hardcoded string (`const md = { "data": "# Markdown content goes
here\n\n..." }` at line 119-121). Its job in this codebase is to prove out
the markdown → HTML transform that the real app's article/cheatsheet/problem
viewer will need to reproduce.

## 1. Libraries, all loaded from CDN (jsdelivr)

| Library | Version pin | Purpose |
|---|---|---|
| `github-markdown-css` | unpinned (`/npm/...` latest) | base typography for `.markdown-body` |
| `katex` | pinned `0.16.22` (css + js) | math rendering |
| `katex` auto-render extension | pinned `0.16.22` | scans rendered DOM for `$...$`/`$$...$$` and replaces with KaTeX output |
| `marked` | **unpinned**, loaded as an ES module (`import { marked } from ".../marked/lib/marked.esm.js"`) | markdown → HTML |
| `prismjs` | unpinned (`@1`) core + 9 language components | syntax highlighting |

None of these are vendored locally. For the real app every one of these is
installed as a normal npm dependency and bundled by Vite — see
[tech-stack.md](./tech-stack.md) for exact versions. A `prism-sql`
component also needs to be added to the set the prototype loads (it ships
inside the `prismjs` package, no separate dependency — see
[decisions.md](./decisions.md#rendering)).

## 2. Load/execution order (subtle, but not a bug)

The `<script type="module">` block (lines 115-283) appears in the document
*before* the plain `<script src="prism*.js">` tags (lines 285-295), yet the
module code calls `Prism.highlightAll()` and expects Prism to already be
defined. This works because:

- `type="module"` scripts are deferred by default — they execute only after
  the HTML document has finished parsing (same timing as `defer`).
- The plain `<script src="prism*.js">` tags have no `async`/`defer`, so the
  parser blocks on each one and executes it immediately, in document order,
  *before* parsing can finish.
- Therefore, by the time the deferred module runs, all 9 Prism scripts
  (core + `python`, `java`, `javascript`, `c`, `cpp`, `csharp`, `go`,
  `kotlin`, `swift`) have already loaded and executed, and `Prism` is a
  global.
- Likewise, the two plain `<script src="katex...">` tags (lines 110-111)
  execute before the module, so `renderMathInElement` (from the auto-render
  extension) is also available in time.

**This is a load-order contract, not an accident** — if the app is
reimplemented with a bundler/module system, this exact "must exist as a
global by call time" ordering constraint needs to be preserved or replaced
with real imports.

## 3. `preprocess(md)` — the core transform (lines 202-237)

Runs in two protect-and-restore passes before handing off to `marked`,
because `marked` would otherwise mangle both raw `<iframe>` blocks and the
custom `::tabs-start` syntax:

1. **Extract iframes first.** Every `<iframe>...</iframe>` in the raw
   markdown is regex-matched (`/<iframe[\s\S]*?<\/iframe>/g`), passed to
   `renderYoutube()`, and replaced in-place with a placeholder token
   `@@SPECIAL_<n>@@`.
   - `renderYoutube()` pulls the `src="..."` attribute, extracts the video
     id from the `/embed/<id>` path, and returns a **clickable thumbnail
     card** — an `<a target="_blank" href="https://www.youtube.com/watch?v=<id>">`
     wrapping a `https://img.youtube.com/vi/<id>/hqdefault.jpg` `<img>` and
     a "▶ Watch Video" label. **It does not embed a playable iframe** —
     clicking navigates away to youtube.com in a new tab. This is a
     lazy-load/no-embed pattern, and it is hard-coded to YouTube only.
     Kept as-is for these inline article explainer embeds (decided: allowed
     to require network — see [decisions.md](./decisions.md#caching-network-fetched-content))
     — unrelated to the lesson's own primary video, which is always the
     local `.mkv` played by a real local video player, never this
     thumbnail-card pattern.
   - The wrapping `<div class="video-container" style="...">` around the
     `<iframe>` in the source markdown is **not** consumed by this regex
     (only the `<iframe>...</iframe>` itself is), so it survives into the
     final HTML wrapping the replaced card.
2. **Extract `::tabs-start` / `::tabs-end` blocks.** Regex
   `/::tabs-start\r?\n([\s\S]*?)::tabs-end/g` captures everything between
   the two markers, passes it to `renderTabs()`, and again replaces the
   whole block with a placeholder token.
   - `renderTabs()` re-scans the captured block with
     `/```([\w#+-]+)\r?\n([\s\S]*?)```/g` to pull out each fenced code
     block's language tag and body, then hand-builds a `.code-tabs` widget:
     a `.tab-bar` of `<button>`s (one per language, first one `active`) and
     a stack of `.tab-content` `<div>`s (one per language, first one
     `active`, rest `display:none`). Code text is escaped
     (`escapeHtml` — only `&`, `<`, `>`; **not** quotes) and placed in
     `<pre><code class="language-<lang>">`, ready for Prism.
   - This bypasses `marked` entirely for code — the tab widget's HTML is
     hand-built, not markdown-rendered.
3. **Run `marked.parse(md)`** on what's left (now containing only
   `@@SPECIAL_n@@` tokens where iframes/tabs used to be, plus ordinary
   markdown: headings, prose, `$...$` math left untouched, images, plain
   fenced code blocks not inside a tabs block, tables, etc.).
4. **Restore placeholders**: `html.replace(/@@SPECIAL_(\d+)@@/g, ...)`
   splices the pre-rendered iframe cards and tab widgets back into the
   `marked` output by string index. Because `marked` typically wraps a
   bare placeholder line in a `<p>...</p>`, the restored `<div>`/`.code-tabs`
   markup usually ends up **nested inside a `<p>` tag** — invalid HTML5
   (block content inside a paragraph) that browsers silently recover from
   by auto-closing the `<p>`, but worth knowing before assuming the DOM
   structure is clean.

## 4. Post-render wiring (lines 268-279)

```js
content.innerHTML = preprocess(md.data);
renderMathInElement(content, { delimiters: [
  { left: "$$", right: "$$", display: true },
  { left: "$",  right: "$",  display: false }
]});
Prism.highlightAll();
wireTabs();
```

Order matters: markdown/HTML is injected first, *then* KaTeX walks the DOM
looking for `$...$`/`$$...$$` text and replaces it in place, *then* Prism
highlights every `<code class="language-*">` on the page (including inside
inactive/hidden `.tab-content` panels — Prism does not care about
visibility), *then* `wireTabs()` attaches click handlers.

`wireTabs()` (lines 238-261) finds every `.code-tabs` container, wires each
`.tab-bar button` to toggle the matching `.tab-content` panel's `active`
class and call `Prism.highlightAllUnder(pages[i])` again on click — this
re-highlight-on-click is redundant given Prism already highlighted
everything up front in step 3, but harmless (Prism skips
already-`.highlighted`... actually it re-processes, since the `<code>`'s
inner markup was already transformed to highlighted `<span>`s the *first*
`Prism.highlightAll()` call — re-running `highlightAllUnder` on already-
highlighted markup is a known Prism footgun in general, worth verifying
directly rather than assuming, if reused as-is).

## 5. What's *not* handled in the prototype

Product-level decisions about each of these (network for images/YouTube,
caching, article-vs-problem render paths, `prism-sql`, the `.play-button`
mismatch) are in [decisions.md](./decisions.md#rendering) and
[decisions.md §Error handling](./decisions.md#error-handling) — not
repeated here. What follows is prototype-specific detail those decisions
don't cover:

- **No sanitization.** `marked.parse()` output (which passes raw HTML
  through by default) goes straight into `innerHTML` with no DOMPurify or
  equivalent step. Fine to carry forward as-is — all markdown is
  first-party bundled content from `DATA/`, not user/network input, so the
  trust boundary this assumes still holds.
- **No mermaid/diagram support**, no footnote handling beyond whatever
  `marked`'s defaults provide, no custom directive besides `::tabs-start`
  (confirmed — see data-model.md §10's reconciliation and the directive
  scan this documentation pass did over the full corpus).
- Neither `renderYoutube()` nor the image `<img>` output has any failure
  state — a 404'd thumbnail or dead image URL just renders a browser's
  default broken-image box. §6 below covers the placeholder behavior
  needed to satisfy decisions.md's error-handling rule.

## 6. Porting notes: `test.html` → React

`test.html` is vanilla DOM manipulation (`content.innerHTML = ...`,
`document.querySelectorAll(".code-tabs")`, manual click handlers in
`wireTabs()`). The transform logic (`preprocess()`, `renderTabs()`,
`renderYoutube()`, `escapeHtml()`) ports over conceptually unchanged, but
the DOM-wiring parts need to become React idioms, not be copied verbatim:

- **Rendered HTML injection**: `preprocess()` still produces one HTML
  string (marked's output + spliced-in tab/YouTube markup) — render it via
  a component that sets it once per lesson load (e.g.
  `dangerouslySetInnerHTML`), not by hand-walking the DOM to build it.
  Re-running `preprocess()` (and re-injecting) on every keystroke/state
  change isn't the goal — it runs once when a lesson/problem/cheatsheet
  page opens (see decisions.md's Performance section on lazy parsing).
- **Tab state**: because the tab widget's markup arrives as part of that
  same raw HTML string (not real JSX), React can't attach `onClick`/
  `useState` directly to it the way it would to hand-authored components.
  Keep `wireTabs()`'s approach conceptually — a single effect, scoped to
  that lesson's container ref, that attaches one delegated click listener
  after the HTML is injected (find the clicked `.tab-bar button`, toggle
  `.active` on it and the matching `.tab-content` via direct DOM calls) —
  just moved from `test.html`'s global `document.querySelectorAll` +
  top-level script into a `useEffect` scoped to the container ref, torn
  down on unmount/re-render instead of leaking listeners. This is still
  DOM manipulation, deliberately — not a case for reaching for `useState`,
  since the content it's manipulating was never React-owned JSX to begin
  with.
- **Prism highlighting timing**: the prototype's `Prism.highlightAll()` +
  `wireTabs()`'s redundant `Prism.highlightAllUnder()` on tab click (see
  §4 above — the footgun already flagged there) should become a single
  `Prism.highlightElement()` call per `<code>` node in a `useEffect` that
  runs after the HTML is injected, not a global sweep. Since Prism
  highlights hidden `.tab-content` panels too (§4), there's no need to
  re-highlight on tab switch at all — do it once, up front, per code block.
- **KaTeX timing stays the same shape**: `renderMathInElement` still runs
  once against the container **after** the HTML (including restored
  tab/YouTube markup) is in the DOM — same ordering constraint as
  `test.html` line 100–105, just triggered from a `useEffect` instead of
  top-level script order.
- **Image/YouTube failure placeholders** (decisions.md's error-handling
  rule): add an `onError` handler to rendered `<img>` tags (both markdown
  images and the YouTube thumbnail's `<img>`) that swaps in a local
  placeholder graphic/state — this is new behavior `test.html` doesn't
  have at all, not a port of existing logic.
- **Load-order contract → real imports**: `test.html`'s reliance on
  Prism/KaTeX being loaded as blocking `<script>` tags before the deferred
  module runs (§2 above) goes away entirely once these are real ES module
  imports (`import Prism from "prismjs"`, etc.) — bundlers resolve the
  dependency graph, there's no script-tag ordering to preserve.
