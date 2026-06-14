import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Trash2, Pencil, X, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Tweet } from '../../types'
import { Avatar } from '../ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface TweetCardProps {
  tweet: Tweet
  onDelete?: (id: string) => void
  onEdit?: (id: string, content: string) => void
  onLikeToggle?: (id: string, liked: boolean) => void
  isDetail?: boolean
}

export function TweetCard({ tweet, onDelete, onEdit, onLikeToggle, isDetail = false }: TweetCardProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState(tweet.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(tweet.likes_count)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(tweet.content)
  const [displayContent, setDisplayContent] = useState(tweet.content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const isOwn = user?.id === tweet.user_id

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { toast.error('로그인이 필요합니다'); return }
    if (isLikeLoading) return

    setIsLikeLoading(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setLikesCount((prev) => prev + (newLiked ? 1 : -1))

    try {
      if (newLiked) {
        const { error } = await supabase.from('likes').insert({ user_id: user.id, tweet_id: tweet.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('likes').delete().match({ user_id: user.id, tweet_id: tweet.id })
        if (error) throw error
      }
      onLikeToggle?.(tweet.id, newLiked)
    } catch {
      setIsLiked(!newLiked)
      setLikesCount((prev) => prev + (newLiked ? -1 : 1))
      toast.error('오류가 발생했습니다')
    } finally {
      setIsLikeLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('이 트윗을 삭제할까요?')) return
    try {
      const { error } = await supabase.from('tweets').delete().eq('id', tweet.id)
      if (error) throw error
      onDelete?.(tweet.id)
      toast.success('트윗이 삭제되었습니다')
    } catch {
      toast.error('삭제에 실패했습니다')
    }
  }

  const handleEditSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const trimmed = editContent.trim()
    if (!trimmed) { toast.error('내용을 입력해주세요'); return }
    if (trimmed === displayContent) { setIsEditing(false); return }
    if (trimmed.length > 280) { toast.error('280자를 초과할 수 없습니다'); return }

    setIsSavingEdit(true)
    try {
      const { error } = await supabase.from('tweets').update({ content: trimmed }).eq('id', tweet.id)
      if (error) throw error
      setDisplayContent(trimmed)
      setEditContent(trimmed)
      onEdit?.(tweet.id, trimmed)
      setIsEditing(false)
      toast.success('수정되었습니다')
    } catch {
      toast.error('수정에 실패했습니다')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditContent(displayContent)
    setIsEditing(false)
  }

  const timeAgo = formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true, locale: ko })

  const cardContent = (
    <div className={`flex gap-3 p-4 ${!isDetail ? 'hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer' : ''} transition-colors`}>
      <Link to={`/profile/${tweet.profile.username}`} onClick={(e) => e.stopPropagation()}>
        <Avatar src={tweet.profile.avatar_url} alt={tweet.profile.display_name} size="md" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            to={`/profile/${tweet.profile.username}`}
            className="font-bold text-gray-900 dark:text-white hover:underline text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {tweet.profile.display_name}
          </Link>
          <span className="text-gray-500 text-sm">@{tweet.profile.username}</span>
          <span className="text-gray-400 text-sm">·</span>
          <span className="text-gray-400 text-sm">{timeAgo}</span>

          {isOwn && !isEditing && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
                className="p-1 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-full transition-colors"
                title="수정"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="삭제"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}

          {isOwn && isEditing && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={handleEditSave}
                disabled={isSavingEdit}
                className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors disabled:opacity-50"
                title="저장"
              >
                <Check size={13} />
              </button>
              <button
                onClick={handleEditCancel}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                title="취소"
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            maxLength={280}
            autoFocus
            className="mt-1 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        ) : (
          <p className="text-gray-900 dark:text-white text-sm mt-1 whitespace-pre-wrap break-words">
            {displayContent}
          </p>
        )}

        {tweet.image_url && (
          <img
            src={tweet.image_url}
            alt="트윗 이미지"
            className="mt-3 rounded-2xl max-h-80 w-full object-cover border border-gray-200 dark:border-gray-700"
          />
        )}

        <div className="flex items-center gap-6 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/tweet/${tweet.id}`) }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 px-2 py-1 -ml-2 rounded-full transition-colors group"
          >
            <MessageCircle size={18} className="group-hover:text-sky-500" />
            <span className="text-xs">{tweet.comments_count}</span>
          </button>

          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-full transition-colors group ${
              isLiked
                ? 'text-rose-500'
                : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
            }`}
          >
            <Heart size={18} className={isLiked ? 'fill-current' : 'group-hover:text-rose-500'} />
            <span className="text-xs">{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (isDetail) return <div className="border-b border-gray-200 dark:border-gray-800">{cardContent}</div>

  return (
    <div
      className="border-b border-gray-200 dark:border-gray-800"
      onClick={() => !isEditing && navigate(`/tweet/${tweet.id}`)}
    >
      {cardContent}
    </div>
  )
}
