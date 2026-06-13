import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { TweetForm } from '../components/tweet/TweetForm'
import { TweetList } from '../components/tweet/TweetList'
import type { Tweet } from '../types'

export function Home() {
  const { user } = useAuthStore()
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFeed = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = followingData?.map((f) => f.following_id) ?? []
      const feedUserIds = [user.id, ...followingIds]

      const { data, error } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .in('user_id', feedUserIds)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const tweetIds = data?.map((t) => t.id) ?? []
      const { data: likesData } = await supabase
        .from('likes')
        .select('tweet_id')
        .eq('user_id', user.id)
        .in('tweet_id', tweetIds)

      const likedSet = new Set(likesData?.map((l) => l.tweet_id) ?? [])
      const tweetsWithLike = (data ?? []).map((t) => ({
        ...t,
        is_liked: likedSet.has(t.id),
      })) as unknown as Tweet[]

      setTweets(tweetsWithLike)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  const handleNewTweet = (tweet: Tweet) => {
    setTweets((prev) => [tweet, ...prev])
  }

  const handleDelete = (id: string) => {
    setTweets((prev) => prev.filter((t) => t.id !== id))
  }

  const handleLikeToggle = (id: string, liked: boolean) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_liked: liked, likes_count: t.likes_count + (liked ? 1 : -1) } : t
      )
    )
  }

  return (
    <MainLayout>
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">홈</h1>
      </div>
      <TweetForm onSuccess={handleNewTweet} />
      <TweetList
        tweets={tweets}
        onDelete={handleDelete}
        onLikeToggle={handleLikeToggle}
        isLoading={isLoading}
        emptyMessage="팔로우한 사람의 트윗이 없습니다. 먼저 누군가를 팔로우해보세요!"
      />
    </MainLayout>
  )
}
