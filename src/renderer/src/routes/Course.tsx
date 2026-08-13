import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { CheckCircle2, Circle } from 'lucide-react'
import { fetchCourse } from '@renderer/lib/content-client'
import { lessonPath } from '@renderer/lib/routes'
import { Badge } from '@renderer/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import CourseImage from '@renderer/components/CourseImage'
import type { CourseDetail } from '@shared/domain'
import { useProfileStore } from '@renderer/lib/profile-store'

export async function courseLoader({ params }: LoaderFunctionArgs): Promise<CourseDetail> {
  if (!params.courseId) throw new Error('Missing courseId')
  return fetchCourse(params.courseId)
}

function Course(): React.JSX.Element {
  const course = useLoaderData() as CourseDetail
  const completed = useProfileStore((state) => state.progress.completed)
  const lessons = course.sections.flatMap((section) => section.lessons)
  const completedCount = lessons.filter((lesson) => completed[lesson.key]).length
  const completionPercentage = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← All courses
      </Link>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <CourseImage
          src={course.image}
          alt={course.title}
          className="w-full max-w-xs rounded-lg sm:w-56"
        />
        <div>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <p className="mt-2 text-neutral-400">{course.description}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-neutral-400">
            <Badge variant="outline">{course.difficulty}</Badge>
            <span>{course.duration}</span>
            <span>·</span>
            <span>{course.lessonCount} lessons</span>
          </div>
          {course.sectionsAvailable ? (
            <div className="mt-5 max-w-md">
              <div className="mb-1.5 flex justify-between text-xs text-neutral-400">
                <span>
                  {completedCount} of {lessons.length} completed
                </span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width]"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-neutral-400">Sections</h2>
        {!course.sectionsAvailable ? (
          <p className="text-sm text-red-400">Course content unavailable.</p>
        ) : (
          <Accordion type="multiple" className="rounded-lg border border-neutral-800 px-4">
            {course.sections.map((section) => (
              <AccordionItem key={section.name} value={section.name}>
                <AccordionTrigger>
                  <span>
                    {section.name}{' '}
                    <span className="text-neutral-500">
                      ({section.lessons.filter((lesson) => completed[lesson.key]).length}/
                      {section.lessons.length})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="divide-y divide-neutral-800">
                    {section.lessons.map((lesson) => (
                      <li key={lesson.name}>
                        <Link
                          to={lessonPath(course.id, section.name, lesson.name)}
                          className="flex items-center justify-between py-2 text-sm text-neutral-300 hover:text-neutral-100"
                        >
                          <span className="flex items-center gap-2">
                            {completed[lesson.key] ? (
                              <CheckCircle2 className="size-4 text-green-500" />
                            ) : (
                              <Circle className="size-4 text-neutral-600" />
                            )}
                            {lesson.name}
                          </span>
                          {lesson.durationMinutes ? (
                            <span className="text-xs text-neutral-500">
                              {lesson.durationMinutes} min
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  )
}

export default Course
