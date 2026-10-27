// ==============================================================================
// TRYHOWWESPEAK — DEDICATED SIGN-UP CONFIRMATION PAGE
// Brand Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Route: /app/confirm-email
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Inbox,
  HelpCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRouter } from '../lib/useRouter'

interface ConfirmEmailViewProps {
  email?: string
  onOpenSignIn?: () => void
}

export const ConfirmEmailView: React.FC<ConfirmEmailViewProps> = ({
  email: propEmail,
  onOpenSignIn
}) => {
  const { navigate } = useRouter()
  const [email, setEmail] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [cooldown, setCooldown] = useState<number>(0)

  // Extract email from query parameter or prop
  useEffect(() => {
    if (propEmail) {
      setEmail(propEmail)
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const qEmail = params.get('email')
      if (qEmail) {
        setEmail(qEmail)
      }
    }
  }, [propEmail])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return

    setIsResending(true)
    setResendStatus('idle')
    setStatusMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/app/`,
        },
      })

      if (error) {
        setResendStatus('error')
        setStatusMessage(error.message || 'Unable to resend confirmation email. Please try again later.')
      } else {
        setResendStatus('success')
        setStatusMessage('A new verification email has been dispatched to your inbox.')
        setCooldown(60) // 60-second cooldown
      }
    } catch (err: any) {
      setResendStatus('error')
      setStatusMessage(err.message || 'Unexpected error occurred while resending. Please retry.')
    } finally {
      setIsResending(false)
    }
  }

  const handleGoToSignIn = () => {
    if (onOpenSignIn) {
      onOpenSignIn()
    } else {
      navigate('/app?auth=signin')
    }
  }

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '40px auto',
        padding: '0 16px',
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <div
        className="card-glass"
        style={{
          padding: '48px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 45px rgba(196, 30, 58, 0.08), 0 4px 16px rgba(0,0,0,0.04)',
          border: '1px solid rgba(196, 30, 58, 0.15)',
          borderRadius: 20,
          background: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative gold/burgundy accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, var(--burgundy) 0%, var(--gold) 50%, var(--burgundy) 100%)',
          }}
        />

        {/* Brand Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 28,
          }}
        >
          <img
            src="https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png"
            alt="TryHowWeSpeak Logo"
            style={{ height: 42, width: 'auto', display: 'block' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--charcoal)',
              letterSpacing: '-0.01em',
            }}
          >
            TryHowWeSpeak
          </span>
        </div>

        {/* Visual Email / Verification Badge with subtle animation */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cream) 0%, var(--blush) 100%)',
            border: '2px solid var(--gold)',
            color: 'var(--burgundy)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
            position: 'relative',
          }}
        >
          <Mail size={38} strokeWidth={1.8} />
          <div
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              background: 'var(--burgundy)',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            <CheckCircle2 size={15} />
          </div>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 700,
            color: 'var(--charcoal)',
            marginBottom: 12,
            fontFamily: 'var(--font-display)',
            lineHeight: 1.25,
          }}
        >
          Thank You for Joining TryHowWeSpeak!
        </h1>

        {/* Main Verification Message */}
        <p
          style={{
            fontSize: 15.5,
            color: 'var(--charcoal-muted)',
            lineHeight: 1.65,
            maxWidth: 520,
            margin: '0 auto 20px',
          }}
        >
          We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account.
        </p>

        {/* Recipient Email Pill */}
        {email && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--cream)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              padding: '8px 18px',
              borderRadius: 30,
              fontSize: 14,
              color: 'var(--charcoal)',
              fontWeight: 500,
              marginBottom: 28,
            }}
          >
            <Inbox size={16} color="var(--burgundy)" />
            <span>Verification email sent to:</span>
            <strong style={{ color: 'var(--burgundy-dark)' }}>{email}</strong>
          </div>
        )}

        {/* Status Feedback Banner */}
        {statusMessage && (
          <div
            style={{
              background: resendStatus === 'error' ? '#fde8e8' : 'var(--cream)',
              color: resendStatus === 'error' ? '#9b1c1c' : 'var(--burgundy-dark)',
              border: resendStatus === 'error' ? '1px solid #f8b4b4' : '1px solid var(--gold)',
              padding: '12px 16px',
              borderRadius: 10,
              fontSize: 13.5,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              animation: 'fadeIn 0.3s ease-out',
            }}
          >
            {resendStatus === 'error' ? (
              <AlertCircle size={16} color="#9b1c1c" />
            ) : (
              <CheckCircle2 size={16} color="var(--burgundy)" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 360,
            margin: '0 auto 32px',
          }}
        >
          {/* Sign In CTA */}
          <button
            onClick={handleGoToSignIn}
            className="btn btn-primary"
            style={{
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              borderRadius: 10,
              boxShadow: '0 4px 14px rgba(196, 30, 58, 0.25)',
            }}
          >
            <span>Proceed to Sign In</span>
            <ArrowRight size={16} />
          </button>

          {/* Resend Confirmation Email Button */}
          {email && (
            <button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              className="btn btn-secondary"
              style={{
                padding: '12px 20px',
                fontSize: 13.5,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                borderRadius: 10,
                background: '#FFFFFF',
                borderColor: 'var(--border)',
                cursor: (isResending || cooldown > 0) ? 'not-allowed' : 'pointer',
                opacity: cooldown > 0 ? 0.75 : 1,
              }}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: isResending ? 'spin 1s linear infinite' : 'none',
                }}
              />
              {isResending
                ? 'Dispatched confirmation...'
                : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : 'Resend confirmation email'}
            </button>
          )}
        </div>

        {/* Helpful Reminder Box (Spam / Junk Folder) */}
        <div
          style={{
            background: 'var(--cream)',
            border: '1px solid rgba(26, 26, 26, 0.08)',
            borderRadius: 12,
            padding: '18px 20px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              background: 'var(--blush-soft)',
              color: 'var(--burgundy)',
              padding: 8,
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            <HelpCircle size={18} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--charcoal-muted)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 2 }}>
              Didn't receive the email yet?
            </strong>
            Please check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. If you still don't see it after a couple of minutes, click the <em>Resend confirmation email</em> button above or verify you typed the correct address.
          </div>
        </div>

        {/* Trust & Privacy Note */}
        <div
          style={{
            marginTop: 24,
            fontSize: 12,
            color: 'var(--gray)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={14} color="var(--gold)" />
          <span>Protected by end-to-end Supabase Auth security. No sensitive credentials retained.</span>
        </div>
      </div>
    </div>
  )
}
