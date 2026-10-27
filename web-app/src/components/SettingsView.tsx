// ==============================================================================
// HOW WE SPEAK — ACCOUNT SETTINGS & SECURITY VIEW
// Route: /app/settings
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Profile info, conflict archetype, digital product entitlements,
//           email verification status & update, TOTP 2FA authenticator security,
//           password reset, and account deletion.
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  User,
  Shield,
  CreditCard,
  LogOut,
  ExternalLink,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Key,
  AlertTriangle,
  Mail,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Lock,
  ShieldCheck,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

interface TotpFactor {
  id: string
  friendly_name?: string
  factor_type: string
  status: 'verified' | 'unverified'
  created_at: string
}

export const SettingsView: React.FC = () => {
  const { user, profile, entitlements, signOut, deleteAccount, resetPassword, isConfigured, refreshUserData } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Email Security State
  const [newEmail, setNewEmail] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Authenticator (TOTP MFA) State
  const [factors, setFactors] = useState<TotpFactor[]>([])
  const [loadingFactors, setLoadingFactors] = useState(false)
  const [mfaAssuranceLevel, setMfaAssuranceLevel] = useState<'aal1' | 'aal2'>('aal1')
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollData, setEnrollData] = useState<{ id: string; qr_code: string; secret: string; uri: string } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [verifyingMfa, setVerifyingMfa] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [unrollingId, setUnrollingId] = useState<string | null>(null)

  const hasBundle = entitlements.some((e) => e.product_key === 'bundle')
  const ownedKeys = entitlements.map((e) => e.product_key)
  const isEmailConfirmed = !!user?.email_confirmed_at

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Fetch MFA factors
  const loadMfaFactors = async () => {
    if (!user || !isConfigured) return
    setLoadingFactors(true)
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (!error && data) {
        setFactors((data.totp || []) as TotpFactor[])
      }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalData) {
        setMfaAssuranceLevel(aalData.currentLevel as 'aal1' | 'aal2')
      }
    } catch (err) {
      console.warn('Failed to load MFA factors:', err)
    } finally {
      setLoadingFactors(false)
    }
  }

  useEffect(() => {
    loadMfaFactors()
  }, [user, isConfigured])

  // Profile update handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsUpdating(true)
    setStatusMessage(null)

    if (isConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (error) throw error
        await refreshUserData()
        setStatusMessage('Profile updated successfully.')
      } catch (err: any) {
        setStatusMessage(err.message || 'Failed to update profile.')
      } finally {
        setIsUpdating(false)
      }
    } else {
      setIsUpdating(false)
      setStatusMessage('Profile updated locally.')
    }
  }

  // Resend verification email handler
  const handleResendConfirmation = async () => {
    if (!user?.email || resendCooldown > 0 || resendingEmail) return
    setResendingEmail(true)
    setEmailStatusMsg(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/app/settings`,
        },
      })

      if (error) {
        setEmailStatusMsg({ type: 'error', text: error.message || 'Failed to send confirmation email.' })
      } else {
        setEmailStatusMsg({ type: 'success', text: 'Verification email resent! Please check your inbox and spam folder.' })
        setResendCooldown(60)
      }
    } catch (err: any) {
      setEmailStatusMsg({ type: 'error', text: err.message || 'Unexpected error while resending confirmation.' })
    } finally {
      setResendingEmail(false)
    }
  }

  // Update email address handler
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || isUpdatingEmail) return
    setIsUpdatingEmail(true)
    setEmailStatusMsg(null)

    try {
      const { error } = await supabase.auth.updateUser(
        { email: newEmail.trim() },
        { emailRedirectTo: `${window.location.origin}/app/settings` }
      )

      if (error) {
        setEmailStatusMsg({ type: 'error', text: error.message || 'Failed to request email update.' })
      } else {
        setEmailStatusMsg({
          type: 'success',
          text: `Verification sent to ${newEmail.trim()}. Please click the link in your email to complete the change.`,
        })
        setNewEmail('')
      }
    } catch (err: any) {
      setEmailStatusMsg({ type: 'error', text: err.message || 'Error occurred while updating email.' })
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  // Start MFA Enrollment
  const handleStartEnrollment = async () => {
    setMfaError(null)
    setMfaSuccess(null)
    setVerificationCode('')

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'TryHowWeSpeak',
        friendlyName: `Authenticator (${new Date().toLocaleDateString()})`,
      })

      if (error) {
        setMfaError(error.message || 'Unable to start authenticator enrollment.')
        return
      }

      if (data && data.totp) {
        setEnrollData({
          id: data.id,
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        })
        setIsEnrolling(true)
      }
    } catch (err: any) {
      setMfaError(err.message || 'Failed to initiate MFA enrollment.')
    }
  }

  // Verify and complete MFA enrollment
  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollData || !verificationCode.trim() || verifyingMfa) return

    setVerifyingMfa(true)
    setMfaError(null)

    try {
      // Use challengeAndVerify to bind and activate factor
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.id,
        code: verificationCode.trim(),
      })

      if (error) {
        setMfaError(error.message || 'Invalid authentication code. Please check your authenticator app and try again.')
        setVerifyingMfa(false)
        return
      }

      setMfaSuccess('Authenticator successfully enrolled and activated!')
      setIsEnrolling(false)
      setEnrollData(null)
      setVerificationCode('')
      await loadMfaFactors()
    } catch (err: any) {
      setMfaError(err.message || 'Verification failed. Please retry.')
    } finally {
      setVerifyingMfa(false)
    }
  }

  // Cancel Enrollment
  const handleCancelEnrollment = () => {
    setIsEnrolling(false)
    setEnrollData(null)
    setVerificationCode('')
    setMfaError(null)
  }

  // Remove / unenroll factor
  const handleUnenrollFactor = async (factorId: string) => {
    const confirmRemoval = window.confirm(
      'Are you sure you want to remove this authenticator? This will disable two-factor authentication on your account.'
    )
    if (!confirmRemoval) return

    setUnrollingId(factorId)
    setMfaError(null)
    setMfaSuccess(null)

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId })
      if (error) {
        setMfaError(error.message || 'Failed to remove authenticator.')
      } else {
        setMfaSuccess('Authenticator factor removed successfully.')
        await loadMfaFactors()
      }
    } catch (err: any) {
      setMfaError(err.message || 'Error occurred while removing authenticator.')
    } finally {
      setUnrollingId(null)
    }
  }

  // Copy secret key helper
  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified')
  const hasActiveMfa = verifiedFactors.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 840 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-burgundy">Account Settings</span>
          <span className="badge badge-gold">Security & Privacy</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
          Settings & Account Security
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 16 }}>
          Manage your account profile, review digital entitlements, and secure your login with email verification and authenticator 2FA.
        </p>
      </div>

      {statusMessage && (
        <div style={{
          background: 'var(--cream)',
          border: '1px solid var(--gold)',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: 13.5,
          color: 'var(--charcoal)',
        }}>
          {statusMessage}
        </div>
      )}

      {/* 1. Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={20} color="var(--burgundy)" />
          <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>Profile Information</h2>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
            Email Address (Authenticated)
          </label>
          <input
            type="email"
            readOnly
            value={user?.email || 'guest@tryhowwespeak.com'}
            className="input-field"
            style={{ background: 'var(--cream)', cursor: 'not-allowed', fontSize: 13.5 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
            Preferred First Name or Nickname
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field"
            style={{ background: '#FFF', fontSize: 13.5 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
            Communication style (from Quiz)
          </label>
          <div style={{
            background: 'var(--blush-soft)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--burgundy)',
            fontSize: 13.5,
            color: 'var(--charcoal)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span><strong>{profile?.archetype || 'Reflective'}</strong></span>
            <a href="/quiz.html" style={{ fontSize: 12, color: 'var(--burgundy)', textDecoration: 'none', fontWeight: 600 }}>
              Retake Quiz ➔
            </a>
          </div>
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="btn btn-primary"
          style={{ width: 'fit-content', padding: '10px 22px', fontSize: 13.5 }}
        >
          {isUpdating ? 'Saving...' : 'Update Profile'}
        </button>
      </form>

      {/* 2. Email Confirmation Security Section */}
      <div className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Mail size={20} color="var(--burgundy)" />
            <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>Email Security & Verification</h2>
          </div>

          {/* Real Supabase verification badge */}
          {isEmailConfirmed ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#e6f8ee',
                color: '#1b8744',
                border: '1px solid #b7ebd0',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
              }}
              id="email-verified-badge"
            >
              <CheckCircle2 size={15} />
              Email Verified
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fff8ea',
                color: '#a66908',
                border: '1px solid #fce3b8',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
              }}
              id="email-pending-badge"
            >
              <AlertCircle size={15} />
              Verification Pending
            </span>
          )}
        </div>

        <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
          {isEmailConfirmed
            ? `Your primary email address (${user?.email}) is officially verified and secured with Supabase Auth.`
            : `Your email address (${user?.email}) has not been verified yet. Please check your inbox for the activation link or click below to request a new confirmation email.`}
        </p>

        {emailStatusMsg && (
          <div
            style={{
              background: emailStatusMsg.type === 'error' ? '#fde8e8' : 'var(--cream)',
              color: emailStatusMsg.type === 'error' ? '#9b1c1c' : 'var(--burgundy-dark)',
              border: emailStatusMsg.type === 'error' ? '1px solid #f8b4b4' : '1px solid var(--gold)',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {emailStatusMsg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{emailStatusMsg.text}</span>
          </div>
        )}

        {/* Resend confirmation button if unverified */}
        {!isEmailConfirmed && (
          <div>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendingEmail || resendCooldown > 0}
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: '9px 18px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <RefreshCw size={14} style={{ animation: resendingEmail ? 'spin 1s linear infinite' : 'none' }} />
              {resendingEmail
                ? 'Sending confirmation...'
                : resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : 'Resend Confirmation Email'}
            </button>
          </div>
        )}

        {/* Update Email Form */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: 'var(--charcoal)' }}>
            Change Email Address
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 12 }}>
            Updating your email address sends a verification link to your new address. Both email addresses may receive security notifications before the change is finalized.
          </p>

          <form onSubmit={handleUpdateEmail} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 520 }}>
            <input
              type="email"
              required
              placeholder="new.email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input-field"
              style={{ flex: 1, minWidth: 220, fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={isUpdatingEmail || !newEmail.trim()}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: 13 }}
            >
              {isUpdatingEmail ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Authenticator Security (TOTP MFA) Section */}
      <div className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Smartphone size={20} color="var(--gold)" />
            <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>Authenticator Security (2FA)</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {loadingFactors && (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--gray)' }} />
            )}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: hasActiveMfa ? '#e6f8ee' : '#f5f5f5',
                color: hasActiveMfa ? '#1b8744' : '#666',
                border: hasActiveMfa ? '1px solid #b7ebd0' : '1px solid var(--border)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
              }}
              id="mfa-status-badge"
            >
              {hasActiveMfa ? <ShieldCheck size={15} /> : <Lock size={14} />}
              {hasActiveMfa ? (mfaAssuranceLevel === 'aal2' ? '2FA Active (AAL2)' : '2FA Enrolled') : '2FA Disabled'}
            </span>
          </div>
        </div>

        <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
          Protect your account with a time-based one-time password (TOTP) from an authenticator app such as Google Authenticator, 1Password, Apple Passwords, or Authy.
        </p>

        {mfaError && (
          <div style={{
            background: '#fde8e8',
            color: '#9b1c1c',
            border: '1px solid #f8b4b4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={15} />
            <span>{mfaError}</span>
          </div>
        )}

        {mfaSuccess && (
          <div style={{
            background: '#e6f8ee',
            color: '#1b8744',
            border: '1px solid #b7ebd0',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle2 size={15} />
            <span>{mfaSuccess}</span>
          </div>
        )}

        {/* Enrolled factors list */}
        {hasActiveMfa && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
              Enrolled Factors
            </div>

            {verifiedFactors.map((factor) => (
              <div
                key={factor.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--cream)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--burgundy)',
                  }}>
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                      {factor.friendly_name || 'TOTP Authenticator App'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                      Added {new Date(factor.created_at).toLocaleDateString()} • Factor ID: {factor.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnenrollFactor(factor.id)}
                  disabled={unrollingId === factor.id}
                  className="btn btn-secondary"
                  style={{
                    fontSize: 12.5,
                    padding: '7px 14px',
                    color: '#c0392b',
                    borderColor: '#f5c6cb',
                  }}
                >
                  <Trash2 size={13} />
                  {unrollingId === factor.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Enrollment Wizard / QR Code Display */}
        {isEnrolling && enrollData ? (
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--gold)',
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={20} color="var(--gold)" />
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>Enroll New Authenticator App</h3>
            </div>

            <ol style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6, paddingLeft: 20, margin: 0 }}>
              <li>Open your authenticator app (e.g. Google Authenticator, 1Password, Apple Passwords).</li>
              <li>Scan the QR code below or manually type the secret key into your app.</li>
              <li>Enter the 6-digit code shown in your app to confirm enrollment.</li>
            </ol>

            {/* QR Code and Secret */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
              {/* QR Code */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {enrollData.qr_code.startsWith('data:') ? (
                  <img
                    src={enrollData.qr_code}
                    alt="Authenticator QR Code"
                    style={{ width: 170, height: 170, display: 'block' }}
                  />
                ) : (
                  <div
                    dangerouslySetInnerHTML={{ __html: enrollData.qr_code }}
                    style={{ width: 170, height: 170 }}
                  />
                )}
              </div>

              {/* Secret Key with 1-click Copy */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)' }}>
                  Manual Secret Key
                </span>
                <code
                  style={{
                    background: 'var(--cream)',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    color: 'var(--charcoal)',
                  }}
                >
                  {enrollData.secret}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopySecret(enrollData.secret)}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: '6px 12px', width: 'fit-content' }}
                >
                  {copiedSecret ? <Check size={13} color="#27ae60" /> : <Copy size={13} />}
                  {copiedSecret ? 'Secret Copied!' : 'Copy Secret Key'}
                </button>
              </div>
            </div>

            {/* Verification Code Form */}
            <form onSubmit={handleVerifyEnrollment} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--charcoal)' }}>
                Enter 6-Digit Code from Authenticator
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field"
                  style={{ width: 140, textAlign: 'center', fontSize: 18, letterSpacing: '0.25em', fontWeight: 600 }}
                />
                <button
                  type="submit"
                  disabled={verifyingMfa || verificationCode.length < 6}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: 13.5 }}
                >
                  {verifyingMfa ? 'Verifying...' : 'Verify & Activate'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEnrollment}
                  className="btn btn-secondary"
                  style={{ padding: '10px 16px', fontSize: 13.5 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {!hasActiveMfa && (
              <button
                type="button"
                onClick={handleStartEnrollment}
                className="btn btn-primary"
                style={{ fontSize: 13.5, padding: '10px 22px' }}
              >
                <Smartphone size={15} />
                Set Up Authenticator (2FA)
              </button>
            )}
          </div>
        )}

        {/* Security & Recovery Notice */}
        <div
          style={{
            background: 'var(--cream)',
            border: '1px solid rgba(26, 26, 26, 0.08)',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            fontSize: 12.5,
            color: 'var(--charcoal-muted)',
            lineHeight: 1.5,
          }}
        >
          <HelpCircle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 2 }}>
              Account Recovery Notice
            </strong>
            Always keep access to your authenticator application. If you lose your authenticator device, you will need administrative identity verification to regain account access.
          </div>
        </div>
      </div>

      {/* 4. Plan & Entitlements Section */}
      <div className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={20} color="var(--gold)" />
          <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>Subscription & Digital Guides</h2>
        </div>

        <div style={{
          background: hasBundle ? 'var(--gold-subtle)' : 'var(--cream)',
          border: hasBundle ? '1.5px solid var(--gold)' : '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--burgundy)' }}>
              {hasBundle ? 'Complete Bundle Access' : 'Free Trial Status'}
            </span>
            <span className={`badge ${hasBundle ? 'badge-gold' : 'badge-blush'}`}>
              {hasBundle ? 'Unlimited' : '3 Rehearsals Allowance'}
            </span>
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
            {hasBundle
              ? 'You have unlocked full lifetime access to all 4 communication guides and unlimited AI conversation rehearsals.'
              : 'Your free trial includes up to 3 individual conversation rehearsals and 1 couples reflection exercise.'}
          </p>

          {!hasBundle && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
              <a
                href="https://themindly.gumroad.com/l/howwespeak-bundle"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                <span>Upgrade to Complete Bundle ($97)</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Owned Products Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
            Owned Guides & Entitlements
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {['bundle', 'men-edition', 'women-edition', 'script-collection'].map((key) => {
              const owned = hasBundle || ownedKeys.includes(key as any)
              return (
                <div
                  key={key}
                  style={{
                    background: '#FFF',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: owned ? '1.5px solid #2ecc71' : '1px solid var(--border)',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{key.replace(/-/g, ' ')}</span>
                  {owned ? (
                    <span style={{ color: '#27ae60', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={13} /> Active
                    </span>
                  ) : (
                    <span style={{ color: 'var(--gray)' }}>Not Owned</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. Security, Password & Sign Out */}
      <div className="card-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="var(--burgundy)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>End-to-End Privacy</div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                Your conversation rehearsals are private to you and protected by PostgreSQL RLS.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                if (user?.email) {
                  const res = await resetPassword(user.email)
                  if (!res.error) setResetSent(true)
                  else alert(res.error)
                }
              }}
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: '8px 16px' }}
            >
              <Key size={14} />
              {resetSent ? 'Password Link Sent!' : 'Send Password Reset'}
            </button>

            <button
              onClick={signOut}
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: '8px 16px' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c0392b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={15} />
              Danger Zone — Account Deletion
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              Permanently delete your profile, conversation history, memories, and private reflections.
            </div>
          </div>

          <button
            onClick={async () => {
              const confirmMsg = "Are you sure you want to permanently delete your TryHowWeSpeak account? All your conversations, rehearsal plans, and private reflections will be permanently removed. This action cannot be undone."
              if (window.confirm(confirmMsg)) {
                setIsDeleting(true)
                const res = await deleteAccount()
                setIsDeleting(false)
                if (res.error) {
                  alert(res.error)
                } else {
                  alert("Your account and private data have been completely deleted.")
                  window.location.href = '/'
                }
              }
            }}
            disabled={isDeleting}
            style={{
              background: '#fff0f0',
              color: '#c0392b',
              border: '1px solid #f5c6cb',
              padding: '8px 16px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
