import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { fetchLesson } from '@renderer/lib/content-client'
import VideoLessonPage from './lesson/VideoLessonPage'
import ProblemLessonPage from './lesson/ProblemLessonPage'
import type { LessonDetail } from '@shared/domain'

export async function lessonLoader({ params }: LoaderFunctionArgs): Promise<LessonDetail> {
  if (!params.courseId || !params.sectionName || !params.lessonName) {
    throw new Error('Missing lesson route params')
  }
  return fetchLesson(params.courseId, params.sectionName, params.lessonName)
}

// One route for both content models — dispatches on the domain `kind`
// field, never on `problemBased` (the renderer never sees that field at
// all, see src/shared/domain.ts).
function Lesson(): React.JSX.Element {
  const lesson = useLoaderData() as LessonDetail
  // React Router reuses this same component instance across lesson-to-
  // lesson navigation (only params change, not the matched route/element),
  // so without a key tied to lesson identity, local state (video
  // play/pause, mark-completed, suggested-problems checkboxes) leaks from
  // the previous lesson into the next one instead of resetting.
  const key = `${lesson.courseId}::${lesson.sectionName}::${lesson.name}`
  return lesson.kind === 'video' ? (
    <VideoLessonPage key={key} lesson={lesson} />
  ) : (
    <ProblemLessonPage key={key} lesson={lesson} />
  )
}

export default Lesson
