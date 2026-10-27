import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, CouplesSpace, Entitlement } from '../types/database'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  activeSpace: CouplesSpace | null
  partnerProfile: Profile | null
  entitlements: Entitlement[]
  isConfigured: boolean
  loading: boolean
  signUp: (email: string, password: string, displayName?: string, archetype?: string) => Promise<{ error?: string; data?: any; needsConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>
  signInWithOAuth: (provider: 'google') => Promise<{ error?: string }>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (newPassword: string) => Promise<{ error?: string }>
  deleteAccount: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
