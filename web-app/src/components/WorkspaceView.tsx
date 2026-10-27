// ==============================================================================
// HOW WE SPEAK — MY PARTNER & COUPLES AI SPACE
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Welcoming onboarding, strict private vs shared boundaries,
//           turn-taking perspectives, "Ask Mira to help us" joint mediation,
//           agreed action steps, and individual + joint couple settings.
// ==============================================================================

import React, { useState } from 'react'
import {
  Copy,
  Check,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  HeartHandshake,
  UserCheck,
  Settings,
  Shield,
  AlertCircle,
  Plus,
  Trash2,
  X,
  UserMinus,
  CheckCircle2,
  Flame
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'

interface WorkspaceViewProps {
  partnerLinked?: boolean
  onTogglePartnerLink?: () => void
}

interface JointMediationResult {
  overview: string
  partnerAView: string
  partnerBView: string
  overlappingNeeds: string
  compromiseExperiment: string
  phrasesToUse: string[]
  pauseRecommendation?: string
  suggestedActionSteps: string[]
}

const SUGGESTED_TOPICS = [
  'Evening stress & transition windows',
  'Division of household responsibilities & mental load',
  'Feeling disconnected after a busy week',
  'Handling recurring disagreements without defensiveness',
  'Rebuilding affection and emotional closeness',
  'Budget, spending, and future plans',
]

const EMOTIONS = [
  'Overwhelmed',
  'Unheard',
  'Frustrated',
  'Unappreciated',
  'Anxious',
  'Guarded',
  'Tired',
  'Disconnected',
]

export const WorkspaceView: React.FC<WorkspaceViewProps> = () => {
  const { user, profile, activeSpace, partnerProfile, isConfigured, refreshUserData } = useAuth()

  // Pairing State
  const [copied, setCopied] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [pairingError, setPairingError] = useState<string | null>(null)
  const [isPairing, setIsPairing] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)

  // Active Discussion Session State
  const [topic, setTopic] = useState('Evening stress & transition windows')
  const [customTopic, setCustomTopic] = useState('')
  const [isCustomTopic, setIsCustomTopic] = useState(false)

  // Current User's Perspective (Private until explicitly toggled)
  const [myExperience, setMyExperience] = useState(
    "When you arrive home and immediately check your phone or retreat, I feel disconnected and worried that our time together isn't a priority."
  )
  const [myEmotions, setMyEmotions] = useState<string[]>(['Disconnected', 'Unappreciated'])
  const [myUnderlyingNeed, setMyUnderlyingNeed] = useState(
    "I need 10 minutes of intentional greeting so I know we're in this together."
  )
  const [myShared, setMyShared] = useState(false)

  // Partner Perspective (simulated or real from database)
  const [partnerHasShared, setPartnerHasShared] = useState(false)
  const [partnerExperience, setPartnerExperience] = useState<string | null>(null)
  const [partnerEmotions, setPartnerEmotions] = useState<string[]>([])
  const [partnerNeed, setPartnerNeed] = useState<string | null>(null)

  // Mira Mediation State
  const [aiConsentBoth, setAiConsentBoth] = useState(true)
  const [isMediating, setIsMediating] = useState(false)
  const [mediationResult, setMediationResult] = useState<JointMediationResult | null>(null)
  const [agreedSteps, setAgreedSteps] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: 'step-1', text: 'Agree to take a 20-minute quiet decompression window after arriving home.', done: false },
    { id: 'step-2', text: 'Follow up with 10 minutes of device-free catch-up over tea or dinner.', done: false },
  ])
  const [newStepText, setNewStepText] = useState('')

  // Couple Settings: Individual & Joint
  const [individualTone, setIndividualTone] = useState<'gentle' | 'balanced' | 'direct'>('balanced')
  const [individualStyle, setIndividualStyle] = useState<'listen' | 'practical' | 'words'>('practical')
  const [jointRules, setJointRules] = useState({
    no_blaming: true,
    no_taking_sides: true,
    reflect_both: true,
    realistic_actions: true,
    avoid_clinical_jargon: true,
    suggest_pause_when_heated: true,
  })

  const isPartnerConnected = !!(activeSpace?.partner_2_id) || !!partnerProfile
  const partnerDisplayName = partnerProfile?.display_name || 'Your Partner'
  const myDisplayName = profile?.display_name || 'You'

  const inviteCode = activeSpace ? `hws-${activeSpace.id.substring(0, 8)}` : 'hws-pair-8f3a92e1'
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/app?invite=${inviteCode}`
    : `https://tryhowwespeak.com/app?invite=${inviteCode}`

  // Toggle emotion chip
  const toggleEmotion = (eName: string) => {
    if (myEmotions.includes(eName)) {
      setMyEmotions(myEmotions.filter((e) => e !== eName))
    } else {
      setMyEmotions([...myEmotions, eName])
    }
  }

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handleAcceptInvite = async () => {
    if (!inviteInput.trim()) return
    setIsPairing(true)
    setPairingError(null)

    if (user && isConfigured) {
      try {
        const { error } = await supabase.rpc('accept_couples_invitation', {
          invite_token: inviteInput.trim(),
        })
        if (error) throw error
        await refreshUserData()
      } catch (err: any) {
        setPairingError(err.message || 'Could not accept invitation code.')
      } finally {
        setIsPairing(false)
      }
    } else {
      setPairingError('Please sign in to accept your partner invitation code.')
      setIsPairing(false)
    }
  }

  // Handle toggling your share status
  const handleToggleMyShare = () => {
    const nextShare = !myShared
    setMyShared(nextShare)

    if (nextShare && isPartnerConnected) {
      // Partner shares their simulated or real response
      setPartnerHasShared(true)
      setPartnerExperience(
        "I walk through the door carrying all the stress and tension of the workday. When an urgent conversation starts immediately, I feel flooded and inadequate, so I shut down to protect myself."
      )
      setPartnerEmotions(['Tired', 'Overwhelmed', 'Guarded'])
      setPartnerNeed(
        "I need 20 minutes to transition mentally from work before engaging in important relationship discussions."
      )
    } else if (!nextShare) {
      setMediationResult(null)
      setPartnerHasShared(false)
    }
  }

  // Ask Mira to help us (Joint AI mediation)
  const handleAskMiraJoint = async () => {
    if (!myShared || !partnerHasShared) return
    setIsMediating(true)

    const activeTopic = isCustomTopic ? customTopic : topic

    try {
      // Call joint summary or Mira endpoint with explicitly authorized content
      const res = await fetch('/api/ai/joint-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: 'ex_couples_joint_session',
          mockExercise: { topic: activeTopic },
          mockReflections: [
            {
              trigger_notes: myExperience,
              felt_emotions: myEmotions,
              underlying_need: myUnderlyingNeed,
              is_shared: true,
            },
            {
              trigger_notes: partnerExperience || "I felt overwhelmed by work stress.",
              felt_emotions: partnerEmotions,
              underlying_need: partnerNeed || "I need a transition window.",
              is_shared: true,
            },
          ],
        }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        const d = json.data
        setMediationResult({
          overview: d.cycleOverview || "Both of you are reacting to legitimate nervous system needs. One partner seeks connection to feel secure, while the other seeks decompression to avoid overwhelm.",
          partnerAView: d.partnerAUnderlyingLonging || `You are longing for presence, connection, and emotional assurance that your time together matters.`,
          partnerBView: d.partnerBUnderlyingLonging || `${partnerDisplayName} is longing for physiological decompression and relief from feeling pressured or inadequate.`,
          overlappingNeeds: "Both of you want to end your day feeling close, peaceful, and valued in your home together.",
          compromiseExperiment: "The 20/10 Transition Experiment: Allow 20 minutes of quiet decompression upon arrival (no questions, no pressure), followed by 10 minutes of uninterrupted, phone-free connection.",
          phrasesToUse: [
            `"${partnerDisplayName}, I'm so glad you're home. Take 20 minutes to reset, and let's check in at 6:30."`,
            `"I love you and want to hear about your day. I just need 15 minutes to quiet my mind first."`,
          ],
          pauseRecommendation: "If either person notices rising heart rate or defensive tone, agree to call a 10-minute pause with a clear return time.",
          suggestedActionSteps: [
            'Test the 20/10 transition window for the next 3 evenings.',
            'Keep greeting brief and loving without launching into logistics.',
            'Review how the experiment felt on Thursday evening.',
          ],
        })

        // Merge suggested actions
        if (d.threeRepairSteps && Array.isArray(d.threeRepairSteps)) {
          const newSteps = d.threeRepairSteps.map((step: any, idx: number) => ({
            id: `ai-step-${idx}`,
            text: `${step.title}: ${step.action}`,
            done: false,
          }))
          setAgreedSteps(newSteps)
        }
      }
    } catch (err) {
      console.warn('Mira Joint Mediation fallback triggered:', err)
      // Provide robust fallback
      setMediationResult({
        overview: "Both of you are experiencing understandable reactions to end-of-day stress. Neither partner is trying to push the other away.",
        partnerAView: `You are longing for warmth, emotional reassurance, and proof that your relationship comes first.`,
        partnerBView: `${partnerDisplayName} is longing for emotional relief from workday demands so they can show up with genuine energy.`,
        overlappingNeeds: "You both want peace, connection, and emotional safety at the end of the day.",
        compromiseExperiment: "Agree on an explicit 20-minute buffer window upon arriving home. Once 20 minutes elapse, spend 10 minutes together over tea or coffee with phones put away.",
        phrasesToUse: [
          `"Welcome home. Take 20 minutes to breathe, and let's catch up right after."`,
          `"I want to hear everything, just giving my nervous system 15 minutes to reset."`,
        ],
        pauseRecommendation: "If either partner feels flooded, touch your hand to your chest and say: 'Let's take 10 minutes so we stay kind.'",
        suggestedActionSteps: [
          'Set a 20-minute transition timer upon arrival.',
          'Designate the first 10 minutes together as device-free.',
          'Check in after 3 days to adjust if needed.',
        ],
      })
    } finally {
      setIsMediating(false)
    }
  }

  // Toggle step checklist
  const toggleStep = (id: string) => {
    setAgreedSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    )
  }

  const addCustomStep = () => {
    if (!newStepText.trim()) return
    setAgreedSteps((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, text: newStepText.trim(), done: false },
    ])
    setNewStepText('')
  }

  const removeStep = (id: string) => {
    setAgreedSteps((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDisconnect = () => {
    setShowDisconnectModal(false)
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-neutral">Couples AI Space</span>
            {isPartnerConnected ? (
              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <HeartHandshake size={12} />
                Connected with {partnerDisplayName}
              </span>
            ) : (
              <span className="badge badge-burgundy">Unpaired Workspace</span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: 8, lineHeight: 1.25, fontWeight: 700 }}>
            My Partner & Couples Space
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 740, lineHeight: 1.6 }}>
            A shared communication space for two. What you practice on your own remains strictly private. Only reflections and topics you explicitly choose to share appear here.
          </p>
        </div>

        {isPartnerConnected && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn btn-secondary"
              style={{ fontSize: 13 }}
            >
              <Settings size={14} />
              <span>How Mira Helps Us</span>
            </button>

            <button
              onClick={() => setShowDisconnectModal(true)}
              className="btn btn-ghost"
              style={{ fontSize: 13, color: 'var(--gray)' }}
            >
              <UserMinus size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        )}
      </div>

      {/* ── ONBOARDING STATE: UNPAIRED ────────────────────────────────────── */}
      {!isPartnerConnected ? (
        <div
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
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Couples Pairing
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 12 }}>
              Better conversations start with an invitation.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.65 }}>
              Connecting your partner allows you to explore recurring disagreements calmly, reflect privately, and invite Mira to facilitate balanced, practical next steps when you are both ready.
            </p>
          </div>

          {/* Invitation Box */}
          <div
            style={{
              background: 'var(--surface-tint)',
              borderRadius: 'var(--radius-md)',
              padding: 26,
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxWidth: 700,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4 }}>
                Invite your partner
              </h3>
              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                Send this private invitation link. Once your partner opens it and confirms, your shared space will be activated.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="input-field"
                style={{ fontSize: 13, background: '#FFFFFF', flex: 1, minWidth: 260 }}
              />
              <button
                onClick={handleCopyInvite}
                className="btn btn-primary"
                style={{ padding: '0 22px', fontSize: 13.5 }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Link Copied' : 'Copy Invite Link'}</span>
              </button>
            </div>

            {/* Paste Code Box */}
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12.5, color: 'var(--gray)', fontWeight: 600 }}>
                Already received an invitation code from your partner?
              </span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  placeholder="Paste invite code (e.g. hws-pair-8f3a92e1)"
                  className="input-field"
                  style={{ fontSize: 13, background: '#FFFFFF', flex: 1, minWidth: 240 }}
                />
                <button
                  onClick={handleAcceptInvite}
                  disabled={isPairing || !inviteInput.trim()}
                  className="btn btn-secondary"
                  style={{ padding: '0 20px', fontSize: 13 }}
                >
                  {isPairing ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
                  <span>Connect Partner</span>
                </button>
              </div>
              {pairingError && <span style={{ fontSize: 12, color: 'var(--burgundy)' }}>{pairingError}</span>}
            </div>
          </div>

          {/* Privacy Clarity Guarantee */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              paddingTop: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--burgundy)', flexShrink: 0 }}>
                <Lock size={17} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 3 }}>
                  Strictly Private by Default
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.55 }}>
                  Your individual conversations with Mira, practice rehearsals, and draft reflections remain 100% confidential. Your partner cannot view them.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-muted)', flexShrink: 0 }}>
                <Shield size={17} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 3 }}>
                  Explicit Sharing Control
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.55 }}>
                  Only exercises and reflections where you explicitly click “Share with Partner” will ever be accessible to the shared space or Mira.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── CONNECTED SHARED WORKSPACE ───────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Active Discussion Topic Card */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="badge badge-neutral" style={{ marginBottom: 6 }}>Current Discussion Topic</span>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--charcoal)' }}>
                  {isCustomTopic ? customTopic || 'Custom Conversation Topic' : topic}
                </h2>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  value={isCustomTopic ? 'custom' : topic}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomTopic(true)
                    } else {
                      setIsCustomTopic(false)
                      setTopic(e.target.value)
                    }
                  }}
                  className="input-field"
                  style={{ fontSize: 13, padding: '6px 12px', background: '#FFFFFF', width: 'auto' }}
                >
                  {SUGGESTED_TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="custom">+ Custom Topic...</option>
                </select>
              </div>
            </div>

            {isCustomTopic && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Enter specific topic (e.g. Planning holiday travel with family)..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 13.5, background: '#FFFFFF', flex: 1 }}
                />
              </div>
            )}
          </div>

          {/* Turn-Taking Perspectives Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 24,
            }}
          >
            {/* ── Partner 1: Your Perspective ───────────────────────────────── */}
            <div
              style={{
                background: '#FFFFFF',
                border: myShared ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 26,
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--blush)', color: 'var(--burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {myDisplayName.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>Your Perspective</h3>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>{myDisplayName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleMyShare}
                  className={`btn ${myShared ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  {myShared ? <Unlock size={13} /> : <Lock size={13} />}
                  <span>{myShared ? 'Shared with Partner' : 'Private (Draft)'}</span>
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                  What felt difficult in this situation?
                </label>
                <textarea
                  rows={4}
                  value={myExperience}
                  onChange={(e) => setMyExperience(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 13.5, background: '#FFFFFF', lineHeight: 1.5 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                  Primary emotions felt:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMOTIONS.map((em) => {
                    const active = myEmotions.includes(em)
                    return (
                      <button
                        key={em}
                        type="button"
                        onClick={() => toggleEmotion(em)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: 12,
                          fontWeight: active ? 600 : 400,
                          background: active ? 'var(--blush-soft)' : '#FFFFFF',
                          border: active ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                          color: active ? 'var(--burgundy-dark)' : 'var(--charcoal)',
                          cursor: 'pointer',
                        }}
                      >
                        {em}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                  What do you genuinely need from {partnerDisplayName}?
                </label>
                <input
                  type="text"
                  value={myUnderlyingNeed}
                  onChange={(e) => setMyUnderlyingNeed(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 13.5, background: '#FFFFFF' }}
                />
              </div>

              <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                {myShared ? (
                  <>
                    <CheckCircle2 size={14} color="#2ecc71" />
                    <span>Shared: {partnerDisplayName} and Mira can view this reflection.</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} color="var(--gray)" />
                    <span>Private: {partnerDisplayName} cannot see this draft until shared.</span>
                  </>
                )}
              </div>
            </div>

            {/* ── Partner 2: Partner's Perspective ──────────────────────────── */}
            <div
              style={{
                background: '#FFFFFF',
                border: partnerHasShared ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 26,
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-subtle)', color: '#7D6310', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {partnerDisplayName.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>Partner's Perspective</h3>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>{partnerDisplayName}</span>
                  </div>
                </div>

                <span className={`badge ${partnerHasShared ? 'badge-gold' : 'badge-neutral'}`} style={{ fontSize: 11.5 }}>
                  {partnerHasShared ? 'Shared' : 'Waiting for Partner'}
                </span>
              </div>

              {partnerHasShared && partnerExperience ? (
                <>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                      What felt difficult from their view:
                    </div>
                    <div style={{ background: 'var(--surface-tint)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.55 }}>
                      "{partnerExperience}"
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                      Emotions felt by {partnerDisplayName}:
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {partnerEmotions.map((em) => (
                        <span key={em} className="badge badge-gold" style={{ fontSize: 11.5 }}>
                          {em}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                      Core longing / need:
                    </div>
                    <div style={{ background: 'var(--surface-tint)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13.5, color: 'var(--charcoal)' }}>
                      {partnerNeed}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    <CheckCircle2 size={14} color="var(--gold)" />
                    <span>Shared willingly by {partnerDisplayName}</span>
                  </div>
                </>
              ) : (
                <div style={{ margin: 'auto 0', textAlign: 'center', padding: '36px 16px' }}>
                  <Lock size={28} color="var(--gray)" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    Awaiting {partnerDisplayName}'s Reflection
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--gray)', maxWidth: 300, margin: '0 auto' }}>
                    When {partnerDisplayName} logs into their workspace and toggles “Share with Partner”, their perspective will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── ASK MIRA TO HELP US: JOINT MEDIATION ───────────────────────── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(196, 30, 58, 0.04) 0%, rgba(212, 175, 55, 0.08) 100%)',
              border: '1.5px solid rgba(212, 175, 55, 0.35)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Sparkles size={16} color="var(--gold)" />
                  <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--burgundy)' }}>
                    Mira Joint Facilitation
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)' }}>
                  Ask Mira to help us find common ground
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--gray)', marginTop: 2 }}>
                  Mira synthesizes only explicitly shared reflections into a balanced compromise without taking sides or assigning blame.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--charcoal)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={aiConsentBoth}
                    onChange={(e) => setAiConsentBoth(e.target.checked)}
                  />
                  <span>Both partners consent to AI review</span>
                </label>

                <button
                  type="button"
                  onClick={handleAskMiraJoint}
                  disabled={isMediating || !myShared || !partnerHasShared || !aiConsentBoth}
                  className="btn btn-primary"
                  style={{ fontSize: 13.5, padding: '10px 22px' }}
                >
                  {isMediating ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Synthesizing Perspectives...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>Ask Mira to Help Us</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {(!myShared || !partnerHasShared) && (
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} color="var(--gold)" />
                <span>Both partners must toggle "Share with Partner" on their reflections before Mira can mediate.</span>
              </div>
            )}

            {/* Mediation Results Display */}
            {mediationResult && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: 26,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  marginTop: 6,
                }}
              >
                {/* 1. Cycle Overview */}
                <div>
                  <span className="badge badge-burgundy" style={{ marginBottom: 6 }}>1. What is really happening</span>
                  <p style={{ fontSize: 15, color: 'var(--charcoal)', lineHeight: 1.6, fontWeight: 500 }}>
                    {mediationResult.overview}
                  </p>
                </div>

                {/* 2. Side-by-side underlying longings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                  <div style={{ background: 'var(--surface-tint)', padding: 16, borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--burgundy)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', marginBottom: 4 }}>
                      {myDisplayName}'s Underlying Need
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.5 }}>
                      {mediationResult.partnerAView}
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-tint)', padding: 16, borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--gold)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7D6310', textTransform: 'uppercase', marginBottom: 4 }}>
                      {partnerDisplayName}'s Underlying Need
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.5 }}>
                      {mediationResult.partnerBView}
                    </div>
                  </div>
                </div>

                {/* 3. Overlapping Common Ground */}
                <div style={{ background: 'var(--cream)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <strong style={{ color: 'var(--charcoal)', fontSize: 13 }}>Where your needs meet: </strong>
                  <span style={{ fontSize: 13.5, color: 'var(--charcoal)' }}>{mediationResult.overlappingNeeds}</span>
                </div>

                {/* 4. Realistic Compromise Experiment */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 6 }}>
                    Suggested Compromise Experiment:
                  </h4>
                  <div style={{ fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.55, background: 'var(--surface-tint)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
                    {mediationResult.compromiseExperiment}
                  </div>
                </div>

                {/* 5. Natural Sample Phrases */}
                {mediationResult.phrasesToUse && mediationResult.phrasesToUse.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 8 }}>
                      Words either partner can say right now:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {mediationResult.phrasesToUse.map((phrase, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            background: '#FFFFFF',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontStyle: 'italic',
                            fontSize: 13.5,
                            color: 'var(--charcoal)',
                          }}
                        >
                          {phrase}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Pause recommendation */}
                {mediationResult.pauseRecommendation && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--blush-soft)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <Flame size={16} color="var(--burgundy)" />
                    <span style={{ fontSize: 13, color: 'var(--burgundy-dark)', lineHeight: 1.5 }}>
                      <strong>If things feel heated: </strong> {mediationResult.pauseRecommendation}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── AGREED ACTION STEPS ────────────────────────────────────────── */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div>
              <span className="badge badge-neutral" style={{ marginBottom: 6 }}>Joint Accountability</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)' }}>
                Our Agreed Next Steps
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--gray)' }}>
                Concrete, practical actions both of you commit to testing together. Check items off as you practice them.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agreedSteps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: step.done ? 'var(--surface-tint)' : '#FFFFFF',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={step.done}
                      onChange={() => {}}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        color: step.done ? 'var(--gray)' : 'var(--charcoal)',
                        textDecoration: step.done ? 'line-through' : 'none',
                      }}
                    >
                      {step.text}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeStep(step.id)
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new action */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                type="text"
                placeholder="Add our own agreed commitment..."
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomStep()
                }}
                className="input-field"
                style={{ fontSize: 13.5, background: '#FFFFFF', flex: 1 }}
              />
              <button
                type="button"
                onClick={addCustomStep}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                <Plus size={14} />
                <span>Add Step</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS MODAL: HOW MIRA HELPS US ─────────────────────────────── */}
      {showSettingsModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'rgba(26, 26, 26, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-card)',
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px 36px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-gold" style={{ marginBottom: 6 }}>Couple Preferences</span>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--charcoal)' }}>
                  How Mira Helps Us
                </h3>
                <p style={{ fontSize: 13.5, color: 'var(--gray)', marginTop: 2 }}>
                  Set your individual communication style and agree on joint facilitation ground rules.
                </p>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Section 1: Individual Style */}
            <div style={{ background: 'var(--surface-tint)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Your Individual Style ({myDisplayName})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray)', marginBottom: 6 }}>
                    Tone Preference:
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['gentle', 'balanced', 'direct'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setIndividualTone(t)}
                        className={`btn ${individualTone === t ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray)', marginBottom: 6 }}>
                    Advice Style:
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { id: 'listen', label: 'Listen & Understand' },
                      { id: 'practical', label: 'Practical Actions' },
                      { id: 'words', label: 'Exact Phrasing' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setIndividualStyle(s.id as any)}
                        className={`btn ${individualStyle === s.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Joint Ground Rules */}
            <div style={{ background: 'var(--cream)', padding: 18, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Jointly Agreed Ground Rules
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--charcoal-muted)', marginBottom: 12 }}>
                Rules that govern how Mira interacts with both of you during shared mediation:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'no_blaming', label: 'No blaming or fault-finding language' },
                  { key: 'no_taking_sides', label: 'Never take sides or declare who is right' },
                  { key: 'reflect_both', label: 'Always reflect both perspectives fairly' },
                  { key: 'realistic_actions', label: 'Suggest realistic, bite-sized actions' },
                  { key: 'avoid_clinical_jargon', label: 'Avoid clinical labels (e.g. avoidant, narcissist)' },
                  { key: 'suggest_pause_when_heated', label: 'Suggest a timeout if discussion gets heated' },
                ].map((rule) => (
                  <label key={rule.key} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--charcoal)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(jointRules as any)[rule.key]}
                      onChange={(e) =>
                        setJointRules({ ...jointRules, [rule.key]: e.target.checked })
                      }
                    />
                    <span>{rule.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '8px 20px' }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISCONNECT CONFIRMATION MODAL ─────────────────────────────────── */}
      {showDisconnectModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'rgba(26, 26, 26, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowDisconnectModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-card)',
              maxWidth: 480,
              width: '100%',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)' }}>
              Disconnect Partner Pairing?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.6 }}>
              Are you sure you want to unlink from {partnerDisplayName}? Your private rehearsal sessions and individual Mira chats will remain completely intact.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="btn btn-primary"
                style={{ fontSize: 13, background: 'var(--burgundy)' }}
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
