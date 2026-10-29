// ==============================================================================
// HOW WE SPEAK — CORE AI APPLICATION ENTRYPOINT
// Brand Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Routes: /app, /app/rehearse, /app/history, /app/history/:id, /app/settings, /app/workspace, /app/scripts
// ==============================================================================

import { useState, useEffect } from 'react'
import { RouterProvider } from './lib/router'
import { useRouter } from './lib/useRouter'
import { Navbar } from './components/Navbar'
import { DashboardView } from './components/DashboardView'
import { RehearsalView } from './components/RehearsalView'
import { HistoryView } from './components/HistoryView'
import { PlanDetailView } from './components/PlanDetailView'
import { SettingsView } from './components/SettingsView'
import { WorkspaceView } from './components/WorkspaceView'
import { ScriptsView } from './components/ScriptsView'
import { MiraView } from './components/MiraView'
import { ConfirmEmailView } from './components/ConfirmEmailView'
import { ResetPasswordView } from './components/ResetPasswordView'
import { MfaChallengeGate } from './components/MfaChallengeGate'
import { AuthModal } from './components/AuthModal'
import { useAuth } from './lib/useAuth'
import { Lock, LogIn, ArrowRight } from 'lucide-react'

function AuthRequiredGate({ title, onSignIn }: { title: string; onSignIn: () => void }) {
  return (
    <div className="card-glass animate-fade-in" style={{
      maxWidth: 580,
      margin: '60px auto',
      padding: '48px 40px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
    }}>
      <div style={{
        width: 58,
        height: 58,
        borderRadius: 22,
        background: 'var(--blush-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--burgundy)',
      }}>
        <Lock size={26} />
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <span className="badge badge-neutral">Private to You</span>
        <span className="badge badge-burgundy">Member Access</span>
      </div>

      <h2 style={{ fontSize: 24, margin: '4px 0' }}>{title}</h2>

      <p style={{ color: 'var(--gray)', fontSize: 14.5, lineHeight: 1.6, maxWidth: 440 }}>
        Your conversation plans and partner reflections are completely private to your account. Sign in to view and continue your saved conversations.
      </p>

      <button
        onClick={onSignIn}
        className="btn btn-primary"
        style={{ padding: '12px 28px', fontSize: 14, marginTop: 8 }}
      >
        <LogIn size={15} />
        Sign In to Continue
        <ArrowRight size={14} />
      </button>
    </div>
  )
}

