import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { TweetForm } from '../components/tweet/TweetForm'
import { TweetList } from '../components/tweet/TweetList'
import type { Tweet } from '../types'

const PAGE_SIZE = 20

export function Home() {
  const { user } = useAuthStore()
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [newBuffer, setNewBuffer] = useState<Tweet[]>([])

  const followingIdsRef = useRef<string[]>([])
  const cursorRef = useRef<string | null>(null)

  const fetchFeed = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setNewBuffer([])
    cursorRef.current = null
    try {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const ids = followingData?.map((f) => f.following_id) ?? []
      followingIdsRef.current = ids
      const feedUserIds = [user.id, ...ids]

      const { data, error } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .in('user_id', feedUserIds)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (error) throw error

      const tweetIds = data?.map((t) => t.id) ?? []
      const { data: likesData } = await supabase
        .from('likes')
        .select('tweet_id')
        .eq('user_id', user.id)
        .in('tweet_id', tweetIds)

      const likedSet = new Set(likesData?.map((l) => l.tweet_id) ?? [])
      const result = (data ?? []).map((t) => ({ ...t, is_liked: likedSet.has(t.id) })) as unknown as Tweet[]

      setTweets(result)
      setHasMore(result.length === PAGE_SIZE)
      cursorRef.current = result[result.length - 1]?.created_at ?? null
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadMore = useCallback(async () => {
    if (!user || isLoadingMore || !hasMore || !cursorRef.current) return
    setIsLoadingMore(true)
    try {
      const feedUserIds = [user.id, ...followingIdsRef.current]
      const { data, error } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .in('user_id', feedUserIds)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
        .lt('created_at', cursorRef.current)

      if (error) throw error

      const tweetIds = data?.map((t) => t.id) ?? []
      const { data: likesData } = await supabase
        .from('likes')
        .select('tweet_id')
        .eq('user_id', user.id)
        .in('tweet_id', tweetIds)

      const likedSet = new Set(likesData?.map((l) => l.tweet_id) ?? [])
      const result = (data ?? []).map((t) => ({ ...t, is_liked: likedSet.has(t.id) })) as unknown as Tweet[]

      setTweets((prev) => [...prev, ...result])
      setHasMore(result.length === PAGE_SIZE)
      if (result.length > 0) cursorRef.current = result[result.length - 1].created_at
    } finally {
      setIsLoadingMore(false)
    }
  }, [user, isLoadingMore, hasMore])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  // 실시간 구독
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`home-feed-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tweets' },
        async (payload) => {
          const row = payload.new as { id: string; user_id: string; parent_id: string | null }
          if (row.parent_id !== null) return
          if (row.user_id === user.id) return
          if (!followingIdsRef.current.includes(row.user_id)) return

          const { data } = await supabase
            .from('tweets')
            .select('*, profile:profiles(*)')
            .eq('id', row.id)
            .single()

          if (data) {
            setNewBuffer((prev) => [{ ...data, is_liked: false } as unknown as Tweet, ...prev])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleNewTweet = (tweet: Tweet) => {
    setTweets((prev) => [tweet, ...prev])
  }

  const handleDelete = (id: string) => {
    setTweets((prev) => prev.filter((t) => t.id !== id))
  }

  const handleEdit = (id: string, content: string) => {
    setTweets((prev) => prev.map((t) => t.id === id ? { ...t, content } : t))
  }

  const handleLikeToggle = (id: string, liked: boolean) => {
    setTweets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_liked: liked, likes_count: t.likes_count + (liked ? 1 : -1) } : t
      )
    )
  }

  const handleShowNew = () => {
    setTweets((prev) => [...newBuffer, ...prev])
    setNewBuffer([])
  }

  return (
    <MainLayout>
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">홈</h1>
      </div>

      <TweetForm onSuccess={handleNewTweet} />

      {newBuffer.length > 0 && (
        <button
          onClick={handleShowNew}
          className="w-full py-3 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/10 text-sm font-medium border-b border-gray-200 dark:border-gray-800 transition-colors"
        >
          {newBuffer.length}개의 새 트윗 보기 ↑
        </button>
      )}

      <TweetList
        tweets={tweets}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onLikeToggle={handleLikeToggle}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        emptyMessage="팔로우한 사람의 트윗이 없습니다. 먼저 누군가를 팔로우해보세요!"
      />
    </MainLayout>
  )
}
