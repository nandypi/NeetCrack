/// <reference types="vite/client" />

import type { Api } from '../../preload'

declare global {
  interface Window {
    // Only defined when running inside the real Electron renderer (the
    // preload script exposes it via contextBridge). Undefined if this page
    // is opened directly in a plain browser tab against the Vite dev
    // server — handle that case, don't assume it's always present.
    api?: Api
  }
}
