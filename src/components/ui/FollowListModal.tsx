import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Avatar } from './Avatar'

interface FollowUser {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

interface FollowListModalProps {
  profileId: string
  type: 'followers' | 'following'
  onClose: () => void
}

export function FollowListModal({ profileId, type, onClose }: FollowListModalProps) {
  const navigate = useNavigate()
  const [users, setUsers] = useState<FollowUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        if (type === 'followers') {
          const { data } = await supabase
            .from('follows')
            .select('follower:profiles!follower_id(id, username, display_name, avatar_url, bio)')
            .eq('following_id', profileId)
          setUsers((data ?? []).map((d) => d.follower as unknown as FollowUser))
        } else {
          const { data } = await supabase
            .from('follows')
            .select('following:profiles!following_id(id, username, display_name, avatar_url, bio)')
            .eq('follower_id', profileId)
          setUsers((data ?? []).map((d) => d.following as unknown as FollowUser))
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [profileId, type])

  const handleUserClick = (username: string) => {
    onClose()
    navigate(`/profile/${username}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {type === 'followers' ? '팔로워' : '팔로잉'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex justify-center items-center py-12 text-gray-400 text-sm">
              {type === 'followers' ? '팔로워가 없습니다' : '팔로잉이 없습니다'}
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleUserClick(u.username)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <Avatar src={u.avatar_url} alt={u.display_name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.display_name}</p>
                  <p className="text-gray-500 text-xs truncate">@{u.username}</p>
                  {u.bio && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-0.5 truncate">{u.bio}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
