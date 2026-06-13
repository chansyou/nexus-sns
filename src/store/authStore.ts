import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types'
import { supabase } from '../lib/supabase'

interface AuthStore {
  user: Profile | null
  session: Session | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setUser: (user: Profile | null) => void
  fetchProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setSession: (session) => set({ session }),

  setUser: (user) => set({ user }),

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      set({ user: data as Profile, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
