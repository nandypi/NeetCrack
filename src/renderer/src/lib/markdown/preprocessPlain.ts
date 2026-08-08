import { marked } from 'marked'

// Problem descriptions (and future cheatsheets) are plain markdown — no
// ::tabs-start blocks, no <iframe> embeds (confirmed by inspecting the
// problem.json corpus, see docs/data-model.md §7) — so this skips the
// iframe/tabs protect-and-restore steps preprocessArticle.ts needs and goes
// straight to marked. Plain fenced code blocks (including ```sql) still get
// Prism-highlighted by the shared post-render wiring in MarkdownRenderer.
export function preprocessPlain(md: string): string {
  return marked.parse(md, { async: false })
}
