import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
  rightPanel?: ReactNode
}

export function MainLayout({ children, rightPanel }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto flex">
        <div className="w-16 xl:w-64 flex-shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 min-w-0 border-x border-gray-200 dark:border-gray-800">
          {children}
        </main>

        {rightPanel && (
          <div className="hidden lg:block w-80 flex-shrink-0 pl-6 py-4">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  )
}
