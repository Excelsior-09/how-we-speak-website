// ==============================================================================
// HOW WE SPEAK — PREMIUM GLOBAL NAVIGATION
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Nav Items: Home, Practice a Conversation, My Conversations, My Partner, Guides
// Destinations: /app, /app/rehearse, /app/history, /app/workspace, /app/scripts
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  MessageSquare,
  BookOpen,
  LogIn,
  LogOut,
  ExternalLink,
  History,
  Settings,
  Menu,
  X,
  HeartHandshake,
  ChevronDown,
  CreditCard
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'

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
  const { user, profile, signOut, entitlements, isConfigured } = useAuth()
  const { route, navigate } = useRouter()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [usageCount, setUsageCount] = useState<number>(0)
  const [loadingUsage, setLoadingUsage] = useState<boolean>(true)

  const accountMenuRef = useRef<HTMLDivElement>(null)

  const isPro = entitlements.some(
    (e) => e.product_key === 'bundle' || e.product_key === 'workspace-pro'
  )

  // Fetch real trial usage from Supabase
  useEffect(() => {
    let isMounted = true

    async function fetchUsage() {
      if (user && isConfigured) {
        try {
          const { count } = await supabase
            .from('usage_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'ai_rehearsal')

          if (isMounted && typeof count === 'number') {
            setUsageCount(count)
          }
        } catch {
          // Gracefully keep fallback
        } finally {
          if (isMounted) setLoadingUsage(false)
        }
      } else {
        if (isMounted) setLoadingUsage(false)
      }
    }

    fetchUsage()
    return () => {
      isMounted = false
    }
  }, [user, isConfigured])

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [accountMenuOpen])

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        setAccountMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  const trialRemaining = Math.max(0, 3 - usageCount)

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
    navigate(path)
  }

  const displayName = profile?.display_name || (userEmail ? userEmail.split('@')[0] : 'Member')

  const navItems = [
    { label: 'Home', path: '/app', active: route === 'dashboard', icon: Sparkles },
    { label: 'Practice a Conversation', path: '/app/rehearse', active: route === 'rehearse', icon: MessageSquare },
    { label: 'My Conversations', path: '/app/history', active: route === 'history' || route === 'history-detail', icon: History },
    { label: 'My Partner', path: '/app/workspace', active: route === 'workspace', icon: HeartHandshake, badge: partnerLinked },
    { label: 'Guides', path: '/app/scripts', active: route === 'scripts', icon: BookOpen },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(26, 26, 26, 0.08)',
        transition: 'all var(--transition-normal)',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 24px',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <a
            href="/app"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('/app')
            }}
            aria-label="How We Speak Workspace Home"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: 12,
            }}
          >
            <img
              src="https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png"
              alt="How We Speak"
              style={{ height: 36, width: 'auto', display: 'block' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 21,
                fontWeight: 600,
                color: 'var(--charcoal)',
                letterSpacing: '-0.01em',
              }}
            >
              How We Speak
            </span>
          </a>
        </div>

        {/* Desktop Navigation Links (>= 1024px) */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13.5,
                  fontWeight: item.active ? 600 : 500,
                  color: item.active ? 'var(--burgundy)' : 'var(--charcoal)',
                  background: item.active ? 'var(--burgundy-subtle)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                }}
                onMouseOver={(e) => {
                  if (!item.active) e.currentTarget.style.background = 'var(--cream)'
                }}
                onMouseOut={(e) => {
                  if (!item.active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon
                  size={15}
                  color={item.active ? 'var(--burgundy)' : 'var(--gray)'}
                  strokeWidth={item.active ? 2.2 : 1.8}
                />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    title="Partner Connected"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--gold)',
                      marginLeft: 2,
                    }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Desktop Right Controls (Account, Trial, Main Site) */}
        <div
          className="desktop-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {isAuthenticated ? (
            <>
              {/* Talk to Mira Quick Companion Button */}
              <button
                onClick={() => handleNavClick('/app/mira')}
                title="Open Mira Relationship AI Companion"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: route === 'mira' ? 'var(--burgundy)' : 'var(--burgundy-subtle)',
                  color: route === 'mira' ? '#FFFFFF' : 'var(--burgundy)',
                  border: '1px solid rgba(196, 30, 58, 0.25)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Sparkles size={13} />
                <span>Talk to Mira</span>
              </button>

              {/* Compact, unobtrusive trial indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 11px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 12,
                  fontWeight: 600,
                  background: isPro ? 'var(--gold-subtle)' : 'var(--cream)',
                  border: isPro ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid var(--border)',
                  color: isPro ? '#7D6310' : 'var(--charcoal)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isPro ? 'var(--gold)' : trialRemaining > 0 ? '#27ae60' : 'var(--burgundy)',
                  }}
                />
                <span>
                  {isPro
                    ? 'Plus'
                    : loadingUsage
                    ? 'Trial'
                    : trialRemaining > 0
                    ? `${trialRemaining} free left`
                    : 'Trial ended'}
                </span>
              </div>

              {/* Account Dropdown */}
              <div ref={accountMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  aria-expanded={accountMenuOpen}
                  aria-label="User account menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--surface-tint)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '5px 12px 5px 6px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--charcoal)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)')}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'var(--blush)',
                      color: 'var(--burgundy-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <ChevronDown size={13} color="var(--gray)" />
                </button>

                {accountMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: 210,
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '8px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      zIndex: 110,
                      animation: 'fadeIn 0.15s ease-out',
                    }}
                  >
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{displayName}</div>
                      {userEmail && (
                        <div style={{ fontSize: 11.5, color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {userEmail}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleNavClick('/app/settings')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        color: 'var(--charcoal)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Settings size={14} color="var(--gray)" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('/app/settings')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        color: 'var(--charcoal)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <CreditCard size={14} color="var(--gray)" />
                      <span>Billing & Plans</span>
                    </button>

                    <a
                      href="/"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        color: 'var(--charcoal)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExternalLink size={14} color="var(--gray)" />
                        <span>Main Website</span>
                      </span>
                    </a>

                    <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />

                    <button
                      onClick={() => {
                        setAccountMenuOpen(false)
                        signOut()
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        color: 'var(--burgundy)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--blush-soft)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={14} color="var(--burgundy)" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: 13 }}
            >
              <LogIn size={14} />
              Sign In
            </button>
          )}

          <a
            href="/"
            title="Return to How We Speak Main Website"
            className="main-site-link"
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: 'var(--gray)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              padding: '6px 8px',
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

        {/* Mobile / Tablet Menu Button (< 1024px) */}
        <div className="mobile-toggle-wrapper" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
          {isAuthenticated && (
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: isPro ? '#7D6310' : 'var(--charcoal)',
                background: isPro ? 'var(--gold-subtle)' : 'var(--cream)',
                padding: '4px 9px',
                borderRadius: 'var(--radius-pill)',
                border: isPro ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid var(--border)',
              }}
            >
              {isPro ? 'Plus' : `${trialRemaining} left`}
            </span>
          )}

          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            aria-expanded={mobileMenuOpen}
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: '#FFFFFF',
              color: 'var(--charcoal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer & Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="nav-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            className="nav-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Drawer Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 20,
                borderBottom: '1px solid var(--border)',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="https://i.ibb.co/hR2KXFd4/Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png"
                  alt="How We Speak"
                  style={{ height: 32, width: 'auto' }}
                />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>
                  How We Speak
                </span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--charcoal)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* User status card if logged in */}
            {isAuthenticated && (
              <div
                style={{
                  background: 'var(--surface-tint)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginBottom: 20,
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--blush)',
                      color: 'var(--burgundy-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--charcoal)' }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                      {isPro ? 'Plus Plan • Unlimited' : `${trialRemaining} free practice sessions left`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 15,
                      fontWeight: item.active ? 600 : 500,
                      color: item.active ? 'var(--burgundy)' : 'var(--charcoal)',
                      background: item.active ? 'var(--burgundy-subtle)' : 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                      minHeight: 46,
                    }}
                  >
                    <Icon
                      size={18}
                      color={item.active ? 'var(--burgundy)' : 'var(--gray)'}
                      strokeWidth={item.active ? 2.2 : 1.8}
                    />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'var(--gold-subtle)',
                          color: '#7D6310',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        Linked
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer / Account Actions */}
            <div
              style={{
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
                marginTop: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => handleNavClick('/app/mira')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--burgundy)',
                      background: 'var(--burgundy-subtle)',
                      border: '1px solid rgba(196, 30, 58, 0.2)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Sparkles size={16} color="var(--burgundy)" />
                    <span>Talk to Mira</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('/app/settings')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      color: 'var(--charcoal)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Settings size={16} color="var(--gray)" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('/app/settings')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      color: 'var(--charcoal)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <CreditCard size={16} color="var(--gray)" />
                    <span>Billing & Plans</span>
                  </button>

                  <a
                    href="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      color: 'var(--charcoal)',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={16} color="var(--gray)" />
                    <span>Return to Main Site</span>
                  </a>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 14,
                      color: 'var(--burgundy)',
                      background: 'var(--blush-soft)',
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: 8,
                      fontWeight: 600,
                    }}
                  >
                    <LogOut size={16} color="var(--burgundy)" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenAuth()
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: 14 }}
                >
                  <LogIn size={15} />
                  Sign In to Workspace
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Responsive Media Query Styles */}
      <style>{`
        @media (max-width: 1023px) {
          .desktop-nav,
          .desktop-controls {
            display: none !important;
          }
          .mobile-toggle-wrapper {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .mobile-toggle-wrapper {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
