import { contextBridge, ipcRenderer } from 'electron'
import type { Category, ContentResult, CourseDetail, LessonDetail } from '@shared/domain'

// The renderer's entire view of DATA/ is this `content` surface — plain
// domain models in, no filesystem/jsonPath/problemBased details ever cross
// this boundary. Future features (lessons, profiles, search, progress) add
// their own narrow surfaces here the same way, backed by their own
// main-process repository.
//
// `process` below is Electron's sandboxed-preload global, used directly:
// both `import process from 'node:process'` (unresolved node: prefix) and
// `import { versions } from 'process'` (redeclares the existing global,
// SyntaxError) fail to load in this sandboxed context.
const api = {
  versions: {
    chrome: process.versions.chrome,
    node: process.versions.node,
    electron: process.versions.electron
  },
  content: {
    listCategories: (): Promise<ContentResult<Category[]>> =>
      ipcRenderer.invoke('content:listCategories'),
    getCourse: (courseId: string): Promise<ContentResult<CourseDetail>> =>
      ipcRenderer.invoke('content:getCourse', courseId),
    getLesson: (
      courseId: string,
      sectionName: string,
      lessonName: string
    ): Promise<ContentResult<LessonDetail>> =>
      ipcRenderer.invoke('content:getLesson', courseId, sectionName, lessonName)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
