import { Link } from 'react-router'
import VideoPlayer from '@renderer/components/lesson/VideoPlayer'
import CodePanel from '@renderer/components/lesson/CodePanel'
import LessonNav from '@renderer/components/lesson/LessonNav'
import SuggestedProblems from '@renderer/components/lesson/SuggestedProblems'
import MarkCompletedCheckbox from '@renderer/components/lesson/MarkCompletedCheckbox'
import MarkdownRenderer from '@renderer/components/markdown/MarkdownRenderer'
import type { VideoLessonDetail } from '@shared/domain'

function VideoLessonPage({ lesson }: { lesson: VideoLessonDetail }): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        to={`/course/${lesson.courseId}`}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {lesson.courseTitle}
      </Link>

      <VideoPlayer src={lesson.videoUrl} className="mt-4" />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lesson.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {lesson.sectionName}
            {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MarkCompletedCheckbox />
          {lesson.codeAvailable && <CodePanel code={lesson.code} />}
        </div>
      </div>

      <div className="mt-8">
        <LessonNav courseId={lesson.courseId} previous={lesson.previous} next={lesson.next} />
      </div>

      <div className="mt-8">
        <SuggestedProblems problems={lesson.suggestedProblems} />
      </div>

      <div className="mt-10 border-t border-neutral-800 pt-8">
        {lesson.articleAvailable ? (
          <MarkdownRenderer markdown={lesson.articleMarkdown} mode="article" />
        ) : (
          <p className="text-sm text-red-400">Article unavailable.</p>
        )}
      </div>
    </div>
  )
}

export default VideoLessonPage
