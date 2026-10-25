// ==============================================================================
// HOW WE SPEAK — INDIVIDUAL CONVERSATION REHEARSAL
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Situation breakdown, Goal & Tone selector, Live AI de-escalation,
//           Interactive Follow-up simulator, Private Plan saving to PostgreSQL
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Copy,
  Check,
  Shield,
  AlertCircle,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  MessageSquare,
  History,
  Trash2,
  Volume2
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'
import type { RehearsalPlan, FollowupPractice, CommunicationGoal, PreferredTone } from '../types/database'

interface GeneratedScript {
  id: string
  label: string
  tone: string
  script: string
  mechanism: string
}

interface RehearsalResult {
  nervousSystemAnalysis: {
    partnerHears: string
    coRegulationTip: string
    uncertaintyNote?: string
  }
  scripts: GeneratedScript[]
}

interface FollowupResult {
  partnerState: string
  counterOptions: {
    id: string
    label: string
    counterScript: string
    why: string
  }[]
}

const PRESET_GOALS = [
  { id: 'de-escalate', label: 'De-escalate Heated Conflict' },
  { id: 'request-space', label: 'Request Safe 20-Min Space' },
  { id: 'intimacy-mismatch', label: 'Discuss Physical Intimacy Without Shame' },
  { id: 'express-vulnerability', label: 'Express Hurt Without Accusations' },
  { id: 'boundaries', label: 'Set a Loving Emotional Boundary' },
]

const PRESET_TONES = [
  { id: 'gentle', label: 'Gentle & Vulnerable' },
  { id: 'grounded', label: 'Grounded & Boundaried' },
  { id: 'direct', label: 'Direct & Positive' },
  { id: 'reassuring', label: 'Calm & Reassuring' },
]

const PARTNER_REACTION_PRESETS = [
  "They go completely silent and look away.",
  "They say: 'You always bring up problems and blame me!'",
  "They say: 'I'm exhausted, I really cannot do this right now.'",
  "They roll their eyes or dismiss what I am saying.",
]

