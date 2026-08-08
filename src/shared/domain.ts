// Domain models that cross the main <-> renderer IPC boundary. The renderer
// only ever sees these shapes — no jsonPath, no problemBased, no raw DATA/
// JSON structure. Everything here is already normalized by the main-process
// repository before it's sent across.

export interface CourseSummary {
  id: string
  title: string
  description: string
  image: string
  duration: string
  difficulty: string
  lessonCount: number
}

export interface Category {
  title: string
  description: string
  courses: CourseSummary[]
}

export interface Lesson {
  name: string
  durationMinutes?: number
}

export interface Section {
  name: string
  lessons: Lesson[]
}

export interface CourseDetail extends CourseSummary {
  sections: Section[]
  // False when the course's manifest failed to load/validate — the summary
  // (title/description/image/etc, from Categories.json) is still shown, but
  // the section/lesson list degrades independently. Per-page fault isolation.
  sectionsAvailable: boolean
}

export interface CodeSample {
  language: string
  code: string
}

export interface SuggestedProblem {
  slug: string
  url: string
}

export interface LessonNavRef {
  sectionName: string
  lessonName: string
}

interface LessonDetailBase {
  courseId: string
  courseTitle: string
  sectionName: string
  name: string
  previous: LessonNavRef | null
  next: LessonNavRef | null
}

export interface VideoLessonDetail extends LessonDetailBase {
  kind: 'video'
  durationMinutes?: number
  videoUrl: string | null
  videoAvailable: boolean
  articleMarkdown: string
  articleAvailable: boolean
  code: CodeSample[]
  codeAvailable: boolean
  suggestedProblems: SuggestedProblem[]
}

export interface ProblemLessonDetail extends LessonDetailBase {
  kind: 'problem'
  problemId: string
  descriptionMarkdown: string
  solutions: CodeSample[]
  contentAvailable: boolean
}

export type LessonDetail = VideoLessonDetail | ProblemLessonDetail

export type ContentResult<T> = { ok: true; data: T } | { ok: false; error: string }
