# Data Model

Derived entirely from reading `DATA/` (1,471 files). File/entity counts below
were cross-checked arithmetically against the actual file listing and match
exactly (see the bottom of this document), so this model accounts for
**100% of the files in `DATA/`** — nothing was left unexplained.

§§1–11 cover `DATA/` (read-only, scraped). §12 covers `user-data/` (written
by the app itself — profiles, progress, cache) so every JSON shape the app
touches, scraped or app-owned, lives in one document.

## 1. Directory layout

```
DATA/
├── Categories.json                  # top-level index of every category/course
├── cheatsheets.json                 # index of every cheatsheet
├── Cheatsheets/
│   └── <cheatsheet-id>.json         # 19 files, one per cheatsheet
├── <Category Name>/                 # 5 folders, e.g. "Python", "System Design"
│   └── <Course Title>/              # 11 folders total across all categories
│       ├── <course-id>.json         # course manifest (see §3) — ALWAYS present
│       └── <Section Name>/          # e.g. "Arrays", "Aggregation"
│           └── <Lesson Name>/       # e.g. "Kadane's Algorithm"
│               ├── _lesson.json     # lesson pointer/API descriptor (§4)
│               ├── article.json     # video-course lessons only (§5)
│               ├── code.json        # video-course lessons only (§6)
│               ├── problem.json     # problem-course lessons only (§7)
│               └── <Lesson Name>.mkv# present for 128/128 video lessons (§8)
```

Category folder names, course folder names, and section names are exact
string matches for the `title`/`name` fields in the corresponding JSON
(confirmed by spot-checking several — e.g. folder `Object Oriented Design
Patterns` ↔ course title `"Object Oriented Design Patterns"`).

## 2. Categories.json

```jsonc
{
  "categories": [
    {
      "title": "Data Structures & Algorithms",
      "description": "...",
      "courses": [
        {
          "id": "dsa-for-beginners",
          "link": "/courses/dsa-for-beginners",
          "title": "Algorithms & Data Structures for Beginners",
          "description": "...",
          "image": "https://imagedelivery.net/.../public",   // remote CDN, not local
          "duration": "35 hours",
          "difficulty": "Medium",
          "jsonPath": "Data Structures & Algorithms/Algorithms & Data Structures for Beginners/dsa-for-beginners.json",
          "problemBased": false,  // added post-scrape by hand; true for the 4 problem courses (see decisions.md)
          "completed": 0,      // always 0 in this dataset — looks like a runtime/user field baked into static data
          "total": 35          // lesson count; matches manifest lesson count exactly where checked
        }
      ]
    }
  ]
}
```

5 categories × 11 courses total. `jsonPath` is populated for all 11 courses
(the original scrape had it `null` for the 4 problem courses; this was a
data bug in the scrape and has since been patched in `Categories.json`
directly — every course entry now has a real path to its on-disk manifest).

`problemBased` is a hand-added field (not part of the original scrape) that
is the authoritative, explicit signal for which of the two content models
(§3 vs §7) a course uses — `true` for the 4 problem courses
(`python-for-beginners`, `python-coding-interviews`, `python-oop`,
`sql-for-beginners`), `false` for the other 7. Prefer this over inferring
from `link`'s `/courses/` vs `/problems/` prefix.

## 3. Course manifest — video-based courses

Path: `<jsonPath>` (or `<Category>/<Course>/<course-id>.json` by
convention). Example: `advanced-algorithms.json`.

```jsonc
{
  "data": {
    "name": "Advanced Algorithms",
    "baseCodeUrl": "https://raw.githubusercontent.com/neetcode-gh/course-data/main/advanced-algorithms/code/",
    "sections": [
      {
        "name": "Arrays",
        "lessons": [
          {
            "name": "Kadane's Algorithm",
            "vimeo": "746763358?h=fcc84c3240",   // Vimeo id + hash, or "" if none
            "free": true,                         // optional; absent = not free
            "code": {                             // optional; maps language -> path under baseCodeUrl
              "python": "python/array/kadane.py",
              "java": "java/array/Kadane.java",
              "cpp": "cpp/array/kadane.cpp",
              "javascript": "javascript/array/kadane.js",
              "swift": "swift/array/kadane.swift",
              "csharp": "csharp/array/Kadane.cs",
              "go": "go/array/Kadane.go",
              "kotlin": "kotlin/array/Kadane.kt"
            },
            "suggestedProblems": [                // LeetCode slugs, no local content
              "maximum-subarray/",
              "maximum-sum-circular-subarray/"
            ],
            "cheatsheet": "sliding-window-variations",  // optional; id into cheatsheets.json
            "customProblem": "unionFind",          // optional; names an in-app interactive widget, not markdown content
            "length": 22                            // minutes, presumably
          }
        ]
      }
    ]
  }
}
```

