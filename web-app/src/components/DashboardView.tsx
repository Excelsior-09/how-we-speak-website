// ==============================================================================
// HOW WE SPEAK — AUTHENTICATED DASHBOARD VIEW
// Route: /app
// Features: Welcome message, Start Rehearsal CTA, Recent Saved Plans,
//           Real trial/usage allowance, Links to Gumroad guides
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  HeartHandshake,
  UserPlus,
  ShieldAlert,
  ArrowRight,
  BookOpen,
  Clock,
  Activity,
  CheckCircle,
  ExternalLink,
  History
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'
import type { RehearsalPlan } from '../types/database'

interface DashboardViewProps {
  onNavigate?: (tab: string) => void
  userArchetype?: string
  partnerLinked?: boolean
  onInvitePartner?: () => void
}

const GUMROAD_PRODUCTS = [
  {
    key: 'bundle',
    title: 'The Complete Bundle',
    price: '$97',
    desc: 'All 4 Guides + Unlimited Workspace access',
    url: 'https://themindly.gumroad.com/l/howwespeak-bundle',
    badge: 'Best Value',
  },
  {
    key: 'men-edition',
    title: 'Men Edition Guide',
    price: '$37',
    desc: 'For women who want to decode men’s silence & shutdown',
    url: 'https://themindly.gumroad.com/l/How-We-Speak-Men-Edition',
  },
  {
    key: 'women-edition',
    title: 'Women Edition Guide',
    price: '$37',
    desc: 'For men who want to understand women’s emotional bids',
    url: 'https://themindly.gumroad.com/l/howwespeak-women',
  },
  {
    key: 'script-collection',
    title: '75+ Script Collection',
    price: '$27',
    desc: 'Ready-to-use conflict de-escalation scripts',
    url: 'https://themindly.gumroad.com/l/howwespeak-scripts',
  },
]

