// ==============================================================================
// HOW WE SPEAK — AUTH & SESSION PROVIDER
// Manages authenticated session, profile sync, couples space state & entitlements
// ==============================================================================

import React, { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import type { Profile, CouplesSpace, Entitlement } from '../types/database'
import { AuthContext } from './authTypes'

const SANDBOX_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { full_name: 'Alex Rivera' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'alex@tryhowwespeak.com',
}

const SANDBOX_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'alex@tryhowwespeak.com',
  display_name: 'Alex Rivera',
  archetype: 'Avoider',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

function getInitialSandboxAuth() {
  if (typeof window === 'undefined' || isSupabaseConfigured()) {
    return { user: null, profile: null, activeSpace: null, partnerProfile: null }
  }
  const saved = localStorage.getItem('hws_sandbox_auth')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      return {
        user: parsed.user || null,
        profile: parsed.profile || null,
        activeSpace: parsed.activeSpace || null,
        partnerProfile: parsed.partnerProfile || null,
      }
    } catch {
      return { user: null, profile: null, activeSpace: null, partnerProfile: null }
    }
  }
  return { user: null, profile: null, activeSpace: null, partnerProfile: null }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured()
  const initialData = getInitialSandboxAuth()

  const [user, setUser] = useState<User | null>(initialData.user)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(initialData.profile)
  const [activeSpace, setActiveSpace] = useState<CouplesSpace | null>(initialData.activeSpace)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(initialData.partnerProfile)
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loading, setLoading] = useState<boolean>(isConfigured)

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    if (!isConfigured) return

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!profileErr && profileData) {
        setProfile(profileData as Profile)
      } else {
        setProfile({
          id: userId,
          email,
          display_name: email.split('@')[0],
          archetype: 'Avoider',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // 2. Fetch Couples Space
      const { data: spaceData } = await supabase
        .from('couples_spaces')
        .select('*')
        .or(`partner_1_id.eq.${userId},partner_2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (spaceData) {
        setActiveSpace(spaceData as CouplesSpace)
        const partnerId = spaceData.partner_1_id === userId ? spaceData.partner_2_id : spaceData.partner_1_id
        if (partnerId) {
          const { data: partnerData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .maybeSingle()

          if (partnerData) {
            setPartnerProfile(partnerData as Profile)
          }
        } else {
          setPartnerProfile(null)
        }
      } else {
        setActiveSpace(null)
        setPartnerProfile(null)
      }

      // 3. Fetch Entitlements
      const { data: entData } = await supabase
        .from('entitlements')
        .select('*')
        .eq('status', 'active')
        .or(`user_id.eq.${userId},customer_email.eq.${email}`)

      if (entData) {
        setEntitlements(entData as Entitlement[])
      }
    } catch (err) {
      console.warn('fetchUserData error:', err)
    }
  }, [isConfigured])

  useEffect(() => {
    if (!isConfigured) return

    // Live Supabase Auth listener
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession)
      setUser(initSession?.user ?? null)
      if (initSession?.user) {
        fetchUserData(initSession.user.id, initSession.user.email ?? '')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id, currentSession.user.email ?? '')
      } else {
        setProfile(null)
        setActiveSpace(null)
        setPartnerProfile(null)
        setEntitlements([])
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isConfigured, fetchUserData])

  const refreshUserData = async () => {
    if (user?.id && user?.email) {
      await fetchUserData(user.id, user.email)
    }
  }

  const signUp = async (email: string, password: string, displayName?: string, archetype?: string) => {
    if (!isConfigured) {
      const mockUser: User = {
        ...SANDBOX_USER,
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        email,
      }
      const mockProfile: Profile = {
        id: mockUser.id,
        email,
        display_name: displayName || email.split('@')[0],
        archetype: (archetype as any) || 'Avoider',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setUser(mockUser)
      setProfile(mockProfile)
      localStorage.setItem('hws_sandbox_auth', JSON.stringify({ user: mockUser, profile: mockProfile }))
      return {}
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            archetype: archetype || 'Avoider',
          },
        },
      })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Registration failed.' }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      const mockUser: User = {
        ...SANDBOX_USER,
        email,
      }
      const mockProfile: Profile = {
        ...SANDBOX_PROFILE,
        email,
        display_name: email.split('@')[0],
      }
      setUser(mockUser)
      setProfile(mockProfile)
      localStorage.setItem('hws_sandbox_auth', JSON.stringify({ user: mockUser, profile: mockProfile }))
      return {}
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Sign in failed.' }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    if (!isConfigured) {
      const mockUser: User = { ...SANDBOX_USER, email }
      const mockProfile: Profile = { ...SANDBOX_PROFILE, email }
      setUser(mockUser)
      setProfile(mockProfile)
      localStorage.setItem('hws_sandbox_auth', JSON.stringify({ user: mockUser, profile: mockProfile }))
      return {}
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/`,
        },
      })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Magic link request failed.' }
    }
  }

  const signOut = async () => {
    if (!isConfigured) {
      setUser(null)
      setProfile(null)
      setActiveSpace(null)
      setPartnerProfile(null)
      localStorage.removeItem('hws_sandbox_auth')
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setActiveSpace(null)
    setPartnerProfile(null)
    setEntitlements([])
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        activeSpace,
        partnerProfile,
        entitlements,
        isConfigured,
        loading,
        signUp,
        signIn,
        signInWithMagicLink,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
