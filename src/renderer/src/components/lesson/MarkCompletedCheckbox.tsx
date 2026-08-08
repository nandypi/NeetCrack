import { useState } from 'react'
import { Checkbox } from '@renderer/components/ui/checkbox'

// UI-only — no progress persistence this phase (see project scope).
function MarkCompletedCheckbox(): React.JSX.Element {
  const [completed, setCompleted] = useState(false)

  return (
    <label className="flex w-fit items-center gap-2 text-sm text-neutral-300">
      <Checkbox checked={completed} onCheckedChange={(value) => setCompleted(value === true)} />
      Mark as completed
    </label>
  )
}

export default MarkCompletedCheckbox
