import { Link } from 'react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import LessonNav from '@renderer/components/lesson/LessonNav'
import CodeTabs from '@renderer/components/lesson/CodeTabs'
import MarkdownRenderer from '@renderer/components/markdown/MarkdownRenderer'
import MarkCompletedCheckbox from '@renderer/components/lesson/MarkCompletedCheckbox'
import type { ProblemLessonDetail } from '@shared/domain'

function ProblemLessonPage({ lesson }: { lesson: ProblemLessonDetail }): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        to={`/course/${lesson.courseId}`}
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← {lesson.courseTitle}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lesson.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">{lesson.sectionName}</p>
        </div>
        <MarkCompletedCheckbox lessonKey={lesson.key} />
      </div>

      <div className="mt-8">
        <LessonNav courseId={lesson.courseId} previous={lesson.previous} next={lesson.next} />
      </div>

      <div className="mt-8">
        {!lesson.contentAvailable ? (
          <p className="text-sm text-red-400">Problem unavailable.</p>
        ) : (
          <Tabs defaultValue="question">
            <TabsList>
              <TabsTrigger value="question">Question</TabsTrigger>
              <TabsTrigger value="solution">Solution</TabsTrigger>
            </TabsList>
            <TabsContent value="question">
              <MarkdownRenderer markdown={lesson.descriptionMarkdown} mode="plain" />
            </TabsContent>
            <TabsContent value="solution">
              <CodeTabs code={lesson.solutions} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}

export default ProblemLessonPage
