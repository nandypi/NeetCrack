import { useRouteError } from 'react-router'

function RouteError(): React.JSX.Element {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : String(error)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-neutral-950 p-8 text-neutral-100">
      <h1 className="text-xl font-semibold text-red-400">Something went wrong</h1>
      <p className="max-w-md text-center text-sm text-neutral-400">{message}</p>
    </div>
  )
}

export default RouteError
