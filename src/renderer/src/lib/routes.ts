// Section/lesson names contain characters (', &, spaces) that need explicit
// encoding as route path segments — this is the one place that encoding
// happens, so Course.tsx's lesson links and LessonNav's prev/next links
// can't drift out of sync with how Lesson.tsx's loader decodes them.
export function lessonPath(courseId: string, sectionName: string, lessonName: string): string {
  return `/course/${encodeURIComponent(courseId)}/lesson/${encodeURIComponent(sectionName)}/${encodeURIComponent(lessonName)}`
}
