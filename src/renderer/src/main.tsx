import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router'
import App from './App'
import RouteError from '@renderer/components/RouteError'
import './index.css'

// Hash routing, not createBrowserRouter: the renderer is loaded from a
// file:// URL in the packaged app, where pushState-based history doesn't
// resolve paths the way it does over http(s). See docs/tech-stack.md.
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />
  }
])

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
