// ==============================================================================
// HOW WE SPEAK — LUXURY AUTHENTICATION MODAL
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// ==============================================================================

import React, { useState, useEffect } from 'react'
import { X, Mail, Lock, User as UserIcon, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/useAuth'
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
  const { isConfigured, signIn, signUp, signInWithMagicLink } = useAuth()
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')

  useEffect(() => {
    if (isOpen && initialMode) {
      setIsSignUp(initialMode === 'signup')
    }
  }, [isOpen, initialMode])
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [archetype, setArchetype] = useState<Archetype>('Avoider')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  if (!isOpen) return null

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setIsError(false)

    if (isSignUp) {
      const res = await signUp(email, password, displayName, archetype)
      if (res.error) {
        setIsError(true)
        setMessage(res.error)
      } else {
        setMessage(
          isConfigured
            ? 'Account created! Please check your email to confirm your address.'
            : 'Account created! Welcome to How We Speak.'
        )
        if (!isConfigured) {
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 600)
        }
      }
    } else {
      const res = await signIn(email, password)
      if (res.error) {
        setIsError(true)
        setMessage(res.error)
      } else {
        onSuccess?.()
        onClose()
      }
    }
    setLoading(false)
  }

  const handleMagicLink = async () => {
    if (!email) {
      setIsError(true)
      setMessage('Please enter your email address first.')
      return
    }
    setLoading(true)
    setMessage(null)
    setIsError(false)

    const res = await signInWithMagicLink(email)
    if (res.error) {
      setIsError(true)
      setMessage(res.error)
    } else {
      setMessage(
        isConfigured
          ? 'Magic link dispatched! Check your email inbox to sign in instantly.'
          : 'Magic link simulated! Signed in as ' + email
      )
      if (!isConfigured) {
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 600)
      }
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
        maxWidth: 460,
        width: '100%',
        padding: '36px 32px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-card)',
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

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
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
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5 }}>
            {isSignUp
              ? 'Begin private conversation practice and invite your partner when you are ready.'
              : 'Sign in to access your saved conversations and private plans.'}
          </p>
        </div>

        {/* Supabase Status Banner */}
        {!isConfigured && (
          <div style={{
            background: 'var(--cream)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--charcoal-muted)',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={15} color="var(--gold)" />
            <span><strong>Local Sandbox:</strong> Enter any email/password to explore workspace features.</span>
          </div>
        )}

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
          }}>
            {message}
          </div>
        )}

        {/* Form */}
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
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', marginTop: 4, fontSize: 14.5 }}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create My Account' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleMagicLink}
            disabled={loading}
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
      </div>
    </div>
  )
}
