import { useEffect, useMemo, useRef } from 'react'
import renderMathInElement from 'katex/contrib/auto-render'
import { preprocessArticle } from '@renderer/lib/markdown/preprocessArticle'
import { preprocessPlain } from '@renderer/lib/markdown/preprocessPlain'
import { Prism } from '@renderer/lib/markdown/prism-languages'
import { cn } from '@renderer/lib/utils'

function replaceWithPlaceholder(img: HTMLImageElement): void {
  const placeholder = document.createElement('div')
  placeholder.className =
    'flex aspect-video w-full items-center justify-center rounded-md bg-neutral-900 text-xs text-neutral-500'
  placeholder.textContent = 'Image unavailable'
  img.replaceWith(placeholder)
}

// Shared renderer for both lesson articles and problem descriptions — see
// docs/rendering-pipeline.md. `mode` picks which preprocess pass produced
// `markdown`'s HTML (full ::tabs-start/<iframe> pipeline vs. plain
// marked.parse); the post-render wiring below (KaTeX, Prism, tab clicks,
// broken-image fallback) is identical either way. `mode="plain"` output
// never contains a `.code-tabs` widget, so the tab-wiring pass there is a
// harmless no-op rather than a special case.
function MarkdownRenderer({
  markdown,
  mode,
  className
}: {
  markdown: string
  mode: 'article' | 'plain'
  className?: string
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  const html = useMemo(
    () => (mode === 'article' ? preprocessArticle(markdown) : preprocessPlain(markdown)),
    [markdown, mode]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    })

    container.querySelectorAll<HTMLElement>('pre code[class*="language-"]').forEach((node) => {
      Prism.highlightElement(node)
    })

    const controller = new AbortController()

    container.querySelectorAll<HTMLElement>('.code-tabs').forEach((tabs) => {
      const buttons = Array.from(tabs.querySelectorAll<HTMLButtonElement>('.tab-bar button'))
      const panels = Array.from(tabs.querySelectorAll<HTMLElement>('.tab-content'))
      buttons.forEach((button, i) => {
        button.addEventListener(
          'click',
          () => {
            buttons.forEach((b) => b.classList.remove('active'))
            panels.forEach((p) => p.classList.remove('active'))
            button.classList.add('active')
            panels[i]?.classList.add('active')
          },
          { signal: controller.signal }
        )
      })
    })

    // `error` doesn't bubble, so a capture-phase listener on the container
    // is needed to catch it for any <img> inside (markdown images and the
    // YouTube thumbnail card's <img> alike). New behavior — test.html has
    // no failure state for these — mirrors CourseImage's fallback pattern.
    container.addEventListener(
      'error',
      (event) => {
        if (event.target instanceof HTMLImageElement) {
          replaceWithPlaceholder(event.target)
        }
      },
      { capture: true, signal: controller.signal }
    )

    return () => controller.abort()
  }, [html])

  return (
    <div
      ref={containerRef}
      className={cn('markdown-body', className)}
      // Content is first-party bundled markdown from DATA/, not user/network
      // input — see docs/rendering-pipeline.md's trust-boundary note.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default MarkdownRenderer
