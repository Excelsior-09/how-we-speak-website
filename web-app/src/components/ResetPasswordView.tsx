// ==============================================================================
// HOW WE SPEAK — LUXURY PASSWORD RESET & ACCOUNT RECOVERY
// Brand Palette: Burgundy #C41E3A | Gold #D4AF37 | Cream #F5F3F0 | Blush #E8CCC8
// Route: /app/reset-password, /reset-password, /recovery
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'

interface ResetPasswordViewProps {
  onSignIn?: () => void
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onSignIn }) => {
  const { resetPassword, updatePassword, isPasswordRecovery, setIsPasswordRecovery } = useAuth()
  const { navigate } = useRouter()

  // Detection of recovery mode
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() => {
    if (isPasswordRecovery) return true
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      const search = window.location.search || ''
      return hash.includes('type=recovery') || search.includes('type=recovery')
    }
    return false
  })

  // Mode A: Request Reset State
  const [requestEmail, setRequestEmail] = useState<string>('')
  const [requestLoading, setRequestLoading] = useState<boolean>(false)
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  // Mode B: Set New Password State
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [updateLoading, setUpdateLoading] = useState<boolean>(false)
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    if (isPasswordRecovery) {
      setIsRecoveryMode(true)
    }
  }, [isPasswordRecovery])

  // Automatic PKCE or Hash token recovery detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      const search = window.location.search || ''
      const params = new URLSearchParams(search)
      const code = params.get('code')

      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setIsRecoveryMode(true)
        setIsPasswordRecovery(true)
      } else if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data?.session) {
            setIsRecoveryMode(true)
            setIsPasswordRecovery(true)
          }
        }).catch(() => {})
      }
    }
  }, [setIsPasswordRecovery])

  // Handle Requesting Reset Email (Mode A)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestEmail.trim() || requestLoading) return

    setRequestLoading(true)
    setRequestError(null)
    setRequestSuccess(false)

    try {
      const res = await resetPassword(requestEmail.trim())
      if (res.error) {
        setRequestError(res.error)
      } else {
        setRequestSuccess(true)
      }
    } catch (err: any) {
      setRequestError(err.message || 'Unable to send password reset link. Please try again.')
    } finally {
      setRequestLoading(false)
    }
  }

  // Handle Setting New Password (Mode B)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (updateLoading) return

    if (!newPassword || newPassword.length < 6) {
      setUpdateError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setUpdateError('Passwords do not match. Please verify and re-enter.')
      return
    }

    setUpdateLoading(true)
    setUpdateError(null)

    try {
      const res = await updatePassword(newPassword)
      if (res.error) {
        const lower = res.error.toLowerCase()
        if (lower.includes('expired') || lower.includes('invalid') || lower.includes('token')) {
          setUpdateError('This recovery link has expired or has already been used. Please request a new password reset link.')
        } else {
          setUpdateError(res.error)
        }
      } else {
        setUpdateSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: 540,
      margin: '40px auto 60px',
      padding: '0 16px',
    }}>
      <div className="card-glass animate-fade-in" style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-card, 20px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        padding: '40px 36px',
      }}>
        {/* Brand Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: 20,
            background: 'var(--burgundy-subtle, rgba(196,30,58,0.08))',
            color: 'var(--burgundy, #C41E3A)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            border: '1px solid var(--burgundy-glow, rgba(196,30,58,0.18))',
          }}>
            <KeyRound size={28} />
          </div>

          <div style={{ display: 'inline-flex', gap: 6, marginBottom: 8 }}>
            <span className="badge badge-gold" style={{ fontSize: 11 }}>Security Protocol</span>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>Protected</span>
          </div>

          <h1 style={{
            fontSize: 28,
            fontFamily: 'var(--font-display, "Cormorant Garamond", Georgia, serif)',
            color: 'var(--charcoal, #1A1A1A)',
            margin: '8px 0 6px',
            fontWeight: 600,
          }}>
            {isRecoveryMode ? 'Set Your New Password' : 'Reset Your Password'}
          </h1>

          <p style={{
            fontSize: 14,
            color: 'var(--gray, #555)',
            lineHeight: 1.55,
            maxWidth: 420,
            margin: '0 auto',
          }}>
            {isRecoveryMode
              ? 'Choose a strong, private password with at least 6 characters to secure your TryHowWeSpeak account.'
              : 'Enter your account email address below. Supabase will send a secure password recovery link to your inbox.'}
          </p>
        </div>

        {/* ---------------------------------------------------- */}
        {/* MODE B: ENTER NEW PASSWORD (Active Recovery Session) */}
        {/* ---------------------------------------------------- */}
        {isRecoveryMode ? (
          <div>
            {updateSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'var(--cream, #F5F3F0)',
                borderRadius: 'var(--radius-md, 14px)',
                border: '1px solid var(--border)',
              }} id="reset-success-alert">
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: '#27ae60',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <CheckCircle2 size={26} />
                </div>
                <h3 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                  Password Updated Successfully!
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 20 }}>
                  Your account password has been updated. You can now use your new password to sign in or access your dashboard.
                </p>
                <button
                  type="button"
                  id="btn-goto-dashboard"
                  onClick={() => {
                    navigate('/app')
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  <Sparkles size={16} />
                  Proceed to Dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {updateError && (
                  <div style={{
                    background: '#fde8e8',
                    color: '#9b1c1c',
                    border: '1px solid #f8b4b4',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm, 10px)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }} id="reset-error-alert">
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, lineHeight: 1.45 }}>{updateError}</div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--gray)" style={{ position: 'absolute', left: 14, top: 15 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                      id="new-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 13,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--gray)',
                        padding: 4,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={16} color="var(--gray)" style={{ position: 'absolute', left: 14, top: 15 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 42 }}
                      id="confirm-password-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="btn btn-primary"
                  id="btn-update-password"
                  style={{ width: '100%', padding: '13px', fontSize: 14.5, marginTop: 4 }}
                >
                  {updateLoading ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(false)
                      setIsPasswordRecovery(false)
                      setUpdateError(null)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--burgundy)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeft size={14} />
                    Need to request a new recovery link?
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* MODE A: REQUEST RESET LINK (No active recovery token) */
          /* ---------------------------------------------------- */
          <div>
            {requestSuccess ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'var(--cream, #F5F3F0)',
                borderRadius: 'var(--radius-md, 14px)',
                border: '1px solid var(--border)',
              }} id="reset-success-alert">
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: 'var(--burgundy)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Mail size={24} />
                </div>
                <h3 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                  Password Reset Link Dispatched
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 20 }}>
                  We sent a secure password reset link to <strong>{requestEmail}</strong>. Please check your Gmail or email inbox (and spam folder) and click the link to set your new password.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestSuccess(false)
                      setRequestEmail('')
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', padding: '11px', fontSize: 13 }}
                  >
                    Resend or enter another email
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSignIn) onSignIn()
                      else navigate('/app?auth=signin')
                    }}
                    className="btn btn-ghost"
                    style={{ width: '100%', padding: '10px', fontSize: 13 }}
                  >
                    Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {requestError && (
                  <div style={{
                    background: '#fde8e8',
                    color: '#9b1c1c',
                    border: '1px solid #f8b4b4',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm, 10px)',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }} id="reset-error-alert">
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1, lineHeight: 1.45 }}>{requestError}</div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--gray)" style={{ position: 'absolute', left: 14, top: 15 }} />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: 42 }}
                      id="reset-email-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="btn btn-primary"
                  id="btn-send-reset"
                  style={{ width: '100%', padding: '13px', fontSize: 14.5, marginTop: 4 }}
                >
                  {requestLoading ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Sending Recovery Link...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      <span>Send Password Reset Link</span>
                    </>
                  )}
                </button>

                <div style={{
                  textAlign: 'center',
                  marginTop: 14,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--gray)',
                }}>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSignIn) onSignIn()
                      else navigate('/app?auth=signin')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--burgundy)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    id="btn-back-to-login"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
