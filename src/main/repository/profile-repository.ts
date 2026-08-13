import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'
import { getUserDataDir } from '../data/paths'
import type { ProfileProgress, ProfileSession } from '@shared/domain'

const ProfileIndexSchema = z.object({
  lastProfile: z.string().nullable(),
  profiles: z.array(z.object({ id: z.string().regex(/^[a-f0-9]{8}$/), name: z.string() }))
})

const ProgressSchema = z.object({
  completed: z.record(z.string(), z.literal(true)).default({}),
  suggestedProblemsDone: z.record(z.string(), z.array(z.string())).default({}),
  videoPositions: z.record(z.string(), z.number()).default({})
})

type ProfileIndex = z.infer<typeof ProfileIndexSchema>

const EMPTY_PROGRESS: ProfileProgress = {
  completed: {},
  suggestedProblemsDone: {},
  videoPositions: {}
}

async function readJson(path: string): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export class ProfileRepository {
  private mutationQueue: Promise<void> = Promise.resolve()

  private get root(): string {
    return getUserDataDir()
  }

  private get indexPath(): string {
    return join(this.root, 'profiles.json')
  }

  private progressPath(profileId: string): string {
    return join(this.root, 'profiles', profileId, 'progress.json')
  }

  private async readIndex(): Promise<ProfileIndex> {
    const raw = await readJson(this.indexPath)
    if (!raw) return { lastProfile: null, profiles: [] }
    return ProfileIndexSchema.parse(raw)
  }

  private async writeIndex(index: ProfileIndex): Promise<void> {
    await mkdir(this.root, { recursive: true })
    await writeFile(this.indexPath, JSON.stringify(index, null, 2), 'utf8')
  }

  private async readProgress(profileId: string): Promise<ProfileProgress> {
    const raw = await readJson(this.progressPath(profileId))
    return raw ? ProgressSchema.parse(raw) : structuredClone(EMPTY_PROGRESS)
  }

  private async writeProgress(profileId: string, progress: ProfileProgress): Promise<void> {
    const directory = join(this.root, 'profiles', profileId)
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'progress.json'), JSON.stringify(progress, null, 2), 'utf8')
  }

  private async session(existingIndex?: ProfileIndex): Promise<ProfileSession> {
    const index = existingIndex ?? (await this.readIndex())
    const activeProfileId = index.profiles.some((profile) => profile.id === index.lastProfile)
      ? index.lastProfile
      : (index.profiles[0]?.id ?? null)
    if (activeProfileId !== index.lastProfile) {
      index.lastProfile = activeProfileId
      await this.writeIndex(index)
    }
    return {
      profiles: index.profiles,
      activeProfileId,
      progress: activeProfileId
        ? await this.readProgress(activeProfileId)
        : structuredClone(EMPTY_PROGRESS)
    }
  }

  private mutate<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.mutationQueue.then(operation)
    this.mutationQueue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  async getSession(): Promise<ProfileSession> {
    await this.mutationQueue
    return this.session()
  }

  createProfile(name: string): Promise<ProfileSession> {
    return this.mutate(async () => {
      const normalizedName = name.trim()
      if (!normalizedName) throw new Error('Profile name cannot be empty.')
      if (normalizedName.length > 50) throw new Error('Profile name must be 50 characters or less.')

      const index = await this.readIndex()
      if (
        index.profiles.some(
          (profile) => profile.name.toLowerCase() === normalizedName.toLowerCase()
        )
      ) {
        throw new Error('A profile with that name already exists.')
      }

      let id: string
      do id = randomBytes(4).toString('hex')
      while (index.profiles.some((profile) => profile.id === id))

      index.profiles.push({ id, name: normalizedName })
      index.lastProfile = id
      await this.writeProgress(id, structuredClone(EMPTY_PROGRESS))
      await this.writeIndex(index)
      return this.session(index)
    })
  }

  selectProfile(profileId: string): Promise<ProfileSession> {
    return this.mutate(async () => {
      const index = await this.readIndex()
      if (!index.profiles.some((profile) => profile.id === profileId)) {
        throw new Error('Profile not found.')
      }
      index.lastProfile = profileId
      await this.writeIndex(index)
      return this.session(index)
    })
  }

  deleteProfile(profileId: string): Promise<ProfileSession> {
    return this.mutate(async () => {
      const index = await this.readIndex()
      if (!index.profiles.some((profile) => profile.id === profileId)) {
        throw new Error('Profile not found.')
      }
      index.profiles = index.profiles.filter((profile) => profile.id !== profileId)
      if (index.lastProfile === profileId) index.lastProfile = index.profiles[0]?.id ?? null
      await rm(join(this.root, 'profiles', profileId), { recursive: true, force: true })
      await this.writeIndex(index)
      return this.session(index)
    })
  }

  setLessonCompleted(
    profileId: string,
    lessonKey: string,
    completed: boolean
  ): Promise<ProfileProgress> {
    return this.updateProgress(profileId, (progress) => {
      if (completed) progress.completed[lessonKey] = true
      else delete progress.completed[lessonKey]
    })
  }

  setSuggestedProblemDone(
    profileId: string,
    lessonKey: string,
    slug: string,
    done: boolean
  ): Promise<ProfileProgress> {
    return this.updateProgress(profileId, (progress) => {
      const slugs = new Set(progress.suggestedProblemsDone[lessonKey] ?? [])
      if (done) slugs.add(slug)
      else slugs.delete(slug)
      if (slugs.size) progress.suggestedProblemsDone[lessonKey] = [...slugs]
      else delete progress.suggestedProblemsDone[lessonKey]
    })
  }

  private updateProgress(
    profileId: string,
    update: (progress: ProfileProgress) => void
  ): Promise<ProfileProgress> {
    return this.mutate(async () => {
      const index = await this.readIndex()
      if (!index.profiles.some((profile) => profile.id === profileId)) {
        throw new Error('Profile not found.')
      }
      const progress = await this.readProgress(profileId)
      update(progress)
      await this.writeProgress(profileId, progress)
      return progress
    })
  }
}
