// ==============================================================================
// HOW WE SPEAK — LUXURY NAVIGATION BAR
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Routes: /app, /app/rehearse, /app/history, /app/workspace, /app/scripts, /app/settings
// ==============================================================================

import React from 'react'
import {
  Sparkles,
  Users,
  MessageSquareText,
  BookOpen,
  LogIn,
  LogOut,
  ExternalLink,
  ShieldCheck,
  History,
  Settings
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'

interface NavbarProps {
  onOpenAuth: () => void
  isAuthenticated: boolean
  userEmail?: string
  partnerLinked?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  isAuthenticated,
  userEmail,
  partnerLinked,
}) => {
  const { signOut, entitlements } = useAuth()
  const { route, navigate } = useRouter()

  const isPro = entitlements.some((e) => e.product_key === 'bundle' || e.product_key === 'workspace-pro')

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(250, 250, 248, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(26, 26, 26, 0.08)',
      padding: '12px 24px',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/app"
            onClick={(e) => {
              e.preventDefault()
              navigate('/app')
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: 10,
            }}
          >
            <img
              src="https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png"
              alt="How We Speak"
              style={{ height: 38, width: 'auto', display: 'block' }}
            />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 600,
              color: 'var(--charcoal)',
              letterSpacing: '-0.01em',
            }}>
              Workspace
            </span>
          </a>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--blush-soft)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--blush)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--burgundy-dark)',
          }}>
            <ShieldCheck size={13} color="var(--burgundy)" />
            Encrypted Vault
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app')}
            className={`btn ${route === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <Users size={14} />
            Dashboard
          </button>

          <button
            onClick={() => navigate('/app/rehearse')}
            className={`btn ${route === 'rehearse' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <Sparkles size={14} color={route === 'rehearse' ? '#FFF' : 'var(--gold)'} />
            Rehearsal Studio
          </button>

          <button
            onClick={() => navigate('/app/history')}
            className={`btn ${route === 'history' || route === 'history-detail' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <History size={14} />
            My Plans
          </button>

          <button
            onClick={() => navigate('/app/workspace')}
            className={`btn ${route === 'workspace' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <MessageSquareText size={14} />
            Couples Room
            {partnerLinked && (
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--gold)',
              }} />
            )}
          </button>

          <button
            onClick={() => navigate('/app/scripts')}
            className={`btn ${route === 'scripts' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            <BookOpen size={14} />
            Script Bank
          </button>
        </nav>

        {/* Right CTA / Auth Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${isPro ? 'badge-gold' : 'badge-blush'}`}>
                {isPro ? 'Complete Bundle' : 'Free Trial'}
              </span>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--cream)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 12,
                fontWeight: 500,
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#2ecc71',
                }} />
                {userEmail ? userEmail.split('@')[0] : 'Member'}
              </div>

              <button
                onClick={() => navigate('/app/settings')}
                title="Account Settings"
                className={`btn ${route === 'settings' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 10px', fontSize: 12 }}
              >
                <Settings size={14} />
              </button>

              <button
                onClick={signOut}
                title="Sign Out"
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: 12, color: 'var(--gray)' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              <LogIn size={14} />
              Sign In
            </button>
          )}

          <a
            href="/"
            title="Return to How We Speak Main Website"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--gray)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--charcoal)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--gray)')}
          >
            Main Site
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </header>
  )
}

