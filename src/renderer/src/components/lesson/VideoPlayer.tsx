import { useCallback, useEffect, useRef, useState } from 'react'
import { Maximize, Minimize, Pause, Play } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const SEEK_STEP_SECONDS = 10

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

// Custom controls per docs/decisions.md — a plain <video src="...">
// with our own play/pause, scrub bar, speed picker, and fullscreen toggle
// instead of the browser's native bar. currentTime/playbackRate only;
// nothing here reads or writes progress.json — resume-from-position is a
// future milestone bundled with progress persistence. Failure is detected
// via the `error` event on an actual load attempt, not video.canPlayType(),
// which undersells support for this container (see decisions.md#video--code).
function VideoPlayer({
  src,
  className
}: {
  src: string | null
  className?: string
}): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [failed, setFailed] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video) video.playbackRate = speed
  }, [speed])

  useEffect(() => {
    function onFullscreenChange(): void {
      setFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const togglePlay = useCallback((): void => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }, [])

  const seek = useCallback((time: number): void => {
    const video = videoRef.current
    if (!video) return
    const clamped = Math.min(Math.max(time, 0), video.duration || time)
    video.currentTime = clamped
    setCurrentTime(clamped)
  }, [])

  const seekBy = useCallback(
    (deltaSeconds: number): void => {
      const video = videoRef.current
      if (!video) return
      seek(video.currentTime + deltaSeconds)
    },
    [seek]
  )

  function toggleFullscreen(): void {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void containerRef.current?.requestFullscreen()
    }
  }

  // Active for as long as the player is mounted, not just while it has
  // focus — matches how every other video site's shortcuts behave. Ignored
  // while typing in an input/textarea elsewhere on the page.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isTypingTarget(event.target)) return
      if (event.code === 'Space') {
        event.preventDefault()
        togglePlay()
      } else if (event.code === 'ArrowRight') {
        event.preventDefault()
        seekBy(SEEK_STEP_SECONDS)
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault()
        seekBy(-SEEK_STEP_SECONDS)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay, seekBy])

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex aspect-video w-full items-center justify-center rounded-lg bg-neutral-900 text-sm text-neutral-500',
          className
        )}
      >
        Video unavailable
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden rounded-lg bg-black',
        fullscreen && 'flex h-full flex-col justify-center',
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        className={cn(
          'w-full cursor-pointer',
          fullscreen ? 'min-h-0 flex-1 object-contain' : 'aspect-video'
        )}
        onClick={togglePlay}
        onError={() => setFailed(true)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3 bg-neutral-950 px-3 py-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          className="text-neutral-200 hover:text-white"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-1.5 flex-1 accent-blue-500"
        />
        <span className="w-24 shrink-0 text-right text-xs tabular-nums text-neutral-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="shrink-0 rounded border border-neutral-800 bg-neutral-900 px-1.5 py-1 text-xs text-neutral-300"
          aria-label="Playback speed"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="shrink-0 text-neutral-200 hover:text-white"
        >
          {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </button>
      </div>
    </div>
  )
}

export default VideoPlayer
