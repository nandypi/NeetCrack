import { cn } from '@renderer/lib/utils'

// Placeholder root screen. Proves the scaffold launches end to end
// (main -> preload -> renderer, Tailwind, React Router) — no application
// features live here yet; see docs/ for what's planned.
function App(): React.JSX.Element {
  const versions = window.api?.versions

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 text-neutral-100'
      )}
    >
      <h1 className="text-2xl font-semibold">NeetCrack</h1>
      <p className="text-sm text-neutral-400">Scaffold running — no application features yet.</p>
      {versions ? (
        <p className="text-xs text-neutral-500">
          Electron {versions.electron} · Chrome {versions.chrome} · Node {versions.node}
        </p>
      ) : (
        <p className="text-xs text-amber-500">
          window.api is unavailable — this page isn't running inside the Electron renderer (e.g.
          opened directly in a browser instead of the Electron window that npm run dev launches).
        </p>
      )}
    </div>
  )
}

export default App