export const TranslatorView: React.FC = () => {
  const { user, session, isConfigured } = useAuth()

  // Rehearsal Configuration State
  const [situation, setSituation] = useState(
    "You always go silent when I bring up something important. It feels like you don't even care about how hurt I am and you just want to run away!"
  )
  const [goal, setGoal] = useState('de-escalate')
  const [tone, setTone] = useState('gentle')

  // API Execution State
  const [isTranslating, setIsTranslating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rehearsalResult, setRehearsalResult] = useState<RehearsalResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Follow-up Practice Simulator State
  const [selectedScriptForFollowup, setSelectedScriptForFollowup] = useState<string>('')
  const [partnerReactionInput, setPartnerReactionInput] = useState('')
  const [isSimulatingFollowup, setIsSimulatingFollowup] = useState(false)
  const [followupResult, setFollowupResult] = useState<FollowupResult | null>(null)
  const [accumulatedFollowups, setAccumulatedFollowups] = useState<FollowupPractice[]>([])

  // Private Saved Plans State
  const [savedPlans, setSavedPlans] = useState<RehearsalPlan[]>(() => {
    if (typeof window === 'undefined') return []
    const local = localStorage.getItem('hws_saved_plans')
    if (local) {
      try {
        return JSON.parse(local)
      } catch {
        return []
      }
    }
    return []
  })
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'rehearse' | 'history'>('rehearse')

  // Fetch saved plans from Supabase if authenticated
  useEffect(() => {
    if (user && isConfigured) {
      supabase
        .from('rehearsal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setSavedPlans(data as RehearsalPlan[])
        })
    }
  }, [user, isConfigured])

  // Handle Main Script Generation
  const handleGenerateScripts = async () => {
    if (!situation.trim() || situation.trim().length < 5) {
      setErrorMessage('Please describe the situation or raw draft (at least 5 characters).')
      return
    }

    setIsTranslating(true)
    setErrorMessage(null)
    setIsSaved(false)
    setFollowupResult(null)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch('/api/ai/rehearsal', {
        method: 'POST',
        headers,
        body: JSON.stringify({ situation, goal, tone }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to generate scripts.')
      }

      setRehearsalResult(json.data)
      if (json.data.scripts?.[0]) {
        setSelectedScriptForFollowup(json.data.scripts[0].script)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while connecting to the rehearsal engine.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Handle Follow-up Simulation
  const handleSimulateFollowup = async (reactionToTest?: string) => {
    const rx = reactionToTest || partnerReactionInput
    if (!rx.trim() || !selectedScriptForFollowup) return

    setIsSimulatingFollowup(true)

    try {
      const res = await fetch('/api/ai/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chosenScript: selectedScriptForFollowup,
          partnerReaction: rx,
        }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        setFollowupResult(json.data)
        if (json.data.counterOptions?.[0]) {
          setAccumulatedFollowups((prev) => [
            ...prev,
            {
              partnerResponse: rx,
              counterScript: json.data.counterOptions[0].counterScript,
            },
          ])
        }
      }
    } catch (err: any) {
      console.warn('Follow-up simulation error:', err)
    } finally {
      setIsSimulatingFollowup(false)
    }
  }

  // Handle Copy to Clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Saving Private Plan
  const handleSavePlan = async () => {
    if (!rehearsalResult || !selectedScriptForFollowup) return

    const newPlan: Partial<RehearsalPlan> = {
      title: `${goal.replace('-', ' ').toUpperCase()} Rehearsal`,
      situation_raw: situation,
      communication_goal: goal as CommunicationGoal,
      selected_tone: tone as PreferredTone,
      chosen_script: selectedScriptForFollowup,
      nervous_system_insight: rehearsalResult.nervousSystemAnalysis.partnerHears,
      practice_followups: accumulatedFollowups,
      action_reminders: [
        'Pause for 3 deep diaphragmatic breaths before initiating.',
        'Name your return time if a pause is requested.',
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (user && isConfigured) {
      const { data, error } = await supabase
        .from('rehearsal_plans')
        .insert({
          ...newPlan,
          user_id: user.id,
        })
        .select()
        .single()

      if (!error && data) {
        setSavedPlans((prev) => [data as RehearsalPlan, ...prev])
        setIsSaved(true)
      }
    } else {
      // Local fallback
      const localPlan = {
        ...newPlan,
        id: 'plan_' + Math.random().toString(36).substring(2, 9),
        user_id: user?.id || 'demo_user',
      } as RehearsalPlan

      const updated = [localPlan, ...savedPlans]
      setSavedPlans(updated)
      localStorage.setItem('hws_saved_plans', JSON.stringify(updated))
      setIsSaved(true)
    }
  }

  // Handle Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (user && isConfigured) {
      await supabase.from('rehearsal_plans').delete().eq('id', id)
    }
    const filtered = savedPlans.filter((p) => p.id !== id)
    setSavedPlans(filtered)
    localStorage.setItem('hws_saved_plans', JSON.stringify(filtered))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* View Header with Mode Toggles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-burgundy">Private Solo Rehearsal</span>
            <span className="badge badge-gold">Gottman & Polyvagal Protocol</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: 8 }}>
            Individual Conversation Rehearsal
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 740 }}>
            Rehearse difficult conversations before you have them. Transform defensive triggers into softened startups, practice responses to potential partner reactions, and save your private game plan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('rehearse')}
            className={`btn ${activeTab === 'rehearse' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <Sparkles size={14} />
            Rehearsal Studio
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            <History size={14} />
            Saved Plans ({savedPlans.length})
          </button>
        </div>
      </div>

      {/* Main Tab 1: Rehearsal Studio */}
      {activeTab === 'rehearse' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 32,
        }}>
          {/* Left Column: Input Form */}
          <div className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Step 1: Goal */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 8 }}>
                1. What is your primary conversation goal?
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PRESET_GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'left',
                      border: goal === g.id ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                      background: goal === g.id ? 'var(--blush-soft)' : '#FFFFFF',
                      color: goal === g.id ? 'var(--burgundy-dark)' : 'var(--charcoal)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Tone Selection */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 8 }}>
                2. Select desired emotional tone
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {PRESET_TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      textAlign: 'center',
                      border: tone === t.id ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                      background: tone === t.id ? 'var(--gold-subtle)' : '#FFFFFF',
                      color: tone === t.id ? 'var(--charcoal)' : 'var(--charcoal-muted)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Raw Emotional Draft / Trigger Description */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)' }}>
                  3. Explain the situation or your raw message
                </label>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>{situation.length}/2000</span>
              </div>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={5}
                className="input-field"
                placeholder="Write what you actually want to say or what triggered you (no filter needed)..."
                style={{
                  resize: 'vertical',
                  fontSize: 14.5,
                  lineHeight: 1.6,
                  background: '#FFFFFF',
                }}
              />
            </div>

            {errorMessage && (
              <div style={{
                background: '#fde8e8',
                border: '1px solid #f8b4b4',
                color: '#9b1c1c',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handleGenerateScripts}
              disabled={isTranslating || !situation.trim()}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: 15 }}
            >
              {isTranslating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  De-escalating with Clinical Protocol...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Rehearse & Generate Clinical Scripts
                </>
              )}
            </button>

            <div style={{
              fontSize: 12,
              color: 'var(--gray)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderTop: '1px solid var(--border)',
              paddingTop: 14,
            }}>
              <Shield size={14} color="var(--gold)" />
              <span>Private Solo Plan: Your partner CANNOT see rehearsals or private drafts.</span>
            </div>
          </div>

          {/* Right Column: AI Output, Follow-up Simulator & Plan Saver */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {!rehearsalResult ? (
              /* Polished Empty State */
              <div className="card-glass" style={{
                padding: 48,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 460,
                gap: 16,
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 20,
                  background: 'var(--cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--burgundy)',
                }}>
                  <Volume2 size={28} />
                </div>
                <h3 style={{ fontSize: 20 }}>Ready to Rehearse</h3>
                <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 420 }}>
                  Enter your emotional draft on the left and click <strong>"Rehearse"</strong>. Our engine will decode the threat signals in your message and give you 3 softened, vulnerable alternatives.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Nervous System Analysis Card */}
                <div className="card-glass" style={{ padding: 24, borderLeft: '4px solid var(--burgundy)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertCircle size={18} color="var(--burgundy)" />
                    <h3 style={{ fontSize: 17, color: 'var(--burgundy)' }}>What Your Partner's Nervous System Hears</h3>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                    {rehearsalResult.nervousSystemAnalysis.partnerHears}
                  </p>
                  <div style={{
                    background: 'var(--cream)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: 'var(--charcoal)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <Volume2 size={16} color="var(--gold)" />
                    <span><strong>Somatic Tip:</strong> {rehearsalResult.nervousSystemAnalysis.coRegulationTip}</span>
                  </div>
                </div>

                {/* 2. Alternative Softened Startup Scripts */}
                <div className="card-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>
                      Alternative Clinical Scripts
                    </span>
                    <span className="badge badge-gold">Choose Your Preferred Script</span>
                  </div>

                  {rehearsalResult.scripts.map((s, idx) => {
                    const isSelected = selectedScriptForFollowup === s.script
                    return (
                      <div
                        key={s.id || idx}
                        onClick={() => setSelectedScriptForFollowup(s.script)}
                        style={{
                          background: isSelected ? 'var(--blush-soft)' : '#FFFFFF',
                          border: isSelected ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          padding: 18,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase' }}>
                            {s.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(s.script, s.id || String(idx))
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                          >
                            {copiedId === (s.id || String(idx)) ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                            {copiedId === (s.id || String(idx)) ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8 }}>
                          "{s.script}"
                        </p>
                        <div style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                          <strong>Why it works:</strong> {s.mechanism}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 3. Interactive Follow-up Practice Simulator */}
                <div className="card-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={18} color="var(--burgundy)" />
                    <h3 style={{ fontSize: 18 }}>Practice Possible Partner Follow-ups</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray)' }}>
                    What if your partner gets defensive or shuts down? Test possible responses and get instant de-escalation counter-scripts.
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PARTNER_REACTION_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPartnerReactionInput(p)
                          handleSimulateFollowup(p)
                        }}
                        style={{
                          background: 'var(--cream)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-pill)',
                          padding: '5px 12px',
                          fontSize: 11.5,
                          cursor: 'pointer',
                          color: 'var(--charcoal-muted)',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={partnerReactionInput}
                      onChange={(e) => setPartnerReactionInput(e.target.value)}
                      placeholder="Or type what they might say back..."
                      className="input-field"
                      style={{ fontSize: 13.5, background: '#FFF' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSimulateFollowup()}
                      disabled={isSimulatingFollowup || !partnerReactionInput.trim()}
                      className="btn btn-secondary"
                      style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
                    >
                      {isSimulatingFollowup ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                      Test
                    </button>
                  </div>

                  {/* Follow-up Counter Results */}
                  {followupResult && (
                    <div style={{
                      background: 'var(--cream)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      borderLeft: '3px solid var(--gold)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-muted)', textTransform: 'uppercase' }}>
                        Partner Internal State: {followupResult.partnerState}
                      </div>

                      {followupResult.counterOptions.map((opt) => (
                        <div key={opt.id} style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--burgundy)' }}>{opt.label}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(opt.counterScript, opt.id)}
                              className="btn btn-ghost"
                              style={{ padding: '2px 6px', fontSize: 11 }}
                            >
                              {copiedId === opt.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>"{opt.counterScript}"</p>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>{opt.why}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Save Private Plan Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                    Save this rehearsal to your encrypted vault for review before conversation.
                  </span>
                  <button
                    onClick={handleSavePlan}
                    disabled={isSaved}
                    className="btn btn-primary"
                    style={{ padding: '10px 20px', fontSize: 13.5 }}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck size={16} />
                        Plan Saved to Vault
                      </>
                    ) : (
                      <>
                        <Bookmark size={16} />
                        Save Private Plan
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 2: Saved Conversation Plans */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {savedPlans.length === 0 ? (
            <div className="card-glass" style={{ padding: 48, textAlign: 'center' }}>
              <History size={36} color="var(--gray)" style={{ margin: '0 auto 12px' }} />
              <h3>No Saved Plans Yet</h3>
              <p style={{ fontSize: 14, color: 'var(--gray)', marginTop: 6 }}>
                Once you rehearse a conversation and click "Save Private Plan", it will appear here.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 20,
            }}>
              {savedPlans.map((plan) => (
                <div key={plan.id} className="card-glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-burgundy" style={{ marginBottom: 4 }}>{plan.communication_goal}</span>
                      <h3 style={{ fontSize: 18 }}>{plan.title}</h3>
                    </div>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', color: 'var(--gray)' }}
                      title="Delete Plan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ fontSize: 12.5, color: 'var(--gray)', fontStyle: 'italic' }}>
                    Raw Draft: "{plan.situation_raw.substring(0, 80)}..."
                  </div>

                  <div style={{
                    background: '#FFFFFF',
                    borderLeft: '3px solid var(--burgundy)',
                    padding: 14,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13.5,
                    fontStyle: 'italic',
                    color: 'var(--charcoal)',
                  }}>
                    "{plan.chosen_script}"
                  </div>

                  {plan.practice_followups && plan.practice_followups.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--charcoal-muted)', background: 'var(--cream)', padding: 10, borderRadius: 6 }}>
                      <strong>Practiced Follow-up:</strong> If partner reacts with <em>"{plan.practice_followups[0].partnerResponse}"</em> → "{plan.practice_followups[0].counterScript}"
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleCopy(plan.chosen_script, plan.id)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11.5 }}
                    >
                      {copiedId === plan.id ? 'Copied' : 'Copy Script'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
