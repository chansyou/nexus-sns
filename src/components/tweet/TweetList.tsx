import { useEffect, useRef } from 'react'
import type { Tweet } from '../../types'
import { TweetCard } from './TweetCard'
import { TweetSkeleton } from './TweetSkeleton'

interface TweetListProps {
  tweets: Tweet[]
  onDelete?: (id: string) => void
  onEdit?: (id: string, content: string) => void
  onLikeToggle?: (id: string, liked: boolean) => void
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  emptyMessage?: string
}

export function TweetList({
  tweets,
  onDelete,
  onEdit,
  onLikeToggle,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  emptyMessage = '트윗이 없습니다',
}: TweetListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!onLoadMore || !hasMore || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) onLoadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, isLoadingMore])

  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => <TweetSkeleton key={i} />)}
      </div>
    )
  }

  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
      {tweets.map((tweet) => (
        <TweetCard
          key={tweet.id}
          tweet={tweet}
          onDelete={onDelete}
          onEdit={onEdit}
          onLikeToggle={onLikeToggle}
        />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="py-4 flex justify-center">
          {isLoadingMore && (
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}

      {!hasMore && tweets.length > 0 && (
        <p className="text-center py-6 text-sm text-gray-400">모든 트윗을 불러왔습니다</p>
      )}
    </div>
  )
}
