// ==============================================================================
// HOW WE SPEAK — TRYHOWWESPEAK CONVERSATION REHEARSAL WORKFLOW
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Guided preparation flow, live AI generation, 3 alternative openings,
//           neutral summary, follow-up language, in-place editing, Supabase persistence
// ==============================================================================

import React, { useState } from 'react'
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
  Edit3,
  RotateCcw,
  Volume2
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'
import type {
  SituationCategory,
  CommunicationGoal,
  PreferredTone,
  CommunicationMethod,
  StructuredAIResult
} from '../types/database'

interface RehearsalViewProps {
  onRequireAuth: (returnToPath?: string) => void
}

const SITUATION_CATEGORIES: { id: SituationCategory; label: string; placeholder: string }[] = [
  {
    id: 'partner-distant',
    label: 'My partner seems distant.',
    placeholder: 'What have you noticed? (e.g. They have been quieter than usual, or seem pulled back when we talk)...'
  },
  {
    id: 'recurring-argument',
    label: 'We keep arguing about the same thing.',
    placeholder: 'What is the recurring topic? (e.g. Daily routines, chores, family obligations, or how we speak to each other)...'
  },
  {
    id: 'need-boundary',
    label: 'I need to express a need or boundary.',
    placeholder: 'What need or personal boundary would you like to set? (e.g. A few quiet minutes after work, or talking things through gently)...'
  },
  {
    id: 'future-talk',
    label: 'We need to talk about our future.',
    placeholder: 'What future topic is on your mind? (e.g. Moving forward together, living arrangements, commitments, or long-term goals)...'
  },
  {
    id: 'other',
    label: 'Something else.',
    placeholder: 'Describe what you are experiencing and what you would like to say...'
  }
]

const COMMUNICATION_GOALS: { id: CommunicationGoal; label: string }[] = [
  { id: 'understand', label: 'Understand what is happening between us' },
  { id: 'explain-feelings', label: 'Explain how I feel without attacking' },
  { id: 'ask-change', label: 'Ask for a specific, realistic change' },
  { id: 'establish-boundary', label: 'Establish a respectful personal boundary' },
  { id: 'resolve-disagreement', label: 'Work through an active disagreement calmly' },
]

const PREFERRED_TONES: { id: PreferredTone; label: string; desc: string }[] = [
  { id: 'gentle', label: 'Gentle & Reassuring', desc: 'Focuses on warmth, care, and emotional safety' },
  { id: 'calm-clear', label: 'Calm, Clear & Confident', desc: 'Direct and balanced; invites an honest two-way conversation' },
  { id: 'firm-respectful', label: 'Firm but Respectful', desc: 'Sets explicit boundaries while maintaining care and respect' },
]

const COMMUNICATION_METHODS: { id: CommunicationMethod; label: string }[] = [
  { id: 'face-to-face', label: 'In person' },
  { id: 'text', label: 'Text message' },
  { id: 'call', label: 'Phone or video call' },
]

