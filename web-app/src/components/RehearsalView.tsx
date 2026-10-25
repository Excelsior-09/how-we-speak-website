// ==============================================================================
// HOW WE SPEAK — TRYHOWWESPEAK CONVERSATION REHEARSAL WORKFLOW
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: 5-step guided preparation flow, live AI generation, 3 alternative openings,
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
    label: 'My partner seems distant or quiet',
    placeholder: 'Explain what you noticed (e.g., they stopped texting during the day, look past me when I ask questions, or seem distracted)...'
  },
  {
    id: 'recurring-argument',
    label: 'We keep arguing about the same issue',
    placeholder: 'Explain the repetitive conflict loop (e.g., spending, household tasks, family visits, tone of voice)...'
  },
  {
    id: 'need-boundary',
    label: 'I need to express a need or boundary',
    placeholder: 'Explain the specific boundary or unmet need (e.g., I need 20 minutes to decompress after work without being questioned)...'
  },
  {
    id: 'future-talk',
    label: 'I want to discuss our future or direction',
    placeholder: 'Explain what future topic you want to discuss (e.g., moving in, finances, commitments, lifestyle goals)...'
  },
  {
    id: 'other',
    label: 'Other relationship communication situation',
    placeholder: 'Describe your honest situation and what has been happening...'
  }
]

const COMMUNICATION_GOALS: { id: CommunicationGoal; label: string }[] = [
  { id: 'understand', label: 'Understand what is happening between us' },
  { id: 'explain-feelings', label: 'Explain how I feel without attacking' },
  { id: 'ask-change', label: 'Ask for a specific, realistic change' },
  { id: 'establish-boundary', label: 'Establish a respectful personal boundary' },
  { id: 'resolve-disagreement', label: 'Prepare to resolve an active disagreement' },
]

const PREFERRED_TONES: { id: PreferredTone; label: string; desc: string }[] = [
  { id: 'gentle', label: 'Gentle & Reassuring', desc: 'Prioritizes emotional warmth, vulnerability, and soothing' },
  { id: 'calm-clear', label: 'Calm, Clear & Confident', desc: 'Direct and balanced; invites collaborative problem-solving' },
  { id: 'firm-respectful', label: 'Firm but Respectful', desc: 'Sets explicit boundaries while preserving relationship commitment' },
]

const COMMUNICATION_METHODS: { id: CommunicationMethod; label: string }[] = [
  { id: 'text', label: '💬 Text Message' },
  { id: 'face-to-face', label: '🗣️ Face-to-Face' },
  { id: 'call', label: '📞 Phone or Video Call' },
]

