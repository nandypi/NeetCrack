import { join } from 'node:path'
import { toVideoUrl } from '../video-protocol'
import { resolveDataPath, resolveLessonDir, resolveVideoFile } from '../data/paths'
import { readJsonFile } from '../data/parsing'
import {
  parseCategoriesFile,
  parseCourseManifest,
  parseArticle,
  parseCode,
  parseProblem
} from '../data/validation'
import {
  normalizeCategories,
  normalizeCourseSummary,
  normalizeManifestSections,
  normalizeVideoLessonDetail,
  normalizeProblemLessonDetail,
  buildLessonNavRefs,
  type VideoLessonRawFields
} from '../data/normalization'
import type {
  RawCategoriesFile,
  RawCourseEntry,
  RawVideoManifest,
  RawArticle,
  RawCode,
  RawProblem
} from '../data/schemas'
import type { Category, CourseDetail, LessonDetail } from '@shared/domain'

type Fetched<T> = { available: true; raw: T } | { available: false }

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

  // Pulls the manifest fields article.json/code.json don't carry (length,
  // suggestedProblems) for one video lesson. Only meaningful for
  // problemBased: false manifests.
  private findRawVideoLesson(
    manifest: RawVideoManifest,
    sectionName: string,
    lessonName: string
  ): VideoLessonRawFields | undefined {
    const section = manifest.data.sections.find((s) => s.name === sectionName)
    const lesson = section?.lessons.find((l) => l.name === lessonName)
    if (!lesson) return undefined
    return { length: lesson.length, suggestedProblems: lesson.suggestedProblems }
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
      const sections = normalizeManifestSections(manifest, entry.problemBased, entry.id)
      return { ...summary, sections, sectionsAvailable: true }
    } catch {
      return { ...summary, sections: [], sectionsAvailable: false }
    }
  }

  // Unlike getCourse(), a manifest failure here fails the whole lookup
  // (not just sectionsAvailable: false) — without the manifest we can't
  // even confirm the lesson exists or compute prev/next, and a course page
  // showing "Course content unavailable" already keeps the user from
  // reaching this route in the first place.
  async getLesson(
    courseId: string,
    sectionName: string,
    lessonName: string
  ): Promise<LessonDetail | null> {
    const categories = await this.readCategoriesRaw()
    const entry = this.findCourseEntry(categories, courseId)
    if (!entry) return null

    const manifestRaw = await readJsonFile(resolveDataPath(entry.jsonPath))
    const manifest = parseCourseManifest(manifestRaw, entry.problemBased)
    const sections = normalizeManifestSections(manifest, entry.problemBased, entry.id)
    const { previous, next, found } = buildLessonNavRefs(sections, sectionName, lessonName)
    if (!found) return null

    const lessonDir = await resolveLessonDir(entry.jsonPath, sectionName, lessonName)
    const shared = {
      lessonKey:
        sections
          .find((section) => section.name === sectionName)
          ?.lessons.find((lesson) => lesson.name === lessonName)?.key ??
        `${entry.id}::${sectionName}::${lessonName}`,
      courseId: entry.id,
      courseTitle: entry.title,
      sectionName,
      lessonName,
      previous,
      next
    }

    if (entry.problemBased) {
      const problem = await this.readProblem(lessonDir)
      return normalizeProblemLessonDetail({ ...shared, problem })
    }

    const [article, code, video] = await Promise.all([
      this.readArticle(lessonDir),
      this.readCode(lessonDir),
      this.readVideo(lessonDir, lessonName)
    ])
    const manifestFields =
      this.findRawVideoLesson(manifest as RawVideoManifest, sectionName, lessonName) ?? {}
    return normalizeVideoLessonDetail({ ...shared, manifestFields, article, code, video })
  }

  private async readArticle(lessonDir: string): Promise<Fetched<RawArticle>> {
    try {
      const raw = parseArticle(await readJsonFile(join(lessonDir, 'article.json')))
      return { available: true, raw }
    } catch {
      return { available: false }
    }
  }

  private async readCode(lessonDir: string): Promise<Fetched<RawCode>> {
    try {
      const raw = parseCode(await readJsonFile(join(lessonDir, 'code.json')))
      return { available: true, raw }
    } catch {
      return { available: false }
    }
  }

  private async readProblem(lessonDir: string): Promise<Fetched<RawProblem>> {
    try {
      const raw = parseProblem(await readJsonFile(join(lessonDir, 'problem.json')))
      return { available: true, raw }
    } catch {
      return { available: false }
    }
  }

  private async readVideo(
    lessonDir: string,
    lessonName: string
  ): Promise<{ available: true; url: string } | { available: false }> {
    const videoPath = await resolveVideoFile(lessonDir, lessonName)
    if (!videoPath) return { available: false }
    return { available: true, url: toVideoUrl(videoPath) }
  }
}
