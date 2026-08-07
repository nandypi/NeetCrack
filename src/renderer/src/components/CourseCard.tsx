import { Link } from 'react-router'
import { Badge } from '@renderer/components/ui/badge'
import { Card, CardContent } from '@renderer/components/ui/card'
import CourseImage from './CourseImage'
import type { CourseSummary } from '@shared/domain'

const difficultyVariant: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  Easy: 'secondary',
  Medium: 'outline',
  Hard: 'destructive'
}

function CourseCard({ course }: { course: CourseSummary }): React.JSX.Element {
  return (
    <Link to={`/course/${course.id}`} className="block">
      <Card className="h-full gap-0 overflow-hidden py-0 transition-colors hover:border-neutral-600">
        <CourseImage src={course.image} alt={course.title} />
        <CardContent className="space-y-2 p-4">
          <h3 className="font-medium leading-snug">{course.title}</h3>
          <p className="line-clamp-2 text-sm text-neutral-400">{course.description}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-neutral-400">
            <Badge variant={difficultyVariant[course.difficulty] ?? 'outline'}>
              {course.difficulty}
            </Badge>
            <span>{course.duration}</span>
            <span>·</span>
            <span>{course.lessonCount} lessons</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default CourseCard
