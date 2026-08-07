import { resolveDataPath } from '../data/paths'
import { readJsonFile } from '../data/parsing'
import { parseCategoriesFile, parseCourseManifest } from '../data/validation'
import {
  normalizeCategories,
  normalizeCourseSummary,
  normalizeManifestSections
} from '../data/normalization'
import type { RawCategoriesFile, RawCourseEntry } from '../data/schemas'
import type { Category, CourseDetail } from '@shared/domain'

// The abstraction every future feature (lessons, profiles, search,
// progress) that touches DATA/ or user-data/ builds on — callers (the IPC
// layer today) never see jsonPath/problemBased/file paths, only domain
// models. Internally composes the parsing -> validation -> normalization
// pipeline in data/.
export class ContentRepository {
  private async readCategoriesRaw(): Promise<RawCategoriesFile> {
    const raw = await readJsonFile(resolveDataPath('Categories.json'))
    return parseCategoriesFile(raw)
  }

  private findCourseEntry(
    categories: RawCategoriesFile,
    courseId: string
  ): RawCourseEntry | undefined {
    for (const category of categories.categories) {
      const match = category.courses.find((course) => course.id === courseId)
      if (match) return match
    }
    return undefined
  }

  async listCategories(): Promise<Category[]> {
    const raw = await this.readCategoriesRaw()
    return normalizeCategories(raw)
  }

  async getCourse(courseId: string): Promise<CourseDetail | null> {
    const categories = await this.readCategoriesRaw()
    const entry = this.findCourseEntry(categories, courseId)
    if (!entry) return null

    const summary = normalizeCourseSummary(entry)

    // Manifest failures degrade only the section/lesson list, not the
    // whole course page — the summary above already came from the
    // (effectively always-valid) trusted index.
    try {
      const manifestRaw = await readJsonFile(resolveDataPath(entry.jsonPath))
      const manifest = parseCourseManifest(manifestRaw, entry.problemBased)
      const sections = normalizeManifestSections(manifest, entry.problemBased)
      return { ...summary, sections, sectionsAvailable: true }
    } catch {
      return { ...summary, sections: [], sectionsAvailable: false }
    }
  }
}
