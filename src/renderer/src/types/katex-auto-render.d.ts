// katex ships no type declarations for its "contrib/auto-render" subpath
// export (only the root "katex" module has types/katex.d.ts) — this is a
// minimal shim covering the surface MarkdownRenderer actually uses.
declare module 'katex/contrib/auto-render' {
  import type { KatexOptions } from 'katex'

  export interface AutoRenderOptions extends KatexOptions {
    delimiters?: { left: string; right: string; display: boolean }[]
    ignoredTags?: string[]
    ignoredClasses?: string[]
    errorCallback?: (msg: string, err: unknown) => void
  }

  export default function renderMathInElement(
    element: HTMLElement,
    options?: AutoRenderOptions
  ): void
}
