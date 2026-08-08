import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { lessonPath } from '@renderer/lib/routes'
import type { LessonNavRef } from '@shared/domain'

function LessonNav({
  courseId,
  previous,
  next
}: {
  courseId: string
  previous: LessonNavRef | null
  next: LessonNavRef | null
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      {previous ? (
        <Button asChild variant="outline">
          <Link to={lessonPath(courseId, previous.sectionName, previous.lessonName)}>
            <ChevronLeft className="size-4" />
            {previous.lessonName}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button asChild variant="outline">
          <Link to={lessonPath(courseId, next.sectionName, next.lessonName)}>
            {next.lessonName}
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </div>
  )
}

export default LessonNav
