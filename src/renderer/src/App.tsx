import { useEffect } from 'react'
import { Link, Outlet } from 'react-router'
import ProfileSelector, { EmptyProfiles } from '@renderer/components/ProfileSelector'
import { useProfileStore } from '@renderer/lib/profile-store'

function App(): React.JSX.Element {
  const initialize = useProfileStore((state) => state.initialize)
  const initialized = useProfileStore((state) => state.initialized)
  const profiles = useProfileStore((state) => state.profiles)

  useEffect(() => {
    void initialize()
  }, [initialize])

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-6 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          NeetCrack
        </Link>
        {initialized ? (
          <ProfileSelector />
        ) : (
          <div className="text-sm text-neutral-500">Loading...</div>
        )}
      </header>
      <main className="flex flex-1 flex-col">
        {!initialized ? null : profiles.length === 0 ? <EmptyProfiles /> : <Outlet />}
      </main>
    </div>
  )
}

export default App
