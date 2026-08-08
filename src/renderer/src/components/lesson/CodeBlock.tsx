import { useEffect, useRef } from 'react'
import { Prism } from '@renderer/lib/markdown/prism-languages'
import type { CodeSample } from '@shared/domain'

// A single highlighted, read-only code block — structured data (code.json /
// problem.json's solutions), not markdown, so this is a real React
// component with a plain Prism.highlightElement() call, not the
// MarkdownRenderer's DOM-injection pipeline.
function CodeBlock({ sample }: { sample: CodeSample }): React.JSX.Element {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) Prism.highlightElement(codeRef.current)
  }, [sample])

  return (
    <pre className="max-h-[60vh] overflow-auto rounded-md bg-neutral-900 p-4 text-sm">
      <code ref={codeRef} className={`language-${sample.language}`}>
        {sample.code}
      </code>
    </pre>
  )
}

export default CodeBlock
