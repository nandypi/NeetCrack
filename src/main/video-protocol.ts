import { protocol } from 'electron'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'

// A plain <video src="file://..."> gets blocked by Chromium with "Not
// allowed to load local resource" whenever the renderer's own origin isn't
// file:// — which is exactly the case in dev (electron-vite serves the
// renderer from http://localhost:<port> for HMR). It only works in the
// packaged build, where the renderer itself loads from file://, so is
// same-origin with the video. This custom scheme sidesteps that: handling
// it in the main process isn't subject to the renderer's local-resource
// restriction, so serving the file through a handler here works
// identically in dev and packaged builds, without disabling webSecurity.
export const VIDEO_PROTOCOL = 'neetcrack-video'

// Must run before app is ready, so this needs to execute at module load —
// src/main/index.ts imports this module before calling app.whenReady().
protocol.registerSchemesAsPrivileged([
  {
    scheme: VIDEO_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

// The whole absolute path is packed into one opaque, fully percent-encoded
// path segment (host "local" is a fixed placeholder, never inspected) —
// not left as raw URL syntax. A Windows path's drive letter right after
// "///" (e.g. neetcrack-video:///C:/Users/...) turns out to confuse
// Chromium's URL parser for custom "standard" schemes: it folds "C:" into
// the host component ("c", colon dropped) instead of treating it as an
// empty host + path, unlike Node's URL parser, which parses that same
// string correctly — confirmed by comparing the two directly. Encoding the
// path as one segment sidesteps that mismatch entirely: there's no slash
// or colon left in the URL for either parser to disagree about.
export function toVideoUrl(absolutePath: string): string {
  return `${VIDEO_PROTOCOL}://local/${encodeURIComponent(absolutePath)}`
}

function toAbsolutePath(requestUrl: string): string {
  const prefix = `${VIDEO_PROTOCOL}://local/`
  return decodeURIComponent(requestUrl.slice(prefix.length))
}

// Range requests (what the scrub bar's seeking relies on) have to be
// handled by hand: net.fetch() on a file:// URL turns out to silently
// ignore an incoming Range header and always returns the whole file as a
// plain 200 with no Accept-Ranges/Content-Range — confirmed directly by
// logging its response headers — so Chromium never learns this resource is
// seekable. Reading the requested byte range via fs.createReadStream and
// returning a real 206 response (with Accept-Ranges on the 200 case too)
// is what actually makes seeking work.
export function registerVideoProtocol(): void {
  protocol.handle(VIDEO_PROTOCOL, async (request) => {
    const absolutePath = toAbsolutePath(request.url)
    const stats = await stat(absolutePath)
    const range = request.headers.get('range')

    if (!range) {
      return new Response(Readable.toWeb(createReadStream(absolutePath)) as ReadableStream, {
        status: 200,
        headers: {
          'content-type': 'video/x-matroska',
          'content-length': String(stats.size),
          'accept-ranges': 'bytes'
        }
      })
    }

    const match = /bytes=(\d*)-(\d*)/.exec(range)
    const start = match?.[1] ? Number(match[1]) : 0
    const end = match?.[2] ? Number(match[2]) : stats.size - 1

    return new Response(
      Readable.toWeb(createReadStream(absolutePath, { start, end })) as ReadableStream,
      {
        status: 206,
        headers: {
          'content-type': 'video/x-matroska',
          'content-length': String(end - start + 1),
          'content-range': `bytes ${start}-${end}/${stats.size}`,
          'accept-ranges': 'bytes'
        }
      }
    )
  })
}
