import { contextBridge } from 'electron'
import { versions } from 'node:process'

// Minimal proof that main -> preload -> renderer wiring works end to end.
// Real app APIs (DATA/ access, user-data/ read-write, etc.) are added when
// those features are implemented, not part of this scaffold.
const api = {
  versions: {
    chrome: versions.chrome,
    node: versions.node,
    electron: versions.electron
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
