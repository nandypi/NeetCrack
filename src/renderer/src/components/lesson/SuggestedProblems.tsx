import { Checkbox } from '@renderer/components/ui/checkbox'
import { useProfileStore } from '@renderer/lib/profile-store'
import type { SuggestedProblem } from '@shared/domain'

const NO_COMPLETED_PROBLEMS: string[] = []

function slugToTitle(slug: string): string {
  return slug
    .replace(/\/$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function SuggestedProblems({
  problems,
  lessonKey
}: {
  problems: SuggestedProblem[]
  lessonKey: string
}): React.JSX.Element | null {
  const doneSlugs = useProfileStore(
    (state) => state.progress.suggestedProblemsDone[lessonKey] ?? NO_COMPLETED_PROBLEMS
  )
  const setSuggestedProblemDone = useProfileStore((state) => state.setSuggestedProblemDone)
  const done = new Set(doneSlugs)

  if (problems.length === 0) return null

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-neutral-400">Suggested Problems</h2>
      <ul className="space-y-2">
        {problems.map((problem) => (
          <li key={problem.slug} className="flex items-center gap-2">
            <Checkbox
              id={`suggested-${problem.slug}`}
              checked={done.has(problem.slug)}
              onCheckedChange={(value) =>
                void setSuggestedProblemDone(lessonKey, problem.slug, value === true)
              }
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