export const RehearsalView: React.FC<RehearsalViewProps> = ({ onRequireAuth }) => {
  const { user, session, isConfigured } = useAuth()
  const { navigate } = useRouter()

  // Form Inputs
  const [situationCategory, setSituationCategory] = useState<SituationCategory>('partner-distant')
  const [situation, setSituation] = useState(
    "My partner has been quiet for two days and only gives one-word answers. It makes me anxious and I want to know if everything is okay between us."
  )
  const [goal, setGoal] = useState<CommunicationGoal>('understand')
  const [preferredTone, setPreferredTone] = useState<PreferredTone>('gentle')
  const [communicationMethod, setCommunicationMethod] = useState<CommunicationMethod>('face-to-face')
  const [additionalContext, setAdditionalContext] = useState('')

  // Execution & Output State
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<StructuredAIResult | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // In-Place Personalization & Edits
  const [selectedOpeningKey, setSelectedOpeningKey] = useState<'gentle' | 'direct' | 'firm'>('gentle')
  const [editedScript, setEditedScript] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [customNotes, setCustomNotes] = useState('')

  // Saving State
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!situation.trim() || situation.trim().length < 5) {
      setErrorMessage('Please share a few words about what is happening (at least 5 characters).')
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)
    setSaveSuccess(false)
    setSavedPlanId(null)
    setIsEditing(false)

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
        body: JSON.stringify({
          situationCategory,
          situation,
          goal,
          preferredTone,
          communicationMethod,
          additionalContext,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to prepare conversation suggestions. Please try again.')
      }

      setAiResult(json.data)
      const primaryOpening = json.data.openings[selectedOpeningKey] || json.data.openings.gentle
      setEditedScript(primaryOpening)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to the conversation assistant.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectOpening = (key: 'gentle' | 'direct' | 'firm') => {
    setSelectedOpeningKey(key)
    if (aiResult) {
      setEditedScript(aiResult.openings[key])
    }
  }

  const handleSavePlan = async () => {
    if (!aiResult) return

    // Require authentication to persist
    if (!user) {
      onRequireAuth('/app/rehearse')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    const finalChosenScript = editedScript || aiResult.openings[selectedOpeningKey]
    const activeCategoryLabel = SITUATION_CATEGORIES.find((c) => c.id === situationCategory)?.label || 'Conversation'
    const planTitle = `${activeCategoryLabel.replace(/\.$/, '')} Plan`

    const planPayload = {
      user_id: user.id,
      title: planTitle,
      situation_raw: situation,
      situation_category: situationCategory,
      communication_goal: goal,
      selected_tone: preferredTone,
      communication_method: communicationMethod,
      additional_context: additionalContext || null,
      chosen_script: finalChosenScript,
      nervous_system_insight: aiResult.comparisonExplanation,
      structured_result: aiResult,
      custom_edits: {
        chosenOpening: finalChosenScript,
        notes: customNotes,
      },
      practice_followups: [
        { partnerResponse: 'If receptive', counterScript: aiResult.followups.receptive },
        { partnerResponse: 'If defensive', counterScript: aiResult.followups.defensiveness },
        { partnerResponse: 'If asks for time', counterScript: aiResult.followups.requestForTime },
      ],
      action_reminders: [aiResult.nextStep],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isConfigured) {
      try {
        const { data, error } = await supabase
          .from('rehearsal_plans')
          .insert(planPayload)
          .select()
          .single()

        if (error) throw error
        setSaveSuccess(true)
        if (data?.id) setSavedPlanId(data.id)
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to save conversation plan.')
      } finally {
        setIsSaving(false)
      }
    } else {
      // Local fallback
      try {
        const localPlans = JSON.parse(localStorage.getItem('hws_saved_plans') || '[]')
        const newPlan = { id: `local_${Date.now()}`, ...planPayload }
        localStorage.setItem('hws_saved_plans', JSON.stringify([newPlan, ...localPlans]))
        setSaveSuccess(true)
        setSavedPlanId(newPlan.id)
      } catch (err: any) {
        setErrorMessage(err.message || 'Could not save locally.')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const activeCategoryConfig = SITUATION_CATEGORIES.find((c) => c.id === situationCategory)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: 10, lineHeight: 1.25 }}>
          What would you like help talking about?
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 720, lineHeight: 1.6 }}>
          Choose a situation, clarify your tone and goal, and explore natural ways to begin your conversation.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 32,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Structured Input Form with Progressive Steps */}
        <form
          onSubmit={handleGenerate}
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 32,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* Step 1: Situation Category */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--charcoal)',
                marginBottom: 10,
              }}
            >
              1. What situation best describes what you are experiencing?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SITUATION_CATEGORIES.map((cat) => {
                const isSelected = situationCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSituationCategory(cat.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13.5,
                      fontWeight: isSelected ? 600 : 500,
                      textAlign: 'left',
                      border: isSelected ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--blush-soft)' : '#FFFFFF',
                      color: isSelected ? 'var(--burgundy-dark)' : 'var(--charcoal)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: What do you want to understand or communicate? */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--charcoal)',
                }}
              >
                2. What do you want to understand or communicate?
              </label>
              <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>{situation.length}/2000</span>
            </div>
            <textarea
              required
              rows={4}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder={activeCategoryConfig?.placeholder}
              className="input-field"
              style={{ fontSize: 14, lineHeight: 1.6, background: '#FFFFFF' }}
            />
          </div>

          {/* Step 3: Communication Goal */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--charcoal)',
                marginBottom: 10,
              }}
            >
              3. What outcome are you hoping for?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {COMMUNICATION_GOALS.map((g) => {
                const isSelected = goal === g.id
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left',
                      border: isSelected ? '1.5px solid rgba(212, 175, 55, 0.6)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--gold-subtle)' : '#FFFFFF',
                      color: 'var(--charcoal)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {g.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 4 & 5: Tone & Method */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--charcoal)',
                  marginBottom: 6,
                }}
              >
                4. What tone feels right?
              </label>
              <select
                value={preferredTone}
                onChange={(e) => setPreferredTone(e.target.value as PreferredTone)}
                className="input-field"
                style={{ fontSize: 13, background: '#FFFFFF' }}
              >
                {PREFERRED_TONES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--charcoal)',
                  marginBottom: 6,
                }}
              >
                5. Conversation format
              </label>
              <select
                value={communicationMethod}
                onChange={(e) => setCommunicationMethod(e.target.value as CommunicationMethod)}
                className="input-field"
                style={{ fontSize: 13, background: '#FFFFFF' }}
              >
                {COMMUNICATION_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 6: Optional Context */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--charcoal)',
                marginBottom: 6,
              }}
            >
              Any helpful background? (Optional)
            </label>
            <input
              type="text"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. We have had a busy week, or we usually avoid this topic"
              className="input-field"
              style={{ fontSize: 13, background: '#FFFFFF', marginBottom: 6 }}
            />
            <div
              style={{
                fontSize: 12,
                color: 'var(--gray)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Shield size={13} color="var(--gold-muted)" />
              <span>For your privacy, please avoid including sensitive personal names or addresses.</span>
            </div>
          </div>

          {errorMessage && (
            <div
              style={{
                background: '#FDF2F2',
                border: '1px solid #F8B4B4',
                color: '#9B1C1C',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !situation.trim()}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: 15 }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Preparing your conversation suggestions...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Prepare My Conversation
              </>
            )}
          </button>
        </form>

        {/* Right Column: AI Output, Customization & Saving */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!aiResult ? (
            /* Empty State */
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 48,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 460,
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--burgundy)',
                }}
              >
                <Volume2 size={24} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600 }}>Your conversation suggestions will appear here</h3>
              <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 400, lineHeight: 1.5 }}>
                Share what is happening on the left and click <strong>"Prepare My Conversation"</strong>. You will receive 3 thoughtful openings, follow-ups for common reactions, and a practical next step.
              </p>
            </div>
          ) : (
            <>
              {/* Situation overview */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderLeft: '4px solid var(--burgundy)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--burgundy)', marginBottom: 4 }}>
                  Situation overview
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
                  {aiResult.neutralSummary}
                </p>
              </div>

              {/* Three Alternative Conversation Openings */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--charcoal)' }}>
                    Conversation Openings
                  </span>
                  <span className="badge badge-neutral">Select your preferred opening</span>
                </div>

                {/* Option 1: Gentle */}
                <div
                  onClick={() => handleSelectOpening('gentle')}
                  style={{
                    background: selectedOpeningKey === 'gentle' ? 'var(--blush-soft)' : '#FFFFFF',
                    border: selectedOpeningKey === 'gentle' ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--burgundy)' }}>
                      Gentle opening
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(aiResult.openings.gentle, 'gentle')
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 11.5, minHeight: 'auto' }}
                    >
                      {copiedKey === 'gentle' ? <Check size={13} color="#27ae60" /> : <Copy size={13} />}
                      {copiedKey === 'gentle' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{aiResult.openings.gentle}"
                  </p>
                </div>

                {/* Option 2: Direct */}
                <div
                  onClick={() => handleSelectOpening('direct')}
                  style={{
                    background: selectedOpeningKey === 'direct' ? 'var(--blush-soft)' : '#FFFFFF',
                    border: selectedOpeningKey === 'direct' ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)' }}>
                      Direct opening
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(aiResult.openings.direct, 'direct')
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 11.5, minHeight: 'auto' }}
                    >
                      {copiedKey === 'direct' ? <Check size={13} color="#27ae60" /> : <Copy size={13} />}
                      {copiedKey === 'direct' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{aiResult.openings.direct}"
                  </p>
                </div>

                {/* Option 3: Firm but Respectful */}
                <div
                  onClick={() => handleSelectOpening('firm')}
                  style={{
                    background: selectedOpeningKey === 'firm' ? 'var(--blush-soft)' : '#FFFFFF',
                    border: selectedOpeningKey === 'firm' ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-muted)' }}>
                      Firm & respectful opening
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(aiResult.openings.firm, 'firm')
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 11.5, minHeight: 'auto' }}
                    >
                      {copiedKey === 'firm' ? <Check size={13} color="#27ae60" /> : <Copy size={13} />}
                      {copiedKey === 'firm' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{aiResult.openings.firm}"
                  </p>
                </div>

                {/* Comparison Explanation */}
                <div
                  style={{
                    background: 'var(--surface-tint)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 16px',
                    fontSize: 13,
                    color: 'var(--charcoal-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <strong>Why these differ:</strong> {aiResult.comparisonExplanation}
                </div>
              </div>

              {/* Follow-up Language for 4 Partner Reactions */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: 26,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={16} color="var(--burgundy)" />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--charcoal)' }}>
                    Helpful follow-ups for common reactions
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  <div style={{ background: 'var(--surface-tint)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#27ae60', textTransform: 'uppercase', marginBottom: 4 }}>
                      If your partner is receptive
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.receptive}"</p>
                  </div>

                  <div style={{ background: 'var(--surface-tint)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', marginBottom: 4 }}>
                      If your partner feels defensive
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.defensiveness}"</p>
                  </div>

                  <div style={{ background: 'var(--surface-tint)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4 }}>
                      If your partner asks for time or space
                    </div>
                    <p style={{ fontSize: 13.5, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.requestForTime}"</p>
                  </div>
                </div>
              </div>

              {/* Practical Next Step */}
              <div
                style={{
                  background: 'var(--surface-tint)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--charcoal)', marginBottom: 4 }}>
                  A practical next step
                </div>
                <p style={{ fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.5 }}>
                  {aiResult.nextStep}
                </p>
              </div>

              {/* In-Place Editing & Personalization */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit3 size={16} color="var(--burgundy)" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Personalize your chosen words</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '4px 8px', minHeight: 'auto' }}
                  >
                    {isEditing ? 'Done editing' : 'Edit opening'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    rows={3}
                    value={editedScript}
                    onChange={(e) => setEditedScript(e.target.value)}
                    className="input-field"
                    style={{ fontSize: 14, background: '#FFF' }}
                  />
                ) : (
                  <div
                    style={{
                      background: 'var(--surface-tint)',
                      borderLeft: '3px solid var(--burgundy)',
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 13.5,
                      fontStyle: 'italic',
                      color: 'var(--charcoal)',
                    }}
                  >
                    "{editedScript}"
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray)', marginBottom: 4 }}>
                    Add private notes for yourself (optional):
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Remember to take a gentle breath before starting"
                    className="input-field"
                    style={{ fontSize: 13, background: '#FFF' }}
                  />
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.5, padding: '0 4px' }}>
                <strong>Reminder:</strong> Every relationship is unique. Use these ideas as an adaptable starting point, and take breaks if either of you feels overwhelmed.
              </div>

              {/* Save Plan Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  paddingTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  <RotateCcw size={14} />
                  Regenerate Openings
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {saveSuccess && savedPlanId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/history/${savedPlanId}`)}
                      className="btn btn-secondary"
                      style={{ fontSize: 13 }}
                    >
                      View in My Conversations
                      <ArrowRight size={14} />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSavePlan}
                    disabled={isSaving || saveSuccess}
                    className="btn btn-primary"
                    style={{ fontSize: 13.5 }}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Saving to My Conversations...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <BookmarkCheck size={16} />
                        Saved to My Conversations
                      </>
                    ) : (
                      <>
                        <Bookmark size={15} />
                        Save Conversation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
