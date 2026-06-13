import { useState } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { TweetList } from '../components/tweet/TweetList'
import { Avatar } from '../components/ui/Avatar'
import { Link } from 'react-router-dom'
import type { Tweet, Profile } from '../types'

export function Search() {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsLoading(true)
    setSearched(true)
    try {
      const [tweetsResult, usersResult] = await Promise.all([
        supabase
          .from('tweets')
          .select('*, profile:profiles(*)')
          .ilike('content', `%${query}%`)
          .is('parent_id', null)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(10),
      ])

      let tweetsWithLike = (tweetsResult.data ?? []) as unknown as Tweet[]
      if (user && tweetsResult.data) {
        const tweetIds = tweetsResult.data.map((t) => t.id)
        const { data: likesData } = await supabase
          .from('likes').select('tweet_id').eq('user_id', user.id).in('tweet_id', tweetIds)
        const likedSet = new Set(likesData?.map((l) => l.tweet_id) ?? [])
        tweetsWithLike = tweetsResult.data.map((t) => ({ ...t, is_liked: likedSet.has(t.id) })) as unknown as Tweet[]
      }

      setTweets(tweetsWithLike)
      setUsers((usersResult.data ?? []) as Profile[])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 p-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </form>
      </div>

      {searched && !isLoading && (
        <>
          {users.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-800">
              <h2 className="px-4 py-3 font-bold text-gray-900 dark:text-white">사용자</h2>
              {users.map((u) => (
                <Link
                  key={u.id}
                  to={`/profile/${u.username}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <Avatar src={u.avatar_url} alt={u.display_name} size="md" />
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{u.display_name}</p>
                    <p className="text-sm text-gray-500">@{u.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div>
            {tweets.length > 0 && (
              <h2 className="px-4 py-3 font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800">트윗</h2>
            )}
            <TweetList
              tweets={tweets}
              isLoading={isLoading}
              emptyMessage={`"${query}"에 대한 트윗이 없습니다`}
            />
          </div>
        </>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <SearchIcon size={48} className="mb-4 opacity-30" />
          <p>검색어를 입력하고 Enter를 누르세요</p>
        </div>
      )}
    </MainLayout>
  )
}
