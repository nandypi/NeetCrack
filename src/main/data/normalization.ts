import type {
  RawCategoriesFile,
  RawCourseEntry,
  RawVideoManifest,
  RawProblemManifest
} from './schemas'
import type { Category, CourseSummary, Section } from '@shared/domain'

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

function normalizeVideoSections(raw: RawVideoManifest): Section[] {
  return raw.data.sections.map((section) => ({
    name: section.name,
    lessons: section.lessons.map((lesson) => ({
      name: lesson.name,
      durationMinutes: lesson.length
    }))
  }))
}

function normalizeProblemSections(raw: RawProblemManifest): Section[] {
  return raw.data.sections.map((section) => ({
    name: section.name,
    lessons: section.lessons.map((lesson) => ({ name: lesson.name }))
  }))
}

export function normalizeManifestSections(
  raw: RawVideoManifest | RawProblemManifest,
  problemBased: boolean
): Section[] {
  return problemBased
    ? normalizeProblemSections(raw as RawProblemManifest)
    : normalizeVideoSections(raw as RawVideoManifest)
}