function AppContent() {
  const { route, params, navigate, returnTo, setReturnTo } = useRouter()
  const { user, activeSpace, mfaRequired, isPasswordRecovery } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const isAuthenticated = !!user && !mfaRequired
  const userEmail = user?.email
  const partnerLinked = !!(activeSpace?.partner_2_id)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      const authParam = searchParams.get('auth') || searchParams.get('mode')
      const hash = window.location.hash

      if (isPasswordRecovery || hash.includes('type=recovery') || searchParams.get('type') === 'recovery') {
        navigate('/app/reset-password', { replace: true })
        return
      }

      if (!user && (authParam === 'signup' || hash === '#signup')) {
        setAuthMode('signup')
        setIsAuthOpen(true)
      } else if (!user && (authParam === 'login' || authParam === 'signin' || hash === '#login')) {
        setAuthMode('signin')
        setIsAuthOpen(true)
      }
    }
  }, [user, isPasswordRecovery, navigate])

  const handleAuthSuccess = () => {
    setIsAuthOpen(false)
    if (returnTo) {
      const destination = returnTo
      setReturnTo(null)
      navigate(destination)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        partnerLinked={partnerLinked}
      />

      {/* Main Content Area */}
      <main className="main-app-container">
        {mfaRequired ? (
          !isPasswordRecovery && route !== 'reset-password' ? (
            <div className="animate-fade-in">
              <MfaChallengeGate
                onSuccess={() => {
                  if (returnTo) {
                    const dest = returnTo
                    setReturnTo(null)
                    navigate(dest)
                  }
                }}
                onCancel={() => {
                  setIsAuthOpen(true)
                  setAuthMode('signin')
                }}
              />
            </div>
          ) : (
            <div className="animate-fade-in">
              <ResetPasswordView
                onSignIn={() => {
                  setAuthMode('signin')
                  setIsAuthOpen(true)
                }}
              />
            </div>
          )
        ) : (
          <>
            {/* /app/reset-password — Dedicated Password Reset & Account Recovery */}
            {route === 'reset-password' && (
              <div className="animate-fade-in">
                <ResetPasswordView
                  onSignIn={() => {
                    setAuthMode('signin')
                    setIsAuthOpen(true)
                  }}
                />
              </div>
            )}

            {/* /app — Dashboard */}
            {route === 'dashboard' && (
              <div className="animate-fade-in">
                <DashboardView />
              </div>
            )}

            {/* /app/confirm-email — Dedicated Sign-Up Confirmation Page */}
            {route === 'confirm-email' && (
              <div className="animate-fade-in">
                <ConfirmEmailView
                  onOpenSignIn={() => {
                    setAuthMode('signin')
                    setIsAuthOpen(true)
                  }}
                />
              </div>
            )}

        {/* /app/mira — Mira AI Relationship Companion */}
        {route === 'mira' && (
          <div className="animate-fade-in">
            <MiraView
              onRequireAuth={(mode) => {
                setReturnTo('/app/mira')
                setAuthMode(mode || 'signin')
                setIsAuthOpen(true)
              }}
            />
          </div>
        )}

        {/* /app/rehearse — Conversation Rehearsal Studio */}
        {route === 'rehearse' && (
          <div className="animate-fade-in">
            <RehearsalView
              onRequireAuth={(ret) => {
                setReturnTo(ret || '/app/rehearse')
                setIsAuthOpen(true)
              }}
            />
          </div>
        )}

        {/* /app/history — Saved Conversation Plans */}
        {route === 'history' && (
          <div className="animate-fade-in">
            {isAuthenticated ? (
              <HistoryView />
            ) : (
              <AuthRequiredGate
                title="My Conversations"
                onSignIn={() => {
                  setReturnTo('/app/history')
                  setIsAuthOpen(true)
                }}
              />
            )}
          </div>
        )}

        {/* /app/history/:id — Individual Saved Plan */}
        {route === 'history-detail' && (
          <div className="animate-fade-in">
            {isAuthenticated ? (
              <PlanDetailView planId={params.id} />
            ) : (
              <AuthRequiredGate
                title="Conversation Plan Details"
                onSignIn={() => {
                  setReturnTo(window.location.pathname)
                  setIsAuthOpen(true)
                }}
              />
            )}
          </div>
        )}

        {/* /app/settings — Account Settings */}
        {route === 'settings' && (
          <div className="animate-fade-in">
            {isAuthenticated ? (
              <SettingsView />
            ) : (
              <AuthRequiredGate
                title="Account Settings & Entitlements"
                onSignIn={() => {
                  setReturnTo('/app/settings')
                  setIsAuthOpen(true)
                }}
              />
            )}
          </div>
        )}

        {/* /app/workspace — Couples Room */}
        {route === 'workspace' && (
          <div className="animate-fade-in">
            <WorkspaceView
              partnerLinked={partnerLinked}
              onTogglePartnerLink={() => {}}
              onRequireAuth={(mode) => {
                setReturnTo('/app/workspace')
                setAuthMode(mode || 'signin')
                setIsAuthOpen(true)
              }}
            />
          </div>
        )}

        {/* /app/scripts — De-escalation Scripts Bank */}
        {route === 'scripts' && (
          <div className="animate-fade-in">
            <ScriptsView />
          </div>
        )}
          </>
        )}
      </main>

      {/* Luxury Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--pure-white)',
        padding: '32px 24px',
        fontSize: 13,
        color: 'var(--gray)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <strong>How We Speak</strong> — Relationship Communication & Couples Workspace.
            <span style={{ marginLeft: 8, color: 'var(--burgundy)', fontWeight: 600 }}>
              Burgundy & Gold Protocol
            </span>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/" style={{ color: 'var(--gray)', textDecoration: 'none' }}>Home</a>
            <a href="/quiz" style={{ color: 'var(--gray)', textDecoration: 'none' }}>Quiz</a>
            <a href="/articles" style={{ color: 'var(--gray)', textDecoration: 'none' }}>Articles</a>
            <a href="/privacy-policy" style={{ color: 'var(--gray)', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: 'var(--gray)', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </footer>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  )
}

export default App
