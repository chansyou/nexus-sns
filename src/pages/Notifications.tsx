import { MainLayout } from '../components/layout/MainLayout'
import { Bell } from 'lucide-react'

export function Notifications() {
  return (
    <MainLayout>
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">알림</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Bell size={48} className="mb-4 opacity-30" />
        <p className="text-lg font-medium">아직 알림이 없습니다</p>
        <p className="text-sm mt-1">좋아요, 댓글, 팔로우 알림이 여기에 표시됩니다</p>
      </div>
    </MainLayout>
  )
}
