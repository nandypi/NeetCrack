import type {
  RawCategoriesFile,
  RawCourseEntry,
  RawVideoManifest,
  RawProblemManifest,
  RawArticle,
  RawCode,
  RawProblem
} from './schemas'
import type {
  Category,
  CourseSummary,
  Section,
  CodeSample,
  SuggestedProblem,
  LessonNavRef,
  VideoLessonDetail,
  ProblemLessonDetail
} from '@shared/domain'

// Sole responsibility: turn validated raw shapes into the domain models the
// renderer consumes. No filesystem access, no schema/validation knowledge.

export function normalizeCourseSummary(raw: RawCourseEntry): CourseSummary {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    image: raw.image,
    duration: raw.duration,
    difficulty: raw.difficulty,
    lessonCount: raw.total
  }
}

export function normalizeCategories(raw: RawCategoriesFile): Category[] {
  return raw.categories.map((category) => ({
    title: category.title,
    description: category.description,
    courses: category.courses.map(normalizeCourseSummary)
  }))
}

function normalizeVideoSections(raw: RawVideoManifest, courseId: string): Section[] {
  return raw.data.sections.map((section) => ({
    name: section.name,
    lessons: section.lessons.map((lesson) => ({
      key: `${courseId}::${section.name}::${lesson.name}`,
      name: lesson.name,
      durationMinutes: lesson.length
    }))
  }))
}

function normalizeProblemSections(raw: RawProblemManifest): Section[] {
  return raw.data.sections.map((section) => ({
    name: section.name,
    lessons: section.lessons.map((lesson) => ({ key: lesson.id, name: lesson.name }))
  }))
}

export function normalizeManifestSections(
  raw: RawVideoManifest | RawProblemManifest,
  problemBased: boolean,
  courseId: string
): Section[] {
  return problemBased
    ? normalizeProblemSections(raw as RawProblemManifest)
    : normalizeVideoSections(raw as RawVideoManifest, courseId)
}

// Bare LeetCode slugs (e.g. "maximum-subarray/") -> a slug (stable key for
// future progress tracking, see docs/data-model.md §12) + the full LeetCode
// url. Built here, not in the renderer, so the renderer never constructs
// external urls itself.
export function normalizeSuggestedProblems(slugs: string[]): SuggestedProblem[] {
  return slugs.map((slug) => ({
    slug,
    url: `https://leetcode.com/problems/${slug}`
  }))
}

// Flattens a course's sections into course-wide lesson order and finds the
// previous/next lesson relative to (sectionName, lessonName) — crosses
// section boundaries naturally (last lesson of one section's "next" is the
// first lesson of the next section). Returns null for both if the lesson
// isn't found (caller treats that as "lesson not found").
export function buildLessonNavRefs(
  sections: Section[],
  sectionName: string,
  lessonName: string
): { previous: LessonNavRef | null; next: LessonNavRef | null; found: boolean } {
  const flat: LessonNavRef[] = sections.flatMap((section) =>
    section.lessons.map((lesson) => ({ sectionName: section.name, lessonName: lesson.name }))
  )
  const index = flat.findIndex(
    (ref) => ref.sectionName === sectionName && ref.lessonName === lessonName
  )
  if (index === -1) {
    return { previous: null, next: null, found: false }
  }
  return {
    previous: index > 0 ? flat[index - 1] : null,
    next: index < flat.length - 1 ? flat[index + 1] : null,
    found: true
  }
}

function normalizeCodeRecord(raw: Record<string, string>): CodeSample[] {
  return Object.entries(raw).map(([language, code]) => ({ language, code }))
}

export interface VideoLessonRawFields {
  length?: number
  suggestedProblems?: string[]
}

export interface VideoLessonSources {
  lessonKey: string
  courseId: string
  courseTitle: string
  sectionName: string
  lessonName: string
  previous: LessonNavRef | null
  next: LessonNavRef | null
  manifestFields: VideoLessonRawFields
  article: { available: true; raw: RawArticle } | { available: false }
  code: { available: true; raw: RawCode } | { available: false }
  video: { available: true; url: string } | { available: false }
}

export function normalizeVideoLessonDetail(sources: VideoLessonSources): VideoLessonDetail {
  return {
    kind: 'video',
    key: sources.lessonKey,
    courseId: sources.courseId,
    courseTitle: sources.courseTitle,
    sectionName: sources.sectionName,
    name: sources.lessonName,
    previous: sources.previous,
    next: sources.next,
    durationMinutes: sources.manifestFields.length,
    videoUrl: sources.video.available ? sources.video.url : null,
    videoAvailable: sources.video.available,
    articleMarkdown: sources.article.available ? sources.article.raw.data : '',
    articleAvailable: sources.article.available,
    code: sources.code.available ? normalizeCodeRecord(sources.code.raw.data) : [],
    codeAvailable: sources.code.available,
    suggestedProblems: normalizeSuggestedProblems(sources.manifestFields.suggestedProblems ?? [])
  }
}

export interface ProblemLessonSources {
  lessonKey: string
  courseId: string
  courseTitle: string
  sectionName: string
  lessonName: string
  previous: LessonNavRef | null
  next: LessonNavRef | null
  problem: { available: true; raw: RawProblem } | { available: false }
}

export function normalizeProblemLessonDetail(sources: ProblemLessonSources): ProblemLessonDetail {
  const problem = sources.problem.available ? sources.problem.raw.data : null
  return {
    kind: 'problem',
    key: sources.lessonKey,
    courseId: sources.courseId,
    courseTitle: sources.courseTitle,
    sectionName: sources.sectionName,
    name: sources.lessonName,
    previous: sources.previous,
    next: sources.next,
    problemId: problem?.id ?? '',
    descriptionMarkdown: problem?.description ?? '',
    solutions: problem ? normalizeCodeRecord(problem.solutions) : [],
    contentAvailable: sources.problem.available
  }
}
