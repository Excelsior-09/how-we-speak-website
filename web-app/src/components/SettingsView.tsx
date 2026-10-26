// ==============================================================================
// HOW WE SPEAK — ACCOUNT SETTINGS & ENTITLEMENTS VIEW
// Route: /app/settings
// Features: Profile info, conflict archetype, real usage quota, privacy controls
// ==============================================================================

import React, { useState } from 'react'
import {
  User,
  Shield,
  CreditCard,
  LogOut,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

export const SettingsView: React.FC = () => {
  const { user, profile, entitlements, signOut, isConfigured, refreshUserData } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const hasBundle = entitlements.some((e) => e.product_key === 'bundle')
  const ownedKeys = entitlements.map((e) => e.product_key)

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 800 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-burgundy">Account Settings</span>
          <span className="badge badge-gold">Security & Privacy</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', marginBottom: 8 }}>
          Settings & Entitlements
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 16 }}>
          Manage your account profile, review your digital product entitlements, and control your private relationship data.
        </p>
      </div>

      {statusMessage && (
        <div style={{
          background: 'var(--cream)',
          border: '1px solid var(--gold)',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--charcoal)',
        }}>
          {statusMessage}
        </div>
      )}

      {/* Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={20} color="var(--burgundy)" />
          <h2 style={{ fontSize: 20 }}>Profile Information</h2>
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

      {/* Plan & Entitlements Section */}
      <div className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={20} color="var(--gold)" />
          <h2 style={{ fontSize: 20 }}>Subscription & Digital Guides</h2>
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

      {/* Security & Sign Out */}
      <div className="card-glass" style={{ padding: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={20} color="var(--burgundy)" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>End-to-End Privacy</div>
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>
              Your conversation rehearsals are private to you and protected by PostgreSQL RLS.
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="btn btn-secondary"
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          <LogOut size={14} />
          Sign Out of Account
        </button>
      </div>
    </div>
  )
}
