import { Outlet } from 'react-router-dom'
import { Monitor } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { isElectron } from '@shared/lib/platform'

function BrowserModeBanner() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-400">
      <Monitor className="h-3.5 w-3.5 shrink-0" />
      <span>
        Browser preview mode — data is read-only and empty.
        Run <code className="font-mono bg-amber-500/10 px-1 py-0.5 rounded">npm run dev</code> from the project root to launch the full desktop app.
      </span>
    </div>
  )
}

export function Shell(): React.ReactElement {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isElectron && <BrowserModeBanner />}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
