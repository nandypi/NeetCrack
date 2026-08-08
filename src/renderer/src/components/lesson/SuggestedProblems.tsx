import { useState } from 'react'
import { Checkbox } from '@renderer/components/ui/checkbox'
import type { SuggestedProblem } from '@shared/domain'

// LeetCode slugs render as link text + a local "I did this" checkbox — no
// judged content behind the slug (see docs/decisions.md#video--code). Links
// open externally via the BrowserWindow's existing setWindowOpenHandler.
// Checked state is UI-only, in-memory — no progress persistence this phase.
function slugToTitle(slug: string): string {
  return slug
    .replace(/\/$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SuggestedProblems({
  problems
}: {
  problems: SuggestedProblem[]
}): React.JSX.Element | null {
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())

  if (problems.length === 0) return null

  function toggle(slug: string): void {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-neutral-400">Suggested Problems</h2>
      <ul className="space-y-2">
        {problems.map((problem) => (
          <li key={problem.slug} className="flex items-center gap-2">
            <Checkbox
              id={`suggested-${problem.slug}`}
              checked={done.has(problem.slug)}
              onCheckedChange={() => toggle(problem.slug)}
            />
            <label htmlFor={`suggested-${problem.slug}`} className="text-sm text-neutral-300">
              <a
                href={problem.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-neutral-100 hover:underline"
              >
                {slugToTitle(problem.slug)}
              </a>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SuggestedProblems
