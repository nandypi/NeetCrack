import { create } from 'zustand'
import type { ProfileProgress, ProfileSession } from '@shared/domain'

const EMPTY_PROGRESS: ProfileProgress = {
  completed: {},
  suggestedProblemsDone: {},
  videoPositions: {}
}

function requireApi(): NonNullable<Window['api']> {
  if (!window.api) throw new Error('Profiles are only available inside the Electron app.')
  return window.api
}

function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: string }): T {
  if (!result.ok) throw new Error(result.error)
  return result.data
}

interface ProfileStore extends ProfileSession {
  initialized: boolean
  initializing: boolean
  busy: boolean
  error: string | null
  initialize: () => Promise<void>
  createProfile: (name: string) => Promise<boolean>
  selectProfile: (profileId: string) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>
  setLessonCompleted: (lessonKey: string, completed: boolean) => Promise<void>
  setSuggestedProblemDone: (lessonKey: string, slug: string, done: boolean) => Promise<void>
  clearError: () => void
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  progress: EMPTY_PROGRESS,
  initialized: false,
  initializing: false,
  busy: false,
  error: null,

  initialize: async () => {
    if (get().initialized || get().initializing) return
    set({ initializing: true, error: null })
    try {
      const session = unwrap(await requireApi().profiles.getSession())
      set({ ...session, initialized: true, initializing: false })
    } catch (error) {
      set({
        initialized: true,
        initializing: false,
        error: error instanceof Error ? error.message : String(error)
      })
    }
  },

  createProfile: async (name) => {
    set({ busy: true, error: null })
    try {
      const session = unwrap(await requireApi().profiles.create(name))
      set({ ...session, busy: false })
      return true
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : String(error) })
      return false
    }
  },

  selectProfile: async (profileId) => {
    if (profileId === get().activeProfileId) return
    set({ busy: true, error: null })
    try {
      const session = unwrap(await requireApi().profiles.select(profileId))
      set({ ...session, busy: false })
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : String(error) })
    }
  },

  deleteProfile: async (profileId) => {
    set({ busy: true, error: null })
    try {
      const session = unwrap(await requireApi().profiles.delete(profileId))
      set({ ...session, busy: false })
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : String(error) })
    }
  },

  setLessonCompleted: async (lessonKey, completed) => {
    const profileId = get().activeProfileId
    if (!profileId) return
    const previous = get().progress
    const optimistic: ProfileProgress = { ...previous, completed: { ...previous.completed } }
    if (completed) optimistic.completed[lessonKey] = true
    else delete optimistic.completed[lessonKey]
    set({ progress: optimistic, error: null })
    try {
      const progress = unwrap(
        await requireApi().progress.setLessonCompleted(profileId, lessonKey, completed)
      )
      if (get().activeProfileId === profileId) set({ progress })
    } catch (error) {
      if (get().activeProfileId === profileId) {
        set({ progress: previous, error: error instanceof Error ? error.message : String(error) })
      }
    }
  },

  setSuggestedProblemDone: async (lessonKey, slug, done) => {
    const profileId = get().activeProfileId
    if (!profileId) return
    const previous = get().progress
    const current = new Set(previous.suggestedProblemsDone[lessonKey] ?? [])
    if (done) current.add(slug)
    else current.delete(slug)
    const suggestedProblemsDone = { ...previous.suggestedProblemsDone }
    if (current.size) suggestedProblemsDone[lessonKey] = [...current]
    else delete suggestedProblemsDone[lessonKey]
    set({ progress: { ...previous, suggestedProblemsDone }, error: null })
    try {
      const progress = unwrap(
        await requireApi().progress.setSuggestedProblemDone(profileId, lessonKey, slug, done)
      )
      if (get().activeProfileId === profileId) set({ progress })
    } catch (error) {
      if (get().activeProfileId === profileId) {
        set({ progress: previous, error: error instanceof Error ? error.message : String(error) })
      }
    }
  },

  clearError: () => set({ error: null })
}))
