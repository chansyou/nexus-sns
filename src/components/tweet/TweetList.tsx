import type { Tweet } from '../../types'
import { TweetCard } from './TweetCard'

interface TweetListProps {
  tweets: Tweet[]
  onDelete?: (id: string) => void
  onLikeToggle?: (id: string, liked: boolean) => void
  isLoading?: boolean
  emptyMessage?: string
}

export function TweetList({ tweets, onDelete, onLikeToggle, isLoading, emptyMessage = '트윗이 없습니다' }: TweetListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
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
          onLikeToggle={onLikeToggle}
        />
      ))}
    </div>
  )
}