export const RehearsalView: React.FC<RehearsalViewProps> = ({ onRequireAuth }) => {
  const { user, session, isConfigured } = useAuth()
  const { navigate } = useRouter()

  // Form Inputs
  const [situationCategory, setSituationCategory] = useState<SituationCategory>('partner-distant')
  const [situation, setSituation] = useState(
    "My partner has been quiet for two days and only gives one-word answers. It makes me anxious and I want to know if they're pulling away."
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!situation.trim() || situation.trim().length < 5) {
      setErrorMessage('Please provide a description of the situation (at least 5 characters).')
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
        throw new Error(json.error || 'Failed to generate conversation rehearsal.')
      }

      setAiResult(json.data)
      const primaryOpening = json.data.openings[selectedOpeningKey] || json.data.openings.gentle
      setEditedScript(primaryOpening)
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to the rehearsal engine.')
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

    // Route Protection Gate: if user not logged in, prompt sign in
    if (!user) {
      onRequireAuth('/app/rehearse')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    const finalChosenScript = editedScript || aiResult.openings[selectedOpeningKey]
    const planTitle = `${situationCategory.replace(/-/g, ' ').toUpperCase()} Rehearsal`

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
        setErrorMessage(err.message || 'Failed to save conversation plan to database.')
      } finally {
        setIsSaving(false)
      }
    } else {
      // Local development fallback
      const localId = 'plan_' + Math.random().toString(36).substring(2, 9)
      const existing = JSON.parse(localStorage.getItem('hws_saved_plans') || '[]')
      const updated = [{ ...planPayload, id: localId }, ...existing]
      localStorage.setItem('hws_saved_plans', JSON.stringify(updated))
      setIsSaving(false)
      setSaveSuccess(true)
      setSavedPlanId(localId)
    }
  }

  const activeCategoryConfig = SITUATION_CATEGORIES.find((c) => c.id === situationCategory)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-burgundy">Guided Conversation Preparation</span>
          <span className="badge badge-gold">Non-Diagnostic & Grounded</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: 8 }}>
          Conversation Rehearsal Studio
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 760 }}>
          Work through difficult relationship moments step-by-step. Formulate what you want to say, explore gentle vs direct openings, rehearse follow-ups for tough reactions, and save your private plan.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 32,
      }}>
        {/* Left Column: Structured Input Form */}
        <form onSubmit={handleGenerate} className="card-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. Situation Category */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 8 }}>
              1. What best describes your situation?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SITUATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSituationCategory(cat.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                    border: situationCategory === cat.id ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    background: situationCategory === cat.id ? 'var(--blush-soft)' : '#FFFFFF',
                    color: situationCategory === cat.id ? 'var(--burgundy-dark)' : 'var(--charcoal)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Situation Description */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)' }}>
                2. Explain the details or your raw thoughts
              </label>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>{situation.length}/2000</span>
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

          {/* 3. Communication Goal */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 8 }}>
              3. What is your primary goal for this conversation?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {COMMUNICATION_GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    textAlign: 'left',
                    border: goal === g.id ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                    background: goal === g.id ? 'var(--gold-subtle)' : '#FFFFFF',
                    color: 'var(--charcoal)',
                    cursor: 'pointer',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Preferred Tone & Method Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 6 }}>
                4. Preferred Tone
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
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 6 }}>
                5. Method
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

          {/* 5. Additional Context with Privacy Guidance */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)', marginBottom: 6 }}>
              6. Additional context (optional)
            </label>
            <input
              type="text"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. We have had a busy work week, or we usually avoid this topic"
              className="input-field"
              style={{ fontSize: 13, background: '#FFFFFF', marginBottom: 6 }}
            />
            <div style={{
              fontSize: 11.5,
              color: 'var(--gray)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Shield size={13} color="var(--gold)" />
              <span>Privacy notice: Avoid including identifying names, addresses, or sensitive health data.</span>
            </div>
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
            type="submit"
            disabled={isGenerating || !situation.trim()}
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: 15 }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Analyzing Situation & Drafting Scripts...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Rehearsal Plan
              </>
            )}
          </button>
        </form>

        {/* Right Column: AI Output, Customization & Saving */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {!aiResult ? (
            /* Empty State */
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
              <h3 style={{ fontSize: 20 }}>Rehearsal Studio Ready</h3>
              <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 420 }}>
                Select your situation and goal on the left and click <strong>"Generate Rehearsal Plan"</strong>. You will receive 3 tailored openings, response follow-ups, and a private plan you can edit and save.
              </p>
            </div>
          ) : (
            <>
              {/* Section A: Neutral Stated Situation Summary */}
              <div className="card-glass" style={{ padding: 22, borderLeft: '4px solid var(--burgundy)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--burgundy)', marginBottom: 4 }}>
                  Section A: Objective Situation Summary
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
                  {aiResult.neutralSummary}
                </p>
              </div>

              {/* Section B: Three Alternative Conversation Openings */}
              <div className="card-glass" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)' }}>
                    Section B: Alternative Conversation Openings
                  </span>
                  <span className="badge badge-gold">Select Your Preferred Opening</span>
                </div>

                {/* Option 1: Gentle */}
                <div
                  onClick={() => handleSelectOpening('gentle')}
                  style={{
                    background: selectedOpeningKey === 'gentle' ? 'var(--blush-soft)' : '#FFFFFF',
                    border: selectedOpeningKey === 'gentle' ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase' }}>
                      Option 1: Gentle & Softened
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(aiResult.openings.gentle, 'gentle')
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 11.5 }}
                    >
                      {copiedKey === 'gentle' ? <Check size={13} color="#2ecc71" /> : <Copy size={13} />}
                      {copiedKey === 'gentle' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {aiResult.openings.gentle}
                  </p>
                </div>

                {/* Option 2: Direct */}
                <div
                  onClick={() => handleSelectOpening('direct')}
                  style={{
                    background: selectedOpeningKey === 'direct' ? 'var(--blush-soft)' : '#FFFFFF',
                    border: selectedOpeningKey === 'direct' ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase' }}>
                      Option 2: Direct & Collaborative
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(aiResult.openings.direct, 'direct')
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 11.5 }}
                    >
                      {copiedKey === 'direct' ? <Check size={13} color="#2ecc71" /> : <Copy size={13} />}
                      {copiedKey === 'direct' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {aiResult.openings.direct}
                  </p>
                </div>

                {/* Option 3: Firm but Respectful */}
                <div
                  onClick={() => handleSelectOpening('firm')}
                  style={{
                    background: selectedOpeningKey === 'firm' ? 'var(--blush-soft)' : '#FFFFFF',
                    border: selectedOpeningKey === 'firm' ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold-muted)', textTransform: 'uppercase' }}>
                      Option 3: Firm but Respectful
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(aiResult.openings.firm, 'firm')
                      }}
                      className="btn btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 11.5 }}
                    >
                      {copiedKey === 'firm' ? <Check size={13} color="#2ecc71" /> : <Copy size={13} />}
                      {copiedKey === 'firm' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    {aiResult.openings.firm}
                  </p>
                </div>

                {/* Section C: Comparison Explanation */}
                <div style={{
                  background: 'var(--cream)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: 'var(--charcoal-muted)',
                }}>
                  <strong>Difference between options:</strong> {aiResult.comparisonExplanation}
                </div>
              </div>

              {/* Section D: Follow-up Language for 4 Partner Reactions */}
              <div className="card-glass" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={17} color="var(--burgundy)" />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)' }}>
                    Section D: Follow-Up Language for Partner Reactions
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#27ae60', textTransform: 'uppercase', marginBottom: 4 }}>
                      Receptive Response
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.receptive}"</p>
                  </div>

                  <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Disagreement
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.disagreement}"</p>
                  </div>

                  <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Defensiveness
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.defensiveness}"</p>
                  </div>

                  <div style={{ background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--charcoal-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                      Request for Time / Space
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic' }}>"{aiResult.followups.requestForTime}"</p>
                  </div>
                </div>
              </div>

              {/* Section E: One Practical Next Step */}
              <div className="card-glass" style={{ padding: 20, background: 'var(--cream)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 4 }}>
                  Section E: Recommended Practical Next Step
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--charcoal)' }}>{aiResult.nextStep}</p>
              </div>

              {/* In-Place Editing & Personalization */}
              <div className="card-glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Edit3 size={16} color="var(--burgundy)" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Personalize Selected Opening Before Saving</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                  >
                    {isEditing ? 'Done Editing' : 'Customize Script'}
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    rows={3}
                    value={editedScript}
                    onChange={(e) => setEditedScript(e.target.value)}
                    className="input-field"
                    style={{ fontSize: 13.5, background: '#FFF' }}
                  />
                ) : (
                  <div style={{
                    background: '#FFFFFF',
                    borderLeft: '3px solid var(--burgundy)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontStyle: 'italic',
                    color: 'var(--charcoal)',
                  }}>
                    "{editedScript}"
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--gray)', marginBottom: 4 }}>
                    Add private notes or reminders for yourself:
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Remember to sit next to them, not across the table"
                    className="input-field"
                    style={{ fontSize: 12.5, background: '#FFF' }}
                  />
                </div>
              </div>

              {/* Ethical Disclaimer */}
              <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.5, padding: '0 4px' }}>
                <strong>Disclaimer:</strong> {aiResult.disclaimer}
              </div>

              {/* Save Plan Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                paddingTop: 8,
              }}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn btn-secondary"
                  style={{ fontSize: 13, padding: '10px 18px' }}
                >
                  <RotateCcw size={14} />
                  Regenerate Options
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {saveSuccess && savedPlanId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/app/history/${savedPlanId}`)}
                      className="btn btn-secondary"
                      style={{ fontSize: 13, padding: '10px 18px' }}
                    >
                      View in My Plans
                      <ArrowRight size={14} />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSavePlan}
                    disabled={isSaving || saveSuccess}
                    className="btn btn-primary"
                    style={{ fontSize: 13.5, padding: '10px 22px' }}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Saving to Vault...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <BookmarkCheck size={16} />
                        Plan Saved Successfully
                      </>
                    ) : (
                      <>
                        <Bookmark size={15} />
                        Save Conversation Plan
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
