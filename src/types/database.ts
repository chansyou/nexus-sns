export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id: string
          username: string
          display_name: string
          bio?: string
          avatar_url?: string
          cover_url?: string
          followers_count?: number
          following_count?: number
          tweets_count?: number
        }
        Update: {
          username?: string
          display_name?: string
          bio?: string
          avatar_url?: string
          cover_url?: string
          updated_at?: string
        }
      }
      tweets: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          parent_id: string | null
          likes_count: number
          comments_count: number
          created_at: string
        }
        Insert: {
          user_id: string
          content: string
          image_url?: string | null
          parent_id?: string | null
        }
        Update: {
          content?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          tweet_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          tweet_id: string
        }
        Update: never
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
        }
        Update: never
      }
    }
  }
}
