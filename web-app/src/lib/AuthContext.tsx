// ==============================================================================
// HOW WE SPEAK — PRODUCTION AUTH & SESSION PROVIDER
// Manages real Supabase authentication, session restoration, profiles,
// couples spaces, entitlements, and account lifecycle.
// ==============================================================================

import React, { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import type { Profile, CouplesSpace, Entitlement } from '../types/database'
import { AuthContext } from './authTypes'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeSpace, setActiveSpace] = useState<CouplesSpace | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    if (!isConfigured) return

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!profileErr && profileData) {
        setProfile(profileData as Profile)
      } else {
        // Safe fallback in case profile trigger had slight latency
        const fallbackProfile: Profile = {
          id: userId,
          email,
          display_name: email.split('@')[0],
          archetype: 'Avoider',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setProfile(fallbackProfile)

        // Attempt idempotent upsert
        await supabase.from('profiles').upsert({
          id: userId,
          email,
          display_name: email.split('@')[0],
          archetype: 'Avoider',
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
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Live Supabase Auth session restoration
    supabase.auth.getSession().then(({ data: { session: initSession }, error }) => {
      if (error) {
        console.warn('Session restoration notice:', error.message)
      }
      setSession(initSession)
      setUser(initSession?.user ?? null)
      if (initSession?.user) {
        fetchUserData(initSession.user.id, initSession.user.email ?? '')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        await fetchUserData(currentSession.user.id, currentSession.user.email ?? '')
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
      return { error: 'Supabase credentials are not configured. Please check your environment variables.' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            archetype: archetype || 'Avoider',
          },
          emailRedirectTo: `${window.location.origin}/app/`,
        },
      })
      if (error) return { error: error.message }
      const needsConfirmation = !data?.session || !data?.user?.email_confirmed_at
      return { data, needsConfirmation }
    } catch (err: any) {
      return { error: err.message || 'Registration failed.' }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured. Please check your environment variables.' }
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
      return { error: 'Supabase credentials are not configured. Please check your environment variables.' }
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

  const signInWithOAuth = async (provider: 'google') => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured. Please check your environment variables.' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/app/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      if (error) return { error: error.message }
      return { data }
    } catch (err: any) {
      return { error: err.message || 'OAuth sign in failed.' }
    }
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured. Please check your environment variables.' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/settings`,
      })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Password reset request failed.' }
    }
  }

  const updatePassword = async (newPassword: string) => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured.' }
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return { error: error.message }
      return {}
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' }
    }
  }

  const deleteAccount = async () => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured.' }
    }

    try {
      // Execute security definer account deletion procedure
      const { error: rpcError } = await supabase.rpc('delete_user_account')
      if (rpcError) throw rpcError

      // Sign out and clear local state
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setActiveSpace(null)
      setPartnerProfile(null)
      setEntitlements([])
      return {}
    } catch (err: any) {
      return { error: err.message || 'Could not complete account deletion.' }
    }
  }

  const signOut = async () => {
    if (isConfigured) {
      await supabase.auth.signOut()
    }
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
        signInWithOAuth,
        resetPassword,
        updatePassword,
        deleteAccount,
        signOut,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
