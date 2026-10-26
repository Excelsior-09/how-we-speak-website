// ==============================================================================
// HOW WE SPEAK — AUTHENTICATED DASHBOARD VIEW
// Route: /app
// Features: Warm personal welcome, Mira companion quick-start, recent conversations,
//           "What would help today?" guided actions, visual ebook storefront with real covers,
//           and verified usage quotas.
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle,
  ExternalLink,
  History,
  HeartHandshake,
  Compass,
  MessageSquare,
  Send,
  ShieldAlert,
  Ear,
  HelpCircle
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'
import type { RehearsalPlan } from '../types/database'

interface DashboardViewProps {
  onNavigate?: (tab: string) => void
}

export const GUMROAD_PRODUCTS = [
  {
    key: 'bundle',
    title: 'The Complete Bundle',
    price: '$97',
    wasPrice: '$128',
    desc: 'All 4 Guides + Practice workspace access. Comprehensive blueprint for understanding each other.',
    url: 'https://themindly.gumroad.com/l/howwespeak-bundle',
    cover: 'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png',
    badge: 'Best Value',
    forWho: 'Couples wanting the complete framework'
  },
  {
    key: 'men-edition',
    title: 'Men Edition Guide',
    price: '$37',
    desc: 'Written for women. Explains why men go silent during conflict and what they need to open up.',
    url: 'https://themindly.gumroad.com/l/How-We-Speak-Men-Edition',
    cover: 'https://i.ibb.co/rffWKyGB/Chat-GPT-Image-Aug-5-2026-07-50-17-PM.png',
    forWho: 'For women understanding men’s shutdown'
  },
  {
    key: 'women-edition',
    title: 'Women Edition Guide',
    price: '$37',
    desc: 'Written for men. Explains why old arguments resurface and what she hears when you speak.',
    url: 'https://themindly.gumroad.com/l/howwespeak-women',
    cover: 'https://i.ibb.co/j9fk1Qq0/Chat-GPT-Image-Aug-6-2026-10-23-22-AM.png',
    forWho: 'For men understanding emotional bids'
  },
  {
    key: 'script-collection',
    title: '75+ Script Collection',
    price: '$27',
    desc: 'The words you have been searching for. Word-for-word scripts for every sensitive moment.',
    url: 'https://themindly.gumroad.com/l/howwespeak-scripts',
    cover: 'https://i.ibb.co/KxgzQmtY/Chat-GPT-Image-Aug-6-2026-11-17-13-AM.png',
    forWho: 'Ready-to-use communication phrases'
  },
]

const MIRA_QUICK_STARTERS = [
  "Help me understand why this conversation upset me.",
  "I need to bring up something difficult.",
  "Help me express a boundary without sounding harsh.",
  "We keep having the same argument.",
  "I want to understand my partner's perspective.",
  "Help me decide what to say next.",
]

