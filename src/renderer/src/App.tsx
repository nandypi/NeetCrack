import { Link, Outlet } from 'react-router'

// App shell — header + content outlet. Kept as the persistent layout even
// though the header is minimal today; profile switching, search, and
// settings all land here later without restructuring routing.
function App(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          NeetCrack
        </Link>
        <div>Profile: Nandy</div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default App
