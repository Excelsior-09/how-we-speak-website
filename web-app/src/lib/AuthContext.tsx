// ==============================================================================
// HOW WE SPEAK — PRODUCTION AUTH & SESSION PROVIDER
// Manages real Supabase authentication, session restoration, profiles,
// couples spaces, entitlements, TOTP MFA verification, and account lifecycle.
// ==============================================================================

import React, { useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'
import type { Profile, CouplesSpace, Entitlement } from '../types/database'
import { AuthContext } from './authTypes'

export const MAIN_WEBSITE_URL = 'https://tryhowwespeak.com/'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isConfigured = isSupabaseConfigured()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeSpace, setActiveSpace] = useState<CouplesSpace | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [entitlements, setEntitlements] = useState<Entitlement[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mfaRequired, setMfaRequired] = useState<boolean>(false)
  const [mfaFactors, setMfaFactors] = useState<any[]>([])
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      const search = window.location.search || ''
      return hash.includes('type=recovery') || search.includes('type=recovery')
    }
    return false
  })

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

  // Evaluates whether active session requires elevating from AAL1 to AAL2 via MFA
  const checkMfaStatus = useCallback(async (): Promise<boolean> => {
    if (!isConfigured) return false
    try {
      const { data: aalData, error: aalErr } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalErr) {
        console.warn('MFA assurance level check notice:', aalErr.message)
        return false
      }

      if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
        setMfaRequired(true)
        try {
          const { data: factorData } = await supabase.auth.mfa.listFactors()
          if (factorData) {
            const verifiedTotp = factorData.totp?.filter((f: any) => f.status === 'verified') ||
              factorData.all?.filter((f: any) => f.status === 'verified' && f.factor_type === 'totp') || []
            setMfaFactors(verifiedTotp)
          }
        } catch (fErr) {
          console.warn('Error listing MFA factors:', fErr)
        }
        return true
      } else {
        setMfaRequired(false)
        return false
      }
    } catch (err) {
      console.warn('MFA status evaluation error:', err)
      return false
    }
  }, [isConfigured])

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }

    // Handle PKCE code exchange or recovery tokens
    if (typeof window !== 'undefined') {
      const search = window.location.search || ''
      const hash = window.location.hash || ''
      const urlParams = new URLSearchParams(search)
      const code = urlParams.get('code')

      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setIsPasswordRecovery(true)
      }

      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data?.session) {
            setSession(data.session)
            setUser(data.user)
            if (hash.includes('type=recovery') || search.includes('type=recovery')) {
              setIsPasswordRecovery(true)
            }
          }
        }).catch(err => {
          console.warn('PKCE exchange error:', err)
        })
      }
    }

    // Live Supabase Auth session restoration
    supabase.auth.getSession().then(async ({ data: { session: initSession }, error }) => {
      if (error) {
        console.warn('Session restoration notice:', error.message)
      }

      if (initSession) {
        setSession(initSession)
        setUser(initSession.user)
        const isMfaNeeded = await checkMfaStatus()
        if (!isMfaNeeded && initSession.user) {
          fetchUserData(initSession.user.id, initSession.user.email ?? '')
        }
      } else {
        setSession(null)
        setUser(null)
        setMfaRequired(false)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      const event = _event
      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }

      if (currentSession?.user) {
        const isMfaNeeded = await checkMfaStatus()
        if (!isMfaNeeded) {
          await fetchUserData(currentSession.user.id, currentSession.user.email ?? '')
        }
      } else {
        setProfile(null)
        setActiveSpace(null)
        setPartnerProfile(null)
        setEntitlements([])
        setMfaRequired(false)
        setMfaFactors([])
        setIsPasswordRecovery(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isConfigured, fetchUserData, checkMfaStatus])

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }

      // Check if 2FA verification is required before granting access
      const isMfaNeeded = await checkMfaStatus()
      if (isMfaNeeded) {
        return { mfaRequired: true, data }
      }

      return { data }
    } catch (err: any) {
      return { error: err.message || 'Sign in failed.' }
    }
  }

  const verifyMfaLogin = async (code: string) => {
    if (!isConfigured) {
      return { error: 'Supabase credentials are not configured.' }
    }
    const cleanCode = code.trim().replace(/\D/g, '')
    if (cleanCode.length !== 6) {
      return { error: 'Please enter a valid 6-digit code from your authenticator app.' }
    }

    try {
      let factorId = mfaFactors[0]?.id
      if (!factorId) {
        const { data: factorData, error: listErr } = await supabase.auth.mfa.listFactors()
        if (listErr) throw listErr
        const verified = factorData?.totp?.find((f: any) => f.status === 'verified') ||
          factorData?.all?.find((f: any) => f.status === 'verified' && f.factor_type === 'totp')
        if (!verified) {
          return { error: 'No verified authenticator app found for this account.' }
        }
        factorId = verified.id
      }

      // Execute real Supabase challengeAndVerify
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: cleanCode,
      })

      if (error) {
        return { error: error.message || 'Invalid or expired authenticator code. Please check your app and try again.' }
      }

      // Elevation to AAL2 succeeded!
      setMfaRequired(false)
      const freshSession = (await supabase.auth.getSession()).data.session
      setSession(freshSession)
      setUser(freshSession?.user ?? null)
      if (freshSession?.user) {
        await fetchUserData(freshSession.user.id, freshSession.user.email ?? '')
      }
      return { data }
    } catch (err: any) {
      return { error: err.message || 'Failed to verify authenticator code. Please retry.' }
    }
  }

  const cancelMfaLogin = async () => {
    if (isConfigured) {
      try {
        await supabase.auth.signOut()
      } catch (e) {}
    }
    setMfaRequired(false)
    setMfaFactors([])
    setUser(null)
    setSession(null)
    setProfile(null)
    setActiveSpace(null)
    setPartnerProfile(null)
    setEntitlements([])
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
      const redirectUrl = `${window.location.origin}/app/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
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
      setIsPasswordRecovery(false)
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
      const { error: rpcError } = await supabase.rpc('delete_user_account')
      if (rpcError) throw rpcError

      await signOut('https://tryhowwespeak.com/')
      return {}
    } catch (err: any) {
      return { error: err.message || 'Could not complete account deletion.' }
    }
  }

  const signOut = async (redirectUrl: string = MAIN_WEBSITE_URL): Promise<{ error?: string }> => {
    if (isConfigured) {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          const lowerMsg = error.message?.toLowerCase() || ''
          // If error is not session_not_found, report failure
          if (!lowerMsg.includes('auth session missing') && !lowerMsg.includes('session_not_found') && !lowerMsg.includes('not logged in')) {
            console.error('Logout error from Supabase:', error.message)
            return { error: error.message || 'Failed to sign out. Please check your connection and try again.' }
          }
        }
      } catch (err: any) {
        console.error('Unexpected signOut error:', err)
        return { error: err.message || 'An error occurred during logout.' }
      }
    }

    // Invalidate in-memory authentication state
    setUser(null)
    setSession(null)
    setProfile(null)
    setActiveSpace(null)
    setPartnerProfile(null)
    setEntitlements([])
    setMfaRequired(false)
    setMfaFactors([])

    // Clean up all cached user data in storage
    try {
      const keysToRemove = [
        'hws_mira_conversations',
        'hws_mira_preferences',
        'hws_mira_memories',
        'hws_mira_prefill',
        'hws_user_profile',
        'hws_active_space',
        'hws_return_to',
        'hws_sandbox_auth',
      ]
      keysToRemove.forEach((k) => localStorage.removeItem(k))

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('hws_') || key.startsWith('sb-'))) {
          localStorage.removeItem(key)
        }
      }
      sessionStorage.clear()
    } catch (cleanupErr) {
      console.warn('Storage cleanup notice on logout:', cleanupErr)
    }

    // Immediate redirection to main website homepage
    if (typeof window !== 'undefined') {
      window.location.assign(redirectUrl)
    }

    return {}
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
        mfaRequired,
        mfaFactors,
        isPasswordRecovery,
        setIsPasswordRecovery,
        signUp,
        signIn,
        signInWithMagicLink,
        signInWithOAuth,
        verifyMfaLogin,
        cancelMfaLogin,
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
