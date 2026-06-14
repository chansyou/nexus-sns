import { NavLink } from 'react-router-dom'
import { Home, Search, Bell, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function BottomNav() {
  const { user } = useAuthStore()

  const items = [
    { to: '/', icon: Home, label: '홈', end: true },
    { to: '/search', icon: Search, label: '탐색', end: false },
    { to: '/notifications', icon: Bell, label: '알림', end: false },
    ...(user ? [{ to: `/profile/${user.username}`, icon: User, label: '프로필', end: false }] : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 safe-area-pb">
      <div className="flex">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-sky-500' : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