export const DashboardView: React.FC<DashboardViewProps> = () => {
  const { user, profile, activeSpace, entitlements, isConfigured } = useAuth()
  const { navigate } = useRouter()
  const [recentPlans, setRecentPlans] = useState<RehearsalPlan[]>([])
  const [usageCount, setUsageCount] = useState<number>(0)

  const partnerLinked = !!(activeSpace?.partner_2_id)
  const userArchetype = profile?.archetype || 'Avoider'
  const hasBundle = entitlements.some((e) => e.product_key === 'bundle' || e.product_key === 'workspace-pro')
  const ownedKeys = entitlements.map((e) => e.product_key)

  useEffect(() => {
    async function fetchRecentPlansAndUsage() {
      if (user && isConfigured) {
        try {
          // Fetch top 3 recent plans
          const { data: plans } = await supabase
            .from('rehearsal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)

          if (plans) setRecentPlans(plans as RehearsalPlan[])

          // Fetch usage count
          const { count } = await supabase
            .from('usage_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'ai_rehearsal')

          if (typeof count === 'number') setUsageCount(count)
        } catch (err) {
          console.warn('Dashboard fetch error:', err)
        }
      } else {
        const local = JSON.parse(localStorage.getItem('hws_saved_plans') || '[]')
        setRecentPlans(local.slice(0, 3))
      }
    }

    fetchRecentPlansAndUsage()
  }, [user, isConfigured])

  const trialRemaining = Math.max(0, 3 - usageCount)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* 1. Welcome Banner */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(245, 243, 240, 0.95) 0%, rgba(232, 204, 200, 0.35) 50%, rgba(250, 250, 248, 0.95) 100%)',
        border: '1px solid rgba(232, 204, 200, 0.6)',
        borderRadius: 'var(--radius-card)',
        padding: '36px 40px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24,
      }}>
        <div style={{ maxWidth: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className="badge badge-burgundy">Encrypted Sanctuary</span>
            <span className="badge badge-gold">
              {profile?.display_name ? `Welcome back, ${profile.display_name}` : 'How We Speak Member'}
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: 12 }}>
            Prepare, de-escalate, and connect.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--gray)', lineHeight: 1.6 }}>
            Your private relationship communication studio. Rehearse difficult conversations before you initiate, de-escalate raw drafts, and coordinate with your partner.
          </p>
        </div>

        {/* 2. Start Conversation Rehearsal CTA */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app/rehearse')}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: 15 }}
          >
            <Sparkles size={16} />
            Start Conversation Rehearsal
          </button>
          {!partnerLinked && (
            <button
              onClick={() => navigate('/app/workspace')}
              className="btn btn-blush"
              style={{ padding: '14px 24px', fontSize: 15 }}
            >
              <UserPlus size={16} />
              Pair with Partner
            </button>
          )}
        </div>
      </section>

      {/* 3. Real Usage / Entitlement Allowance Banner */}
      <div style={{
        background: '#FFFFFF',
        border: hasBundle ? '1.5px solid var(--gold)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`badge ${hasBundle ? 'badge-gold' : 'badge-blush'}`}>
            {hasBundle ? 'Complete Bundle Access' : 'Free Trial Allowance'}
          </span>
          <span style={{ fontSize: 13.5, color: 'var(--charcoal)' }}>
            {hasBundle ? (
              <strong>Unlimited AI Rehearsals & Full Guide Access Active</strong>
            ) : (
              <span>
                <strong>{trialRemaining} of 3 free rehearsals</strong> remaining on this account.
              </span>
            )}
          </span>
        </div>

        {!hasBundle && (
          <a
            href="https://themindly.gumroad.com/l/howwespeak-bundle"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--burgundy)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Upgrade for Unlimited Access ➔
          </a>
        )}
      </div>

      {/* 4. Recent Saved Plans Section */}
      <section className="card-glass" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="var(--burgundy)" />
            <h2 style={{ fontSize: 20 }}>Recent Saved Plans</h2>
          </div>
          <button
            onClick={() => navigate('/app/history')}
            className="btn btn-ghost"
            style={{ fontSize: 13 }}
          >
            <span>View All Plans</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentPlans.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--gray)', fontSize: 14 }}>
            No saved conversation plans yet.{' '}
            <button
              onClick={() => navigate('/app/rehearse')}
              style={{ background: 'none', border: 'none', color: 'var(--burgundy)', fontWeight: 600, cursor: 'pointer' }}
            >
              Start your first rehearsal ➔
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {recentPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate(`/app/history/${plan.id}`)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)',
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-burgundy" style={{ fontSize: 10.5 }}>
                    {plan.communication_goal?.replace(/-/g, ' ')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: 16 }}>{plan.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--charcoal-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{plan.chosen_script.slice(0, 95)}..."
                </p>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--burgundy)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Open Plan <ArrowRight size={12} />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3-Column Diagnostic & Clinical Rules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
      }}>
        {/* Card 1: User Archetype */}
        <div className="card-glass" style={{ padding: 30, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--burgundy)' }}>
              Diagnostic Profile
            </span>
            <span style={{ fontSize: 24 }}>🤐</span>
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>The {userArchetype}</h2>
          <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 20, flex: 1 }}>
            When emotional temperature rises, your nervous system tends to protect itself by withholding words to prevent catastrophic escalation.
          </p>
          <div style={{
            background: 'var(--cream)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--charcoal-muted)',
            borderLeft: '3px solid var(--burgundy)',
          }}>
            <strong>Today's Growth Edge:</strong> Name one minor feeling out loud before rehearsing it to perfection.
          </div>
          <a
            href="/quiz.html"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--burgundy)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              marginTop: 'auto',
            }}
          >
            Retake Archetype Assessment <ArrowRight size={14} />
          </a>
        </div>

        {/* Card 2: Partner & Workspace Status */}
        <div className="card-glass" style={{ padding: 30, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)' }}>
              Couples Room Status
            </span>
            <HeartHandshake size={24} color="var(--gold)" />
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>
            {partnerLinked ? 'Active Partnership' : 'Single User Mode'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 20, flex: 1 }}>
            {partnerLinked
              ? 'Your workspace is synchronized with your partner. Shared repair exercises and translated drafts are active.'
              : 'You are currently practicing individually. You can generate a private cryptographic link to invite your partner anytime.'}
          </p>
          <div style={{
            background: partnerLinked ? 'var(--gold-subtle)' : 'var(--blush-soft)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--charcoal)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Activity size={16} color={partnerLinked ? 'var(--gold)' : 'var(--burgundy)'} />
            <span>{partnerLinked ? 'Both profiles connected' : 'Awaiting partner pairing'}</span>
          </div>
          <button
            onClick={() => navigate('/app/workspace')}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Manage Couples Room</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 3: Clinical Protocol in Practice */}
        <div className="card-glass" style={{ padding: 30, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--burgundy)' }}>
              Clinical Framework
            </span>
            <Clock size={22} color="var(--burgundy)" />
          </div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>The 20-Minute Rule</h2>
          <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 20, flex: 1 }}>
            When heart rates exceed 100 BPM during conflict, the prefrontal cortex shuts down. Rational conversation is neurochemically impossible until 20 minutes of complete physiological soothing.
          </p>
          <div style={{
            background: 'var(--cream)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--charcoal-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <ShieldAlert size={16} color="var(--burgundy)" />
            <span>Never pursue or force a conversation while flooded.</span>
          </div>
          <button
            onClick={() => navigate('/app/scripts')}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span>Explore 75+ Repair Scripts</span>
            <BookOpen size={14} />
          </button>
        </div>
      </div>

      {/* 5. Links to Relevant Existing Guides & Products on Gumroad */}
      <section className="card-glass" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-gold">Library & Entitlements</span>
              <span className="badge badge-burgundy">One-Time Purchase</span>
            </div>
            <h2 style={{ fontSize: 24 }}>How We Speak Digital Guides & Access</h2>
            <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 680, marginTop: 4 }}>
              Existing ebooks are fulfilled directly on Gumroad. Purchases automatically provision access to full scripts and unlimited workspace sessions.
            </p>
          </div>

          <a
            href="https://themindly.gumroad.com/l/howwespeak-bundle"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: 13 }}
          >
            Get Complete Bundle ($97)
            <ExternalLink size={14} />
          </a>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18,
        }}>
          {GUMROAD_PRODUCTS.map((prod) => {
            const isOwned = hasBundle || ownedKeys.includes(prod.key as any)
            return (
              <div
                key={prod.key}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  border: isOwned ? '1.5px solid #2ecc71' : '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 17 }}>{prod.title}</h3>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--burgundy)' }}>
                    {prod.price}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--gray)', flex: 1 }}>{prod.desc}</p>

                {isOwned ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#27ae60', fontWeight: 600 }}>
                    <CheckCircle size={15} />
                    <span>Unlocked & Active</span>
                  </div>
                ) : (
                  <a
                    href={prod.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '7px 12px', justifyContent: 'space-between' }}
                  >
                    <span>Purchase on Gumroad</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
