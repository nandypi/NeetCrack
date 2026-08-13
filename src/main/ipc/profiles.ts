import { ipcMain } from 'electron'
import type { ProfileRepository } from '../repository/profile-repository'
import type { ContentResult, ProfileProgress, ProfileSession } from '@shared/domain'

function result<T>(operation: () => Promise<T>): Promise<ContentResult<T>> {
  return operation().then(
    (data) => ({ ok: true, data }),
    (error: unknown) => ({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
  )
}

export function registerProfileIpc(repository: ProfileRepository): void {
  ipcMain.handle('profiles:getSession', () => result(() => repository.getSession()))
  ipcMain.handle('profiles:create', (_event, name: string) =>
    result<ProfileSession>(() => repository.createProfile(name))
  )
  ipcMain.handle('profiles:select', (_event, profileId: string) =>
    result<ProfileSession>(() => repository.selectProfile(profileId))
  )
  ipcMain.handle('profiles:delete', (_event, profileId: string) =>
    result<ProfileSession>(() => repository.deleteProfile(profileId))
  )
  ipcMain.handle(
    'progress:setLessonCompleted',
    (_event, profileId: string, lessonKey: string, completed: boolean) =>
      result<ProfileProgress>(() => repository.setLessonCompleted(profileId, lessonKey, completed))
  )
  ipcMain.handle(
    'progress:setSuggestedProblemDone',
    (_event, profileId: string, lessonKey: string, slug: string, done: boolean) =>
      result<ProfileProgress>(() =>
        repository.setSuggestedProblemDone(profileId, lessonKey, slug, done)
      )
  )
}
