import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { TweetCard } from '../components/tweet/TweetCard'
import { TweetForm } from '../components/tweet/TweetForm'
import { TweetList } from '../components/tweet/TweetList'
import type { Tweet } from '../types'

export function TweetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tweet, setTweet] = useState<Tweet | null>(null)
  const [comments, setComments] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTweet = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const { data: tweetData, error } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      const { data: commentsData } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .eq('parent_id', id)
        .order('created_at', { ascending: true })

      if (user) {
        const allIds = [id, ...(commentsData?.map((c) => c.id) ?? [])]
        const { data: likesData } = await supabase
          .from('likes')
          .select('tweet_id')
          .eq('user_id', user.id)
          .in('tweet_id', allIds)

        const likedSet = new Set(likesData?.map((l) => l.tweet_id) ?? [])
        setTweet({ ...tweetData, is_liked: likedSet.has(id) } as unknown as Tweet)
        setComments(
          (commentsData ?? []).map((c) => ({ ...c, is_liked: likedSet.has(c.id) })) as unknown as Tweet[]
        )
      } else {
        setTweet(tweetData as unknown as Tweet)
        setComments((commentsData ?? []) as unknown as Tweet[])
      }
    } finally {
      setIsLoading(false)
    }
  }, [id, user])

  useEffect(() => { fetchTweet() }, [fetchTweet])

  const handleNewComment = (comment: Tweet) => {
    setComments((prev) => [...prev, comment])
    if (tweet) setTweet({ ...tweet, comments_count: tweet.comments_count + 1 })
  }

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    if (tweet) setTweet({ ...tweet, comments_count: tweet.comments_count - 1 })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    )
  }

  if (!tweet) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p>트윗을 찾을 수 없습니다</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">트윗</h1>
      </div>

      <TweetCard tweet={tweet} isDetail />
      <TweetForm
        parentId={tweet.id}
        placeholder="답글 작성하기..."
        onSuccess={handleNewComment}
      />
      <TweetList
        tweets={comments}
        onDelete={handleDeleteComment}
        emptyMessage="아직 답글이 없습니다"
      />
    </MainLayout>
  )
}
