export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  cover_url: string
  followers_count: number
  following_count: number
  tweets_count: number
  created_at: string
  updated_at: string
}

export interface Tweet {
  id: string
  user_id: string
  content: string
  image_url: string | null
  parent_id: string | null
  likes_count: number
  comments_count: number
  created_at: string
  profile: Profile
  is_liked?: boolean
}

export interface Like {
  id: string
  user_id: string
  tweet_id: string
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface AuthState {
  user: Profile | null
  session: import('@supabase/supabase-js').Session | null
  isLoading: boolean
}
