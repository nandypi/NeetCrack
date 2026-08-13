import { app } from 'electron'
import { access, readdir } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

export function getDataDir(): string {
  return join(app.getAppPath(), 'DATA')
}

export function getUserDataDir(): string {
  return join(app.getAppPath(), 'user-data')
}

// Joins a relative path (e.g. a manifest's jsonPath from Categories.json)
// onto DATA/ and guards against it resolving outside DATA/, since this
// value crosses the IPC boundary from the renderer even though today's
// only caller is trusted first-party data.
export function resolveDataPath(relativePath: string): string {
  const dataDir = getDataDir()
  const target = resolve(dataDir, relativePath)
  if (target !== dataDir && !target.startsWith(dataDir + sep)) {
    throw new Error(`Refusing to read path outside DATA/: ${relativePath}`)
  }
  return target
}

// Windows can't have "/" (or several other characters) in a folder name, so
// a handful of section/lesson folders on disk were hand-renamed away from
// their manifest name (e.g. section "Heap / Priority Queue" -> folder
// "Heap - Priority Queue"; lesson "What are Objects?" -> folder
// "What are Objects -"). The exact replacement isn't consistent enough to
// hardcode (spacing differs, "/" and "?" aren't replaced the same way) —
// instead both sides are normalized by stripping filesystem-unsafe
// characters (and "-", since that's the character renames landed on) down
// to bare words, so "Heap / Priority Queue" and "Heap - Priority Queue"
// compare equal regardless of which exact substitution was used.
function normalizeForFsCompare(name: string): string {
  return name
    .replace(/[/\\:*?"<>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Resolves one path segment against what's actually on disk: the manifest
// name first (fast path, no directory listing — true for the overwhelming
// majority of section/lesson folders), falling back to a normalized-name
// scan of the parent directory for the handful that were renamed.
async function resolveChildDir(parentDir: string, targetName: string): Promise<string> {
  const literal = join(parentDir, targetName)
  try {
    await access(literal)
    return literal
  } catch {
    // fall through to the fuzzy match below
  }

  const entries = await readdir(parentDir, { withFileTypes: true })
  const normalizedTarget = normalizeForFsCompare(targetName)
  const match = entries.find(
    (entry) => entry.isDirectory() && normalizeForFsCompare(entry.name) === normalizedTarget
  )
  if (!match) {
    throw new Error(`No folder matching "${targetName}" found under ${parentDir}`)
  }
  return join(parentDir, match.name)
}

// A lesson's own folder sits alongside its course manifest, one level under
// the section: <Category>/<Course>/<Section>/<Lesson>/. Section and lesson
// resolve independently (both can carry a renamed folder) — see
// resolveChildDir. courseDir goes through resolveDataPath, so the guard
// above still applies to the trusted starting point even though
// sectionName/lessonName themselves cross the IPC boundary as route params.
export async function resolveLessonDir(
  courseJsonPath: string,
  sectionName: string,
  lessonName: string
): Promise<string> {
  const courseDir = resolveDataPath(dirname(courseJsonPath))
  const sectionDir = await resolveChildDir(courseDir, sectionName)
  return resolveChildDir(sectionDir, lessonName)
}

// The .mkv itself is named after the lesson (data-model.md §8), so it was
// renamed right along with its folder wherever the lesson name had an
// invalid character (e.g. "0 / 1 Knapsack.mkv" -> "0 - 1 Knapsack.mkv") —
// same issue resolveChildDir handles for folders. A lesson folder only
// ever has one .mkv (one lesson video each), so rather than reconstruct the
// exact rename, this just takes whichever single .mkv is present.
export async function resolveVideoFile(
  lessonDir: string,
  lessonName: string
): Promise<string | null> {
  const literal = join(lessonDir, `${lessonName}.mkv`)
  try {
    await access(literal)
    return literal
  } catch {
    // fall through to the directory scan below
  }

  const entries = await readdir(lessonDir, { withFileTypes: true })
  const match = entries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.mkv'))
  return match ? join(lessonDir, match.name) : null
}
