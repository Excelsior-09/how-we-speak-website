// ==============================================================================
// HOW WE SPEAK — LUXURY AUTHENTICATION MODAL
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Email/Password, Google OAuth, Magic Link, Clean Reset & Email Confirmation
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { MfaChallengeGate } from './MfaChallengeGate'
import type { Archetype } from '../types/database'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialMode?: 'signin' | 'signup'
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const { isConfigured, signIn, signUp, signInWithMagicLink, signInWithOAuth } = useAuth()
  const { navigate } = useRouter()
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [isMfaStep, setIsMfaStep] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setIsSignUp(initialMode === 'signup')
      }
      setIsMfaStep(false)
    }
  }, [isOpen, initialMode])

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [archetype, setArchetype] = useState<Archetype>('Avoider')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  if (!isOpen) return null

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || googleLoading) return

    setLoading(true)
    setMessage(null)
    setIsError(false)

    if (isSignUp) {
      const savedEmail = email.trim()
      const res = await signUp(savedEmail, password, displayName, archetype)

      if (res.error) {
        setIsError(true)
        setMessage(res.error)
        setLoading(false)
      } else {
        // Clear sensitive inputs immediately
        setPassword('')
        setDisplayName('')
        setEmail('')

        if (res.needsConfirmation || (isConfigured && !res.data?.session)) {
          // Email confirmation is required: redirect user to dedicated confirmation page
          setLoading(false)
          onClose()
          navigate(`/app/confirm-email?email=${encodeURIComponent(savedEmail)}`)
        } else {
          // User already confirmed or auto-authenticated
          setMessage('Account created! Welcome to TryHowWeSpeak.')
          setTimeout(() => {
            setLoading(false)
            onSuccess?.()
            onClose()
          }, 400)
        }
      }
    } else {
      const res = await signIn(email.trim(), password)
      if (res.error) {
        setIsError(true)
        const lowerErr = res.error.toLowerCase()
        if (lowerErr.includes('invalid login credentials') || lowerErr.includes('invalid_grant')) {
          setMessage('Invalid email or password. Please verify your credentials or sign up if you do not have an account yet.')
        } else if (lowerErr.includes('email not confirmed')) {
          setMessage('Your email address has not been confirmed yet. Please check your inbox for the confirmation email, or sign up to resend.')
        } else {
          setMessage(res.error)
        }
        setLoading(false)
      } else if (res.mfaRequired) {
        // Account has 2FA enabled: prompt for authenticator security code
        setIsMfaStep(true)
        setLoading(false)
      } else {
        setPassword('')
        setLoading(false)
        onSuccess?.()
        onClose()
      }
    }
  }

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return
    setGoogleLoading(true)
    setMessage(null)
    setIsError(false)

    try {
      const res = await signInWithOAuth('google')
      if (res?.error) {
        setIsError(true)
        const errLower = res.error.toLowerCase()
        if (errLower.includes('not enabled') || errLower.includes('provider is not enabled')) {
          setMessage('Google authentication is not yet enabled in this Supabase project. Please configure Google OAuth in your Supabase dashboard or continue with email.')
        } else {
          setMessage(res.error)
        }
        setGoogleLoading(false)
      } else if (res?.data?.url) {
        window.location.href = res.data.url
      }
    } catch (err: any) {
      setIsError(true)
      setMessage(err.message || 'Google sign in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setIsError(true)
      setMessage('Please enter your email address first.')
      return
    }
    setLoading(true)
    setMessage(null)
    setIsError(false)

    const res = await signInWithMagicLink(email.trim())
    if (res.error) {
      setIsError(true)
      setMessage(res.error)
    } else {
      setMessage('Magic link dispatched! Check your email inbox to sign in instantly.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(26, 26, 26, 0.65)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="card-glass" style={{
        maxWidth: 480,
        width: '100%',
        padding: '36px 32px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-card)',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--gray)',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        {isMfaStep ? (
          <MfaChallengeGate
            isModal={true}
            onSuccess={() => {
              setIsMfaStep(false)
              setPassword('')
              onSuccess?.()
              onClose()
            }}
            onCancel={() => {
              setIsMfaStep(false)
            }}
          />
        ) : (
          <>
            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'var(--burgundy-subtle)',
                color: 'var(--burgundy)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <ShieldCheck size={28} />
              </div>
              <h2 style={{ fontSize: 24, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5 }}>
                {isSignUp
                  ? 'Begin private conversation practice and invite your partner when you are ready.'
                  : 'Sign in to access your saved conversations and private plans.'}
              </p>
            </div>

            {message && (
              <div style={{
                background: isError ? '#fde8e8' : 'var(--cream)',
                color: isError ? '#9b1c1c' : 'var(--burgundy-dark)',
                border: isError ? '1px solid #f8b4b4' : '1px solid var(--blush)',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                marginBottom: 16,
                textAlign: 'center',
                lineHeight: 1.45,
              }} id="auth-modal-message">
                {message}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              id="btn-google-auth"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 'var(--radius-sm, 8px)',
                color: '#1A202C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: (loading || googleLoading) ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.2s ease',
                marginBottom: 14,
              }}
            >
              {googleLoading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0 16px', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                or continue with email
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {isSignUp && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 5 }}>
                      Your First Name or Nickname
                    </label>
                    <div style={{ position: 'relative' }}>
                      <UserIcon size={16} color="var(--gray)" style={{ position: 'absolute', left: 14, top: 15 }} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: 42 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 5 }}>
                      Conflict Archetype (from Quiz)
                    </label>
                    <select
                      value={archetype}
                      onChange={(e) => setArchetype(e.target.value as Archetype)}
                      className="input-field"
                      style={{ background: '#FFF' }}
                    >
                      <option value="Avoider">The Avoider (Withdraws to avoid conflict)</option>
                      <option value="Pursuer">The Pursuer (Reaches urgently for resolution)</option>
                      <option value="Validator">The Validator (Seeks mutual emotional acknowledgment)</option>
                      <option value="Freezer">The Freezer (Experiences nervous system paralysis)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 5 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--gray)" style={{ position: 'absolute', left: 14, top: 15 }} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 5 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--gray)" style={{ position: 'absolute', left: 14, top: 15 }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px', marginTop: 4, fontSize: 14.5 }}
              >
                {loading ? 'Processing...' : isSignUp ? 'Create My Account' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading || googleLoading}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '11px', fontSize: 13 }}
              >
                <Sparkles size={14} color="var(--gold)" />
                Send Passwordless Magic Link
              </button>
            </form>

            <div style={{
              textAlign: 'center',
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              fontSize: 13,
              color: 'var(--gray)',
            }}>
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setMessage(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--burgundy)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  New to How We Speak?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setMessage(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--burgundy)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create Account
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
