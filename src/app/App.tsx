import { RouterProvider } from 'react-router-dom'
import { router } from './Router'
import { ErrorBoundary } from '@shared/components/common/ErrorBoundary'
import '../styles/globals.css'

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