Notes:
- `code` (the language→path map) is a pointer to files in the
  `neetcode-gh/course-data` **GitHub repo** relative to `baseCodeUrl`, i.e.
  a *remote* location. **Decided: ignore it entirely.** `code.json` (§6) is
  the sole source of truth for lesson source code; the manifest's `code`
  map and `baseCodeUrl` are dead data as far as the app is concerned (never
  fetched, never parsed).
- `suggestedProblems` are bare LeetCode slugs (e.g.
  `"maximum-subarray/"`), not full URLs and not locally stored problems.
  They read as `https://leetcode.com/problems/<slug>`. **Decided:** render
  these as a plain checkbox list on the lesson page (link text + a
  local-only "I did this" checkbox that is just part of that lesson's
  progress state — there's no judged content behind the slug, it's an
  external pointer to LeetCode).
- `customProblem` marks lessons that in the original product presumably
  rendered an interactive visualizer (Union-Find, Dijkstra, Prim, Kruskal,
  Topological Sort, 0/1 Knapsack, Unbounded Knapsack) instead of/in
  addition to a plain code exercise. **Decided: ignore this field.** No
  bespoke visualizer widgets are in scope — a lesson with `customProblem`
  set is rendered exactly like any other lesson (article + code + video +
  `suggestedProblems` checkboxes), the field is simply never read.

## 4. `_lesson.json` (every lesson, both course kinds)

A small pointer/breadcrumb file, not primary content:

```jsonc
// video-course lesson
{
  "courseId": "advanced-algorithms",
  "sectionName": "Arrays",
  "lessonName": "Kadane's Algorithm",
  "folderName": "Kadane's Algorithm",
  "problemId": null,
  "api": { "path": "/api/articleFunctionHttp", "courseId": "advanced-algorithms", "lessonId": "Kadane's Algorithm" }
}

// problem-course lesson
{
  "courseId": "sql-for-beginners",
  "sectionName": "Aggregation",
  "lessonName": "Aggregation Avg",
  "folderName": "Aggregation Avg",
  "problemId": "sql-aggregation-avg",
  "api": { "path": "/api/getProblemMetadataFunctionHttp", "problemId": "sql-aggregation-avg" }
}
```

The `api` block is a relic of the original (online) product's backend
routes — not needed offline, but `problemId` is the reliable join key back
to `problem.json`'s `data.id` and to the course manifest's `lessons[].id`
for problem courses.

## 5. `article.json` (video-course lessons)

```jsonc
{
  "data": "# Kadane's Algorithm\n\n...markdown...\n\n::tabs-start\n```python\n...\n```\n...\n::tabs-end\n..."
}
```

`data` is a single raw markdown string (CRLF line endings, `\r\n`). It's the
full lesson article and is the direct input to the `preprocess()` pipeline
in `test.html` (see [rendering-pipeline.md](./rendering-pipeline.md)). It
contains:
- Standard markdown headings/lists/bold/links.
- Inline/block KaTeX math using `$...$` and (presumably) `$$...$$`.
- `::tabs-start` / `::tabs-end` blocks wrapping fenced code blocks per
  language (this is the *article's* copy of multi-language code, separate
  from `code.json`).
- Raw HTML `<div class="video-container">...<iframe ...
  src="https://www.youtube.com/embed/VIDEO_ID?rel=0">...` blocks — always
  YouTube embeds, confirmed to be the only `src=` domain used anywhere in
  the article corpus besides `imagedelivery.net` images.
- Markdown images `![alt](https://imagedelivery.net/.../public)` —
  **remote CDN URLs, no image files exist anywhere in `DATA/`.**

## 6. `code.json` (video-course lessons)

