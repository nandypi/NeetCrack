import { app } from 'electron'
import { join, resolve, sep } from 'node:path'

export function getDataDir(): string {
  return join(app.getAppPath(), 'DATA')
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
