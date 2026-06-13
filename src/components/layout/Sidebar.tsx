import { NavLink, useNavigate } from 'react-router-dom'
import { Home, User, LogOut, Bell, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/search', icon: Search, label: '탐색' },
  { to: '/notifications', icon: Bell, label: '알림' },
]

export function Sidebar() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('로그아웃 되었습니다')
    navigate('/login')
  }

  return (
    <aside className="flex flex-col h-screen sticky top-0 py-4 px-3">
      <div className="mb-4 px-3">
        <span className="text-sky-500 text-2xl font-bold">✦ Nexus</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-xl font-medium
              ${isActive
                ? 'text-gray-900 dark:text-white font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <Icon size={24} />
            <span className="hidden xl:block">{label}</span>
          </NavLink>
        ))}

        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            className={({ isActive }) =>
              `flex items-center gap-4 px-3 py-3 rounded-full transition-colors text-xl font-medium
              ${isActive
                ? 'text-gray-900 dark:text-white font-bold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <User size={24} />
            <span className="hidden xl:block">프로필</span>
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group">
            <Avatar src={user.avatar_url} alt={user.display_name} size="md" />
            <div className="hidden xl:block flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.display_name}</p>
              <p className="text-sm text-gray-500 truncate">@{user.username}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden xl:flex"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