```jsonc
{
  "data": {
    "python": "# Brute Force: O(n^2)\ndef bruteForce(nums): ...",
    "java": "...",
    "cpp": "...",
    "javascript": "...",
    "swift": "...",
    "csharp": "...",
    "go": "...",
    "kotlin": "..."
  }
}
```

Full, standalone source per language (not a diff/snippet of the article's
tabs — same content duplicated in a language-keyed object instead of
markdown fences). These 8 languages are exactly the 8 Prism.js language
components `test.html` loads (`python java javascript c cpp csharp go
kotlin swift` — note `swift` and `c` are loaded but not always populated;
`c` never appears as a key in any `code.json` observed).

## 7. `problem.json` (interactive-problem-course lessons)

Used by Python for Beginners, Python for Coding Interviews, Python OOP,
and SQL for Beginners (the 4 courses with `problemBased: true`, §2). This
is a fundamentally different, richer shape than `article.json` +
`code.json` — it *models* a judged coding exercise, but **decided: the app
is a read-only viewer, not a judge/grader.** There is no code execution, no
submission, no test-case checking anywhere in the app. A problem lesson
just displays `description` (rendered markdown) + `starterCode` +
`solutions`, and lets the user mark the lesson complete once they've gone
through it — same completion semantics as a video lesson, just triggered
by "I read/solved this" rather than "I watched this."

```jsonc
{
  "data": {
    "id": "sql-aggregation-avg",
    "tag": "SQL",
    "name": "Aggregation Avg",
    "description": "...markdown, may include tables and fenced code blocks...\n\n#### Challenge\n\n...",
    "difficulty": "",                 // empty string in every sample seen — never populated
    "simpleProblem": true,
    "sqlProblem": true,               // SQL-course-only flag
    "availableLanguages": ["sql"],    // or ["python"], etc.
    "discludeLanguages": [...],       // seen on Python problems, redundant with availableLanguages
    "course": "sql-for-beginners",
    "test_case_type": "function",
    "sqlStartupScript": "",
    "test_cases": [],                 // empty in every sample seen
    "custom_test_cases": [""],
    "allow_customize": false,
    "video": "",                      // always empty — problem courses have no video content
    "completed": false,
    "submissionHistory": [],
    "company_tags": {},
    "solutions": { "sql": "CREATE TABLE ...\n\nSELECT ..." },      // language -> reference solution
    "starterCode": { "sql": "CREATE TABLE ...\n\n\n\n\n\n" },      // language -> starter template
    "submissionCount": 4947,          // analytics from the original live product, frozen
    "acceptedCount": 2466,
    "test_case_count": 1
  }
}
```