export const DashboardView: React.FC<DashboardViewProps> = () => {
  const { user, profile, entitlements, isConfigured } = useAuth()
  const { navigate } = useRouter()
  const [recentPlans, setRecentPlans] = useState<RehearsalPlan[]>([])
  const [usageCount, setUsageCount] = useState<number>(0)
  const [loadingUsage, setLoadingUsage] = useState<boolean>(true)
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true)
  const [quickInput, setQuickInput] = useState('')

  const hasBundle = entitlements.some(
    (e) => e.product_key === 'bundle' || e.product_key === 'workspace-pro'
  )
  const ownedKeys = entitlements.map((e) => e.product_key)

  useEffect(() => {
    let isMounted = true

    async function fetchRecentPlansAndUsage() {
      if (user && isConfigured) {
        try {
          // Fetch up to 3 recent plans
          const { data: plans } = await supabase
            .from('rehearsal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)

          if (isMounted && plans) {
            setRecentPlans(plans as RehearsalPlan[])
          }

          // Fetch usage count for trial
          const { count } = await supabase
            .from('usage_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('action_type', 'ai_rehearsal')

          if (isMounted && typeof count === 'number') {
            setUsageCount(count)
          }
        } catch (err) {
          console.warn('Dashboard fetch error:', err)
        } finally {
          if (isMounted) {
            setLoadingPlans(false)
            setLoadingUsage(false)
          }
        }
      } else {
        const local = JSON.parse(localStorage.getItem('hws_saved_plans') || '[]')
        if (isMounted) {
          setRecentPlans(local.slice(0, 3))
          setLoadingPlans(false)
          setLoadingUsage(false)
        }
      }
    }

    fetchRecentPlansAndUsage()

    return () => {
      isMounted = false
    }
  }, [user, isConfigured])

  const trialRemaining = Math.max(0, 3 - usageCount)

  // Clean user display name: Never expose raw UUID
  const userGreetingName = profile?.display_name
    ? profile.display_name
    : user?.email
    ? user.email.split('@')[0]
    : ''

  const handleLaunchMiraWithPrompt = (promptText: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('hws_mira_prefill', promptText)
    }
    navigate('/app/mira')
  }

  const handleGuidedNextStep = (stepType: string) => {
    switch (stepType) {
      case 'feelings':
        handleLaunchMiraWithPrompt("Help me understand my feelings about what happened earlier today.")
        break
      case 'difficult':
        navigate('/app/rehearse')
        break
      case 'repair':
        handleLaunchMiraWithPrompt("We had an argument and things feel cold between us. How can we repair things?")
        break
      case 'boundary':
        handleLaunchMiraWithPrompt("I need to set a healthy personal boundary with my partner without sounding harsh.")
        break
      case 'listening':
        handleLaunchMiraWithPrompt("How can I listen to my partner without getting defensive when they are upset?")
        break
      case 'reconnect':
        navigate('/app/workspace')
        break
      default:
        navigate('/app/rehearse')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* SECTION A: WELCOME SECTION */}
      <section
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8F5 100%)',
          border: '1px solid rgba(26, 26, 26, 0.08)',
          borderRadius: 'var(--radius-card)',
          padding: '40px 44px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 28,
        }}
      >
        <div style={{ maxWidth: 660 }}>
          {userGreetingName ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--burgundy)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Welcome back, {userGreetingName}
            </div>
          ) : (
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--burgundy)', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Welcome to How We Speak
            </div>
          )}

          <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: 12, lineHeight: 1.25 }}>
            A little more understanding starts here.
          </h1>

          <p style={{ fontSize: 16, color: 'var(--gray)', lineHeight: 1.6, maxWidth: 600 }}>
            Talk through what is happening, find the right words, and take one practical step toward better communication.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
            {/* Primary CTA: Talk to Mira */}
            <button
              onClick={() => navigate('/app/mira')}
              className="btn btn-primary"
              style={{ padding: '13px 26px', fontSize: 15, gap: 8 }}
            >
              <Sparkles size={17} />
              <span>Talk to Mira</span>
            </button>

            {/* Secondary CTA: Practice a Conversation */}
            <button
              onClick={() => navigate('/app/rehearse')}
              className="btn btn-secondary"
              style={{ padding: '12px 24px', fontSize: 14.5, background: '#fff' }}
            >
              <MessageSquare size={16} />
              <span>Practice a Conversation</span>
            </button>

            {/* Smaller Link: Guides library */}
            <button
              onClick={() => navigate('/app/scripts')}
              className="btn btn-ghost"
              style={{ fontSize: 13.5, color: 'var(--charcoal)', padding: '10px 14px' }}
            >
              <BookOpen size={15} color="var(--gray)" />
              <span>Guides library</span>
            </button>
          </div>
        </div>

        {/* SECTION B: MEMBERSHIP AND USAGE ALLOWANCE */}
        <div
          style={{
            background: hasBundle ? 'var(--gold-subtle)' : '#FFFFFF',
            border: hasBundle ? '1px solid rgba(212, 175, 55, 0.35)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '22px 26px',
            minWidth: 260,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)' }}>
            Your Membership
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: hasBundle ? 'var(--gold)' : trialRemaining > 0 ? '#27ae60' : 'var(--burgundy)',
              }}
            />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)' }}>
              {hasBundle
                ? "You're on the Plus plan"
                : loadingUsage
                ? 'Loading allowance...'
                : trialRemaining === 3
                ? '3 free practice sessions left'
                : trialRemaining === 2
                ? '2 free practice sessions left'
                : trialRemaining === 1
                ? '1 free practice session left'
                : 'Your free access has ended'}
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '2px 0 8px', lineHeight: 1.45 }}>
            {hasBundle
              ? 'Unlimited access to Mira AI, guided rehearsals, and communication guides.'
              : 'Free practice sessions to prepare what you want to say with Mira.'}
          </p>

          {!hasBundle && (
            <a
              href="https://themindly.gumroad.com/l/howwespeak-bundle"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--burgundy)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 'auto',
              }}
            >
              <span>Unlock unlimited with Complete Bundle</span>
              <ArrowRight size={13} />
            </a>
          )}
        </div>
      </section>

      {/* SECTION B: MIRA QUICK-START SECTION */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(196, 30, 58, 0.03) 0%, rgba(212, 175, 55, 0.04) 100%), #FFFFFF',
          border: '1.5px solid rgba(196, 30, 58, 0.14)',
          borderRadius: 'var(--radius-card)',
          padding: '32px 36px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: 'var(--burgundy)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(196, 30, 58, 0.25)',
              flexShrink: 0
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: 'var(--charcoal)' }}>Meet Mira</h2>
                <span className="badge badge-burgundy" style={{ fontSize: 11 }}>Relationship Companion</span>
              </div>
              <p style={{ fontSize: 14.5, color: 'var(--charcoal-mid)', maxWidth: 660, lineHeight: 1.6, margin: 0 }}>
                Sometimes you know something feels wrong, but you don't know how to explain it. Start wherever you are. Mira will help you sort through the situation and work out what to do next.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/app/mira')}
            className="btn btn-secondary"
            style={{ fontSize: 13.5, padding: '9px 18px', gap: 6, background: '#fff' }}
          >
            <span>Open Mira Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Message Input for quick-start */}
        <div style={{
          display: 'flex',
          gap: 10,
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <input
            type="text"
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && quickInput.trim()) {
                handleLaunchMiraWithPrompt(quickInput.trim())
              }
            }}
            placeholder="Describe what's happening or what you want help talking about..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '8px 14px',
              fontSize: 14,
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={() => {
              if (quickInput.trim()) {
                handleLaunchMiraWithPrompt(quickInput.trim())
              }
            }}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: 13.5, borderRadius: 8, gap: 6 }}
          >
            <span>Ask Mira</span>
            <Send size={13} />
          </button>
        </div>

        {/* 6 Real Quick-Start Prompts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MIRA_QUICK_STARTERS.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleLaunchMiraWithPrompt(promptText)}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26, 26, 26, 0.1)',
                borderRadius: 20,
                padding: '7px 14px',
                fontSize: 12.5,
                color: 'var(--charcoal)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--burgundy)'
                e.currentTarget.style.color = 'var(--burgundy)'
                e.currentTarget.style.background = 'var(--blush-soft)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.1)'
                e.currentTarget.style.color = 'var(--charcoal)'
                e.currentTarget.style.background = '#FFFFFF'
              }}
            >
              <span>“{promptText}”</span>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION C: GUIDED NEXT STEP — "WHAT WOULD HELP TODAY?" */}
      <section>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 14 }}>
          What would help today?
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
          {[
            { id: 'feelings', label: 'Understand my feelings', icon: HelpCircle, desc: 'Sort through why something upset you' },
            { id: 'difficult', label: 'Prepare for a difficult talk', icon: MessageSquare, desc: 'Rehearse what to say and anticipate replies' },
            { id: 'repair', label: 'Repair things after an argument', icon: ShieldAlert, desc: 'Melt the distance and reconnect' },
            { id: 'boundary', label: 'Set a healthy boundary', icon: Compass, desc: 'Express your limits with warmth and clarity' },
            { id: 'listening', label: 'Listen without becoming defensive', icon: Ear, desc: 'Hold space without reactive counter-attacks' },
            { id: 'reconnect', label: 'Reconnect with my partner', icon: HeartHandshake, desc: 'Start a shared conversation in your workspace' },
          ].map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                onClick={() => handleGuidedNextStep(item.id)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--burgundy)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
                }}
              >
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--cream)',
                  color: 'var(--burgundy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--charcoal)', margin: '0 0 4px', lineHeight: 1.35 }}>
                    {item.label}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--gray)', margin: 0, lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION D: MY RECENT WORK */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: 32,
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={18} color="var(--burgundy)" />
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Your conversations</h2>
          </div>

          <button
            onClick={() => navigate('/app/history')}
            className="btn btn-ghost"
            style={{ fontSize: 13, color: 'var(--charcoal)', padding: '6px 12px' }}
          >
            <span>View all conversations</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loadingPlans ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--gray)', fontSize: 14 }}>
            Loading your conversations...
          </div>
        ) : recentPlans.length === 0 ? (
          /* EMPTY STATE */
          <div
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              background: 'var(--surface-tint)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--gray-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--blush-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--burgundy)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Your conversations will appear here when you save them.</h3>
            <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 480, lineHeight: 1.5, margin: 0 }}>
              Start with Mira or practice a conversation to prepare what you want to say.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => navigate('/app/mira')}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: 13.5 }}
              >
                Talk to Mira
              </button>
              <button
                onClick={() => navigate('/app/rehearse')}
                className="btn btn-secondary"
                style={{ padding: '10px 20px', fontSize: 13.5, background: '#fff' }}
              >
                Practice a Conversation
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {recentPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => navigate(`/app/history/${plan.id}`)}
                style={{
                  background: 'var(--surface-tint)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  transition: 'all var(--transition-fast)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.2)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                    {plan.communication_goal ? plan.communication_goal.replace(/-/g, ' ') : 'Conversation Plan'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{plan.title || 'Untitled Conversation'}</h3>

                <p style={{ fontSize: 13, color: 'var(--charcoal-muted)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                  {plan.chosen_script
                    ? `"${plan.chosen_script.slice(0, 110)}..."`
                    : plan.situation_raw?.slice(0, 110) || ''}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: 'var(--burgundy)', marginTop: 4 }}>
                  <span>Continue</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION E: 3 USEFUL SHORTCUTS */}
      <section>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 14 }}>
          Helpful Shortcuts
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {/* Shortcut 1: Connect with your partner */}
          <div
            onClick={() => navigate('/app/workspace')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: 26,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.16)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--burgundy)',
              }}
            >
              <HeartHandshake size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Connect with your partner</h3>
              <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, margin: 0 }}>
                Invite your partner when you're ready to practice together.
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--burgundy)' }}>
              <span>Invite partner</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Shortcut 2: Communication guides */}
          <div
            onClick={() => navigate('/app/scripts')}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: 26,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.16)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-muted)',
              }}
            >
              <BookOpen size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Communication guides</h3>
              <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, margin: 0 }}>
                Explore practical examples for difficult conversations.
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--burgundy)' }}>
              <span>View guides</span>
              <ArrowRight size={13} />
            </div>
          </div>

          {/* Shortcut 3: My communication style */}
          <a
            href="/quiz.html"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: 26,
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              transition: 'all var(--transition-fast)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.16)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--charcoal)',
              }}
            >
              <Compass size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: 'var(--charcoal)' }}>
                My communication style
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, margin: 0 }}>
                Reflect on how you express yourself and what you'd like to improve.
              </p>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--burgundy)' }}>
              <span>Explore style</span>
              <ArrowRight size={13} />
            </div>
          </a>
        </div>
      </section>

      {/* SECTION F: VISUAL EBOOK STOREFRONT WITH REAL COVERS */}
      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '36px 40px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--burgundy)', marginBottom: 6 }}>
              Published Guides &amp; Digital Storefront
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--charcoal)' }}>
              Deepen your communication toolkit
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--gray)', maxWidth: 660, margin: '6px 0 0', lineHeight: 1.5 }}>
              Each guide addresses a different dimension of how couples communicate. Available instantly in digital format.
            </p>
          </div>

          <button
            onClick={() => navigate('/app/scripts')}
            className="btn btn-secondary"
            style={{ fontSize: 13.5, padding: '9px 18px', gap: 6 }}
          >
            <span>Explore all 130+ scripts</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Ebook Cards Grid with High-Resolution Covers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 24,
          }}
        >
          {GUMROAD_PRODUCTS.map((prod) => {
            const isOwned = hasBundle || ownedKeys.includes(prod.key as any)
            return (
              <div
                key={prod.key}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-card)',
                  border: isOwned ? '2px solid #27ae60' : prod.badge ? '2px solid var(--burgundy)' : '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)'
                }}
              >
                {/* Book Cover Image Area */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '3/4',
                  background: 'var(--cream)',
                  overflow: 'hidden'
                }}>
                  <img
                    src={prod.cover}
                    alt={`${prod.title} cover`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.4s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />

                  {prod.badge && (
                    <span style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'var(--burgundy)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: 6,
                      boxShadow: '0 2px 8px rgba(196,30,58,0.4)'
                    }}>
                      {prod.badge}
                    </span>
                  )}

                  {isOwned && (
                    <span style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      background: '#27ae60',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <CheckCircle size={12} /> Owned
                    </span>
                  )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {prod.forWho}
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--charcoal)', margin: 0, lineHeight: 1.3 }}>
                    {prod.title}
                  </h3>

                  <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                    {prod.desc}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    borderTop: '1px solid var(--border)',
                    marginTop: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)' }}>
                        {prod.price}
                      </span>
                      {prod.wasPrice && (
                        <span style={{ fontSize: 13, color: 'var(--gray)', textDecoration: 'line-through' }}>
                          {prod.wasPrice}
                        </span>
                      )}
                    </div>

                    {isOwned ? (
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#27ae60', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Ready in App
                      </span>
                    ) : (
                      <a
                        href={prod.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                          fontSize: 12.5,
                          padding: '8px 14px',
                          gap: 6
                        }}
                      >
                        <span>View on Gumroad</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
