import { Checkbox } from '@renderer/components/ui/checkbox'
import { useProfileStore } from '@renderer/lib/profile-store'

function MarkCompletedCheckbox({ lessonKey }: { lessonKey: string }): React.JSX.Element {
  const completed = useProfileStore((state) => Boolean(state.progress.completed[lessonKey]))
  const setLessonCompleted = useProfileStore((state) => state.setLessonCompleted)

  return (
    <label className="flex w-fit items-center gap-2 text-sm text-neutral-300">
      <Checkbox
        checked={completed}
        onCheckedChange={(value) => void setLessonCompleted(lessonKey, value === true)}
      />
      {completed ? 'Completed' : 'Mark as completed'}
    </label>
  )
}

export default MarkCompletedCheckbox
