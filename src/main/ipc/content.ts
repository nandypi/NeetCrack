import { ipcMain } from 'electron'
import type { ContentRepository } from '../repository/content-repository'
import type { Category, ContentResult, CourseDetail } from '@shared/domain'

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

// The only place that knows about IPC channel names and wraps repository
// results in the ContentResult envelope the renderer expects.
export function registerContentIpc(repository: ContentRepository): void {
  ipcMain.handle('content:listCategories', async (): Promise<ContentResult<Category[]>> => {
    try {
      return { ok: true, data: await repository.listCategories() }
    } catch (error) {
      return { ok: false, error: toErrorMessage(error) }
    }
  })

  ipcMain.handle(
    'content:getCourse',
    async (_event, courseId: string): Promise<ContentResult<CourseDetail>> => {
      try {
        const course = await repository.getCourse(courseId)
        if (!course) {
          return { ok: false, error: `Course not found: ${courseId}` }
        }
        return { ok: true, data: course }
      } catch (error) {
        return { ok: false, error: toErrorMessage(error) }
      }
    }
  )
}
