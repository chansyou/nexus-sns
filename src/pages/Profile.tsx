import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { MainLayout } from '../components/layout/MainLayout'
import { TweetList } from '../components/tweet/TweetList'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import type { Profile as ProfileType, Tweet } from '../types'
import toast from 'react-hot-toast'

export function Profile() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const { user, fetchProfile } = useAuthStore()
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ display_name: '', bio: '' })
  const [isSaving, setIsSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const isOwnProfile = user?.username === username

  const loadProfile = useCallback(async () => {
    if (!username) return
    setIsLoading(true)
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error
      setProfile(profileData as ProfileType)
      setEditForm({ display_name: profileData.display_name, bio: profileData.bio ?? '' })

      const { data: tweetsData } = await supabase
        .from('tweets')
        .select('*, profile:profiles(*)')
        .eq('user_id', profileData.id)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (user) {
        const tweetIds = tweetsData?.map((t) => t.id) ?? []
        const { data: likesData } = await supabase
          .from('likes').select('tweet_id').eq('user_id', user.id).in('tweet_id', tweetIds)
        const likedSet = new Set(likesData?.map((l) => l.tweet_id) ?? [])
        setTweets((tweetsData ?? []).map((t) => ({ ...t, is_liked: likedSet.has(t.id) })) as unknown as Tweet[])

        if (!isOwnProfile) {
          const { data: followData } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', profileData.id)
            .maybeSingle()
          setIsFollowing(!!followData)
        }
      } else {
        setTweets((tweetsData ?? []) as unknown as Tweet[])
      }
    } finally {
      setIsLoading(false)
    }
  }, [username, user, isOwnProfile])

  useEffect(() => { loadProfile() }, [loadProfile])

  const handleFollow = async () => {
    if (!user || !profile) return
    setIsFollowLoading(true)
    const newFollowing = !isFollowing
    setIsFollowing(newFollowing)
    setProfile((prev) =>
      prev ? { ...prev, followers_count: prev.followers_count + (newFollowing ? 1 : -1) } : prev
    )
    try {
      if (newFollowing) {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').delete().match({ follower_id: user.id, following_id: profile.id })
        if (error) throw error
      }
    } catch {
      setIsFollowing(!newFollowing)
      setProfile((prev) =>
        prev ? { ...prev, followers_count: prev.followers_count + (newFollowing ? -1 : 1) } : prev
      )
      toast.error('오류가 발생했습니다')
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    if (!editForm.display_name.trim()) { toast.error('이름을 입력해주세요'); return }
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editForm.display_name.trim(), bio: editForm.bio.trim() })
        .eq('id', user.id)
      if (error) throw error
      await fetchProfile(user.id)
      setProfile((prev) =>
        prev ? { ...prev, display_name: editForm.display_name.trim(), bio: editForm.bio.trim() } : prev
      )
      setIsEditing(false)
      toast.success('프로필이 수정되었습니다')
    } catch {
      toast.error('저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) { toast.error('이미지는 2MB 이하여야 합니다'); return }
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateError } = await supabase
        .from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      if (updateError) throw updateError
      await fetchProfile(user.id)
      setProfile((prev) => prev ? { ...prev, avatar_url: data.publicUrl } : prev)
      toast.success('프로필 사진이 변경되었습니다')
    } catch {
      toast.error('업로드에 실패했습니다')
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) { toast.error('이미지는 5MB 이하여야 합니다'); return }
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/cover.${ext}`
      const { error: uploadError } = await supabase.storage.from('covers').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('covers').getPublicUrl(path)
      const { error: updateError } = await supabase
        .from('profiles').update({ cover_url: data.publicUrl }).eq('id', user.id)
      if (updateError) throw updateError
      setProfile((prev) => prev ? { ...prev, cover_url: data.publicUrl } : prev)
      toast.success('커버 이미지가 변경되었습니다')
    } catch {
      toast.error('업로드에 실패했습니다')
    }
  }

  const handleDeleteTweet = (id: string) => {
    setTweets((prev) => prev.filter((t) => t.id !== id))
    setProfile((prev) => prev ? { ...prev, tweets_count: prev.tweets_count - 1 } : prev)
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

  if (!profile) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <p>사용자를 찾을 수 없습니다</p>
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
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profile.display_name}</h1>
          <p className="text-sm text-gray-500">{profile.tweets_count}개의 트윗</p>
        </div>
      </div>

      <div className="relative">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="커버" className="w-full h-full object-cover" />
          )}
          {isOwnProfile && (
            <>
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <Camera size={24} className="text-white" />
              </button>
            </>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-between items-end -mt-12 mb-3">
            <div className="relative">
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="xl" className="border-4 border-white dark:border-gray-950" />
              {isOwnProfile && (
                <>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Camera size={20} className="text-white" />
                  </button>
                </>
              )}
            </div>

            {isOwnProfile ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                프로필 수정
              </Button>
            ) : user && (
              <Button
                variant={isFollowing ? 'outline' : 'primary'}
                size="sm"
                isLoading={isFollowLoading}
                onClick={handleFollow}
              >
                {isFollowing ? '언팔로우' : '팔로우'}
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                label="이름"
                value={editForm.display_name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, display_name: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">소개</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  maxLength={160}
                  placeholder="자기소개를 입력하세요"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" isLoading={isSaving} onClick={handleSaveProfile}>저장</Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>취소</Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.display_name}</h2>
              <p className="text-gray-500 text-sm">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">{profile.bio}</p>}
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-gray-900 dark:text-white">
                  <strong>{profile.following_count}</strong>{' '}
                  <span className="text-gray-500">팔로잉</span>
                </span>
                <span className="text-gray-900 dark:text-white">
                  <strong>{profile.followers_count}</strong>{' '}
                  <span className="text-gray-500">팔로워</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <TweetList
          tweets={tweets}
          onDelete={handleDeleteTweet}
          emptyMessage="아직 트윗이 없습니다"
        />
      </div>
    </MainLayout>
  )
}
