import { marked } from 'marked'

// Ported from test.html's preprocess()/renderTabs()/renderYoutube()/escapeHtml()
// (see docs/rendering-pipeline.md). Only applies to lesson articles — the
// only place ::tabs-start/::tabs-end and <iframe> YouTube embeds occur.
// Runs in two protect-and-restore passes before handing off to marked,
// because marked would otherwise mangle both.

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTabs(block: string): string {
  const langs: string[] = []
  const codes: string[] = []

  const codeRegex = /```([\w#+-]+)\r?\n([\s\S]*?)```/g
  let match: RegExpExecArray | null
  while ((match = codeRegex.exec(block)) !== null) {
    langs.push(match[1])
    codes.push(match[2].trimEnd())
  }

  const tabBar = langs
    .map(
      (lang, i) => `<button class="${i === 0 ? 'active' : ''}" data-index="${i}">${lang}</button>`
    )
    .join('')

  const tabPanels = codes
    .map(
      (code, i) =>
        `<div class="tab-content ${i === 0 ? 'active' : ''}"><pre><code class="language-${langs[i]}">${escapeHtml(code)}</code></pre></div>`
    )
    .join('')

  return `<div class="code-tabs"><div class="tab-bar">${tabBar}</div>${tabPanels}</div>`
}

function renderYoutube(html: string): string {
  const srcMatch = html.match(/src="([^"]+)"/)
  if (!srcMatch) return html

  const embedUrl = srcMatch[1]
  const id = embedUrl.match(/embed\/([^?"]+)/)?.[1]
  if (!id) return html

  return `<a class="youtube-card" target="_blank" href="https://www.youtube.com/watch?v=${id}"><img src="https://img.youtube.com/vi/${id}/hqdefault.jpg" alt="YouTube video thumbnail"><div class="play">▶ Watch Video</div></a>`
}

export function preprocessArticle(md: string): string {
  const specials: string[] = []

  let working = md.replace(/<iframe[\s\S]*?<\/iframe>/g, (match) => {
    const id = specials.length
    specials.push(renderYoutube(match))
    return `@@SPECIAL_${id}@@`
  })

  working = working.replace(/::tabs-start\r?\n([\s\S]*?)::tabs-end/g, (_, block: string) => {
    const id = specials.length
    specials.push(renderTabs(block))
    return `@@SPECIAL_${id}@@`
  })

  let html = marked.parse(working, { async: false })
  html = html.replace(/@@SPECIAL_(\d+)@@/g, (_, id: string) => specials[Number(id)])
  return html
}