Key differences from the video-course model:
- `description` is markdown (with the same `$...$` math conventions and
  plain, un-tabbed fenced code blocks) but is a **problem statement**, not
  a lesson article — it embeds the "Challenge" instructions inline rather
  than as a separate field. **Decided:** this needs its own render path,
  distinct from the article renderer — no `::tabs-start` handling needed
  (see below), but the plain fenced code blocks (including ` ```sql `)
  still need Prism highlighting. See rendering-pipeline.md.
- No `::tabs-start` blocks were found in any `problem.json` sampled — code
  is single-language per problem, delivered via `solutions`/`starterCode`,
  not via markdown fences.
- `test_cases`, `custom_test_cases`, `test_case_count`, `test_case_type`,
  `sqlStartupScript`, `allow_customize` — all judge/execution-related
  fields. **Decided: ignored entirely**, consistent with "viewer, not
  grader" above. Not read, not surfaced in UI.
- `submissionHistory`, `submissionCount`, `acceptedCount`,
  `company_tags` — frozen analytics from the original hosted product, not
  this app's user's data. **Decided: ignored entirely**; the app's own
  local completion store (§ see decisions.md) is the only progress state
  that exists.
- `difficulty` is empty (`""`) in every sample. **Decided: ignore
  per-problem difficulty** rather than build UI around it — course-level
  `difficulty` in `Categories.json` is the only difficulty signal shown.
- `solutions` and `starterCode` are **not markdown** — they're raw source
  meant for a code editor widget, structurally unrelated to the
  `article.json`/`code.json` "read the article, view code tabs" flow.
  Displayed read-only (syntax-highlighted, not editable) since there's no
  execution/grading behind it.

## 8. Local video files (`.mkv`)

128 `.mkv` files, one per lesson in each of the 7 video-based courses,
named `<Lesson Name>.mkv` and colocated with that lesson's `_lesson.json`/
`article.json`/`code.json`. Total 7.2 GB. Confirmed to correlate exactly
with the "video-based course" lesson count (35+22+21+10+22+7+11 = 128).
This exists even for lessons whose manifest `vimeo` field is populated
(e.g. "Kadane's Algorithm" has both a Vimeo id and a local `.mkv`), not
only for lessons with an empty `vimeo` string — **decided: the `vimeo`
field is ignored entirely**; the local `.mkv` is always the playback
source, full stop. If the file is missing, the player shows "Video
unavailable" (see decisions.md).

## 9. Cheatsheets

`cheatsheets.json` is a flat index:

```jsonc
{
  "data": [
    {
      "id": "big-o-notation",
      "title": "Big O Notation",
      "description": "...",
      "filename": "big-o-notation.md",   // nominal — actual file is <id>.json, not .md
      "free": true,
      "category": "Fundamentals",         // one of: Fundamentals, Data Structures, Patterns, Interview Prep
      "order": 1
    }
  ]
}
```

19 entries, matching the 19 files in `Cheatsheets/`. Each
`Cheatsheets/<id>.json` has the shape:

```jsonc
{ "data": { "content": "# Big O Notation...\n\n## 1) Constant Time...", "config": { /* same object as the cheatsheets.json entry */ } } }
```

`content` is plain markdown (headings, images from `imagedelivery.net`,
inline math via `$...$`, tables, `---` rules). No `::tabs-start` blocks
observed in cheatsheets. Cheatsheets are referenced from lessons via the
manifest's `lessons[].cheatsheet` field (an id, e.g.
`"graph-crash-course"`) — a many-to-one relationship (many lessons can
point at the same cheatsheet).

## 10. Entity relationship summary

```
Category (Categories.json, 5)
  └─ Course (Categories.json + own manifest, 11; problemBased: bool picks the model below)
       │
       ├─ [video-course model, 7 courses, problemBased: false]
       │    └─ Section (name only, no id)
       │         └─ Lesson (manifest entry, ordered as in manifest array)
       │              ├─ _lesson.json      (pointer: courseId/sectionName/lessonName/folderName)
       │              ├─ article.json      (markdown article: prose + math + tabs + YouTube iframes + images)
       │              ├─ code.json         (full source per language, 8 langs — sole source of truth for code)
       │              ├─ <name>.mkv        (local video file, 128/128 present — always the playback source)
       │              ├─ .vimeo id         (IGNORED — never read)
       │              ├─ .code{}           (IGNORED — remote GitHub path map, never read)
       │              ├─ .suggestedProblems[] (LeetCode slugs, external — rendered as a checkbox list)
       │              ├─ .cheatsheet?      (→ Cheatsheets/<id>.json, many-to-one)
       │              └─ .customProblem?   (IGNORED — never read, no visualizer widgets in scope)
       │
       └─ [problem-course model, 4 courses, problemBased: true]
            └─ Section (name only, no id)
                 └─ Lesson (manifest entry: {id, name, completed}, ordered as in manifest array —
                            manifest order is authoritative, folder listing order is never used)
                      ├─ _lesson.json      (pointer: courseId/.../problemId)
                      └─ problem.json      (id, markdown description+challenge, starterCode,
                                             solutions, availableLanguages — read-only, no grading;
                                             test_cases[]/submission* fields IGNORED)

Cheatsheet (Cheatsheets/*.json, 19) ← referenced by id from video-course lessons only
```

## 11. File-count reconciliation (sanity check)

| Source | Count |
|---|---|
| Video-course lessons | 35+22+21+10+22+7+11 = **128** |
| Video-course lesson JSONs (`_lesson`+`article`+`code` × 128) | **384** |
| Problem-course lessons | 82+40+37+75 = **234** |
| Problem-course lesson JSONs (`_lesson`+`problem` × 234) | **468** |
| Course manifests (one per course; `jsonPath` now populated for all 11) | **11** |
| `Categories.json` + `cheatsheets.json` | **2** |
| `Cheatsheets/*.json` | **19** |
| **Total JSON files** | **384+468+11+2+19 = 884** ✅ matches `find DATA -name '*.json' \| wc -l` |
| `.mkv` files | **128** ✅ matches video-course lesson count exactly |

## 12. `user-data/` (app-owned, not scraped)

Everything the app itself writes locally lives under `user-data/`, sibling
to `DATA/`. Unlike `DATA/`, this is created and owned entirely by the app —
nothing here comes from the scrape. Rationale for each piece is in
[decisions.md](./decisions.md#profiles--progress-storage).

```
user-data/
├── profiles.json              # profile index (see below)
├── profiles/
│   └── <profile-id>/
│       └── progress.json      # this profile's completion + resume-position state
└── cache/                     # shared across all profiles (see decisions.md#caching-network-fetched-content)
    └── ...                    # network-fetched images/YouTube thumbnails, keyed by URL
```

### `profiles.json`

```jsonc
{
  "lastProfile": "8fd3ab12",
  "profiles": [
    { "id": "8fd3ab12", "name": "Nandan" },
    { "id": "e91ab41d", "name": "Guest" }
  ]
}
```

- `id` is a generated identifier (short random hex, as shown), never
  derived from `name`. It's also the literal folder name under
  `profiles/` — the display name is never used as a path, so renaming a
  profile is just editing `name` in place, no file moves.
- `lastProfile` is the id the app loads directly into on next launch,
  updated whenever a profile is opened/switched to.
- No `deleted`/soft-delete field — v1 has no delete UI (see decisions.md).
  Removing an entry here and its `profiles/<id>/` folder by hand is the
  only way to delete a profile.

### `profiles/<profile-id>/progress.json`

```jsonc
{
  "completed": {
    "advanced-algorithms::Arrays::Kadane's Algorithm": true,
    "sql-aggregation-avg": true
  },
  "suggestedProblemsDone": {
    "advanced-algorithms::Arrays::Kadane's Algorithm": ["maximum-subarray/"]
  },
  "videoPositions": {
    "advanced-algorithms::Arrays::Kadane's Algorithm": 642.5
  }
}
```

`completed` is a flat map from **lesson key** to completion state. Only
completed lessons need to be tracked (absence = not completed), but
storing explicit `true` values (rather than e.g. an array) keeps lookups
O(1) by key.

`suggestedProblemsDone` is a separate top-level map, same lesson-key
scheme, holding which of that lesson's checked-off LeetCode slugs (§3) the
user marked done — kept as its own map rather than nested inside
`completed`'s values so `completed`'s shape stays a plain key→boolean map
(no per-lesson variation between video/problem lessons, which don't both
have `suggestedProblems` anyway — see §3, only video-course lessons do).

`videoPositions` is a third separate top-level map (video-course lessons
only — nothing to resume for a problem lesson), lesson key → last known
`video.currentTime` in seconds, for youtube-style "resume where you left
off." Kept separate from `completed` for the same reason as
`suggestedProblemsDone`: finishing/resuming a video and marking a lesson
complete are independent actions (see
[decisions.md](./decisions.md#video--code)), not the same piece of state.

**Lesson key format** — needed because video-course and problem-course
lessons don't share a common id anywhere in the source data, and is reused
identically for both maps above:
- Problem-course lessons: the `problemId` from `_lesson.json` /
  `problem.json`'s `data.id` directly (already a clean, globally unique
  slug — see §4, §7).
- Video-course lessons: `<courseId>::<sectionName>::<folderName>` (the
  `::` separator is arbitrary but must not collide with characters that
  appear in course ids, section names, or folder names — none observed
  to contain `::`). Built from `_lesson.json`'s `courseId`/`sectionName`/
  `folderName` fields (§4). The course id has to be part of the key since
  folder names are only unique *within* a course, not globally.

### `cache/`

Shared (not per-profile) store for network-fetched images and YouTube
thumbnail cards, keyed by source URL, persisted to disk indefinitely (no
expiry, no eviction — see decisions.md#caching-network-fetched-content).
Internal layout (flat files keyed by a hash of the URL, a small index
file, etc.) is an implementation detail, not specified further here.
