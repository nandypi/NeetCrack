import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { fetchCourse } from '@renderer/lib/content-client'
import { Badge } from '@renderer/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'
import CourseImage from '@renderer/components/CourseImage'
import type { CourseDetail } from '@shared/domain'

export async function courseLoader({ params }: LoaderFunctionArgs): Promise<CourseDetail> {
  if (!params.courseId) throw new Error('Missing courseId')
  return fetchCourse(params.courseId)
}

function Course(): React.JSX.Element {
  const course = useLoaderData() as CourseDetail

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
                    <span className="text-neutral-500">({section.lessons.length})</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="divide-y divide-neutral-800">
                    {section.lessons.map((lesson) => (
                      <li
                        key={lesson.name}
                        className="flex items-center justify-between py-2 text-sm text-neutral-300"
                      >
                        <span>{lesson.name}</span>
                        {lesson.durationMinutes ? (
                          <span className="text-xs text-neutral-500">
                            {lesson.durationMinutes} min
                          </span>
                        ) : null}
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
