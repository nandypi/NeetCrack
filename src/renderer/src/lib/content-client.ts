import type { Category, CourseDetail, LessonDetail } from '@shared/domain'

function requireApi(): NonNullable<Window['api']> {
  if (!window.api) {
    throw new Error(
      "window.api is unavailable — this page isn't running inside the Electron renderer."
    )
  }
  return window.api
}

export async function fetchCategories(): Promise<Category[]> {
  const result = await requireApi().content.listCategories()
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export async function fetchCourse(courseId: string): Promise<CourseDetail> {
  const result = await requireApi().content.getCourse(courseId)
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export async function fetchLesson(
  courseId: string,
  sectionName: string,
  lessonName: string
): Promise<LessonDetail> {
  const result = await requireApi().content.getLesson(courseId, sectionName, lessonName)
  if (!result.ok) throw new Error(result.error)
  return result.data
}
