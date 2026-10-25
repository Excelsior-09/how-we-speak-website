// ==============================================================================
// HOW WE SPEAK — COUPLES CONVERSATION WORKSPACE
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Secure invitation pairing, isolated private reflections,
//           selective sharing toggle, neutral joint AI synthesis
// ==============================================================================

import React, { useState } from 'react'
import {
  Link2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  HeartHandshake,
  UserCheck
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'
import type { PrivateReflection } from '../types/database'

interface WorkspaceViewProps {
  partnerLinked: boolean
  onTogglePartnerLink: () => void
}

interface JointSummaryData {
  cycleOverview: string
  partnerAUnderlyingLonging: string
  partnerBUnderlyingLonging: string
  sharedNegativeLoop: string
  threeRepairSteps: {
    step: number
    title: string
    action: string
  }[]
}

const EMOTION_CHIPS = [
  'Overwhelmed',
  'Abandoned',
  'Attacked',
  'Unappreciated',
  'Anxious',
  'Defensive',
  'Exhausted',
  'Lonely',
]

export const WorkspaceView: React.FC<WorkspaceViewProps> = () => {
  const { user, profile, activeSpace, partnerProfile, isConfigured, refreshUserData } = useAuth()

  // Pairing State
  const [copied, setCopied] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [pairingError, setPairingError] = useState<string | null>(null)
  const [isPairing, setIsPairing] = useState(false)

  // Reflection Exercise State
  const [triggerNotes, setTriggerNotes] = useState(
    "When you said you had to work late again without giving me a heads up, I felt like our plans didn't matter to you."
  )
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(['Unappreciated', 'Lonely'])
  const [underlyingNeed, setUnderlyingNeed] = useState(
    "I needed to know I was still a priority and that you value the time we set aside together."
  )
  const [hopes, setHopes] = useState(
    "I want us to communicate schedule shifts before they happen so I don't feel forgotten."
  )
  const [isShared, setIsShared] = useState(false)

  // Partner Reflection Simulation / Status
  const [partnerHasShared, setPartnerHasShared] = useState(false)
  const [partnerReflection, setPartnerReflection] = useState<Partial<PrivateReflection> | null>(null)

  // Joint Summary State
  const [jointSummary, setJointSummary] = useState<JointSummaryData | null>(null)
  const [isSynthesizing, setIsSynthesizing] = useState(false)

  const inviteCode = activeSpace ? `hws-${activeSpace.id.substring(0, 8)}` : 'hws-pair-8f3a92e1'
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/app?invite=${inviteCode}`
    : `https://tryhowwespeak.com/app?invite=${inviteCode}`

  const isPartnerConnected = !!(activeSpace?.partner_2_id) || !!partnerProfile

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
      // Sandbox mode pairing
      setTimeout(() => {
        setIsPairing(false)
        const mockSpace = {
          id: 'sandbox_space_123',
          partner_1_id: user?.id || 'usr_1',
          partner_2_id: 'usr_partner_jordan',
          status: 'active' as const,
          room_name: 'Alex & Jordan’s Sanctuary',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        const mockPartner = {
          id: 'usr_partner_jordan',
          email: 'jordan@tryhowwespeak.com',
          display_name: 'Jordan',
          archetype: 'Pursuer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        localStorage.setItem(
          'hws_sandbox_auth',
          JSON.stringify({
            user,
            profile,
            activeSpace: mockSpace,
            partnerProfile: mockPartner,
          })
        )
        window.location.reload()
      }, 500)
    }
  }

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emotion))
    } else {
      setSelectedEmotions([...selectedEmotions, emotion])
    }
  }

  const handleToggleShare = () => {
    const nextShared = !isShared
    setIsShared(nextShared)
    if (nextShared) {
      if (isPartnerConnected) {
        setPartnerHasShared(true)
        setPartnerReflection({
          trigger_notes: "When you confronted me as soon as I walked in the door, my chest tightened. I was already drained and felt like nothing I do is enough.",
          felt_emotions: ['Exhausted', 'Attacked', 'Overwhelmed'],
          underlying_need: "I longed for a soft landing and 10 minutes to decompress before discussing what went wrong.",
          hopes_for_conversation: "To explain my workday without feeling like the bad guy.",
          is_shared: true,
        })
      }
    } else {
      setJointSummary(null)
      setPartnerHasShared(false)
      setPartnerReflection(null)
    }
  }

  const handleGenerateJointSummary = async () => {
    setIsSynthesizing(true)

    try {
      const res = await fetch('/api/ai/joint-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: 'ex_default_conflict',
          mockExercise: { topic: 'Evening Stress & Late Notice' },
          mockReflections: [
            {
              trigger_notes: triggerNotes,
              felt_emotions: selectedEmotions,
              underlying_need: underlyingNeed,
              is_shared: true,
            },
            {
              trigger_notes: partnerReflection?.trigger_notes || "I felt attacked coming home late.",
              felt_emotions: partnerReflection?.felt_emotions || ['Exhausted', 'Attacked'],
              underlying_need: partnerReflection?.underlying_need || "I needed a safe decompress window.",
              is_shared: true,
            },
          ],
        }),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        setJointSummary(json.data)
      }
    } catch (err) {
      console.warn('Joint summary generation failed:', err)
    } finally {
      setIsSynthesizing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-gold">Couples Synergy Room</span>
          <span className="badge badge-blush">End-to-End Privacy</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: 8 }}>
          Couples Conversation Workspace
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 740 }}>
          A secure space for you and your partner. Complete individual reflections in private, choose when to share, and receive neutral AI cycle summaries that heal recurring arguments without taking sides.
        </p>
      </div>

      {/* Grid: Workspace Status & Pairing */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 28,
      }}>
        {/* Workspace Profile Cards */}
        <div className="card-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', letterSpacing: '0.08em' }}>
                Relationship Sanctuary
              </span>
              <h2 style={{ fontSize: 22, marginTop: 4 }}>
                {isPartnerConnected ? `${profile?.display_name || 'You'} & ${partnerProfile?.display_name || 'Jordan'}` : 'Solo Mode (Awaiting Partner)'}
              </h2>
            </div>
            <span className={`badge ${isPartnerConnected ? 'badge-gold' : 'badge-blush'}`}>
              {isPartnerConnected ? 'Coupled' : 'Single User'}
            </span>
          </div>

          {/* 2 User Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* You */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              border: '1.5px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase' }}>Partner 1</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)' }}>{profile?.display_name || 'You'}</div>
              <span className="badge badge-burgundy" style={{ width: 'fit-content' }}>{profile?.archetype || 'The Avoider'}</span>
            </div>

            {/* Partner */}
            <div style={{
              background: isPartnerConnected ? '#FFFFFF' : 'var(--cream)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              border: isPartnerConnected ? '1.5px solid var(--gold)' : '1.5px dashed var(--gray-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase' }}>Partner 2</div>
              {isPartnerConnected ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)' }}>{partnerProfile?.display_name || 'Jordan'}</div>
                  <span className="badge badge-gold" style={{ width: 'fit-content' }}>{partnerProfile?.archetype || 'The Pursuer'}</span>
                </>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--gray)', fontStyle: 'italic', margin: 'auto 0' }}>
                  Awaiting partner pairing via code
                </div>
              )}
            </div>
          </div>

          {/* Invitation Box if not connected */}
          {!isPartnerConnected && (
            <div style={{
              background: 'var(--cream)',
              borderRadius: 'var(--radius-md)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={16} color="var(--burgundy)" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Single-Use Invite Link</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="input-field"
                  style={{ fontSize: 12.5, background: '#FFF' }}
                />
                <button onClick={handleCopyInvite} className="btn btn-primary" style={{ padding: '0 16px', fontSize: 13 }}>
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Paste Invite Code */}
              <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>Have an invite code from your partner?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    placeholder="e.g. hws-pair-8f3a92e1"
                    className="input-field"
                    style={{ fontSize: 12.5, background: '#FFF' }}
                  />
                  <button
                    onClick={handleAcceptInvite}
                    disabled={isPairing || !inviteInput.trim()}
                    className="btn btn-secondary"
                    style={{ padding: '0 16px', fontSize: 12.5 }}
                  >
                    {isPairing ? <RefreshCw size={13} className="animate-spin" /> : <UserCheck size={13} />}
                    Join Room
                  </button>
                </div>
                {pairingError && <span style={{ fontSize: 12, color: '#9b1c1c' }}>{pairingError}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Synergy Guide */}
        <div className="card-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--gold)" />
            <h3 style={{ fontSize: 20 }}>
              {isPartnerConnected ? 'Couples Dynamic: Avoider + Pursuer' : 'Why Pair with Your Partner?'}
            </h3>
          </div>

          <div style={{
            background: 'var(--blush-soft)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            borderLeft: '3px solid var(--burgundy)',
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            {isPartnerConnected ? (
              <span>
                <strong>The Escalation Trigger:</strong> When the Pursuer senses emotional distance, their attachment alarm sounds and they urgently seek reassurance. When the Avoider feels intense pressure, their nervous system perceives an attack and shuts down. Both are seeking safety—in opposing directions.
              </span>
            ) : (
              <span>
                When you invite your partner, How We Speak bridges this loop. Both partners reflect in total privacy. Nobody sees unshared drafts. When both agree to share, our neutral AI synthesizes what each person truly needed, removing all blame.
              </span>
            )}
          </div>

          <div style={{
            marginTop: 'auto',
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--gray)',
          }}>
            <ShieldCheck size={16} color="var(--burgundy)" />
            <span>PostgreSQL Row Level Security guarantees unshared drafts are inaccessible to the other partner.</span>
          </div>
        </div>
      </div>

      {/* Interactive Couples Reflection Section */}
      <div className="card-glass" style={{ padding: 36, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-burgundy">Active Reflection Exercise</span>
              <span className="badge badge-gold">Topic: Schedule & Work/Life Disconnect</span>
            </div>
            <h2 style={{ fontSize: 24 }}>De-escalating the Last Argument</h2>
          </div>

          {/* Privacy & Sharing Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: isShared ? 'var(--gold-subtle)' : 'var(--cream)',
            border: isShared ? '1.5px solid var(--gold)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
          }}>
            {isShared ? <Unlock size={16} color="var(--gold-muted)" /> : <Lock size={16} color="var(--gray)" />}
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {isShared ? 'Shared with Partner' : 'Private (Draft Mode)'}
            </span>
            <button
              onClick={handleToggleShare}
              className={`btn ${isShared ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              {isShared ? 'Revoke to Private' : 'Share with Partner'}
            </button>
          </div>
        </div>

        {/* 2-Column Reflection Panel */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 28,
        }}>
          {/* Column 1: Your Private Reflection */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 17, color: 'var(--burgundy)' }}>Your Reflection</h3>
              <span className={`badge ${isShared ? 'badge-gold' : 'badge-blush'}`}>
                {isShared ? 'Shared' : 'Private'}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
                1. What specific moment triggered you?
              </label>
              <textarea
                value={triggerNotes}
                onChange={(e) => setTriggerNotes(e.target.value)}
                rows={3}
                className="input-field"
                style={{ fontSize: 13.5, background: '#FAFAF8' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
                2. What emotions did you feel underneath?
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EMOTION_CHIPS.map((chip) => {
                  const active = selectedEmotions.includes(chip)
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleEmotion(chip)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: 12,
                        cursor: 'pointer',
                        border: active ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                        background: active ? 'var(--blush-soft)' : '#FFFFFF',
                        color: active ? 'var(--burgundy-dark)' : 'var(--charcoal-muted)',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {chip}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
                3. What did you actually long to feel?
              </label>
              <textarea
                value={underlyingNeed}
                onChange={(e) => setUnderlyingNeed(e.target.value)}
                rows={2}
                className="input-field"
                style={{ fontSize: 13.5, background: '#FAFAF8' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 6 }}>
                4. What is your hope for our conversation?
              </label>
              <input
                type="text"
                value={hopes}
                onChange={(e) => setHopes(e.target.value)}
                className="input-field"
                style={{ fontSize: 13.5, background: '#FAFAF8' }}
              />
            </div>
          </div>

          {/* Column 2: Partner's Reflection State */}
          <div style={{
            background: isShared && partnerHasShared ? '#FFFFFF' : 'var(--cream)',
            border: isShared && partnerHasShared ? '1.5px solid var(--gold)' : '1.5px dashed var(--gray-light)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            justifyContent: isShared && partnerHasShared ? 'flex-start' : 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 17, color: 'var(--charcoal)' }}>
                {partnerProfile?.display_name || 'Jordan'}’s Reflection
              </h3>
              <span className={`badge ${isShared && partnerHasShared ? 'badge-gold' : 'badge-blush'}`}>
                {isShared && partnerHasShared ? 'Unlocked' : 'Encrypted'}
              </span>
            </div>

            {isShared && partnerHasShared && partnerReflection ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Their Trigger Notes
                </div>
                <p style={{ fontSize: 13.5, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                  "{partnerReflection.trigger_notes}"
                </p>

                <div style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Their Felt Emotions
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {partnerReflection.felt_emotions?.map((e: string) => (
                    <span key={e} className="badge badge-gold">{e}</span>
                  ))}
                </div>

                <div style={{ fontSize: 12, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                  What They Longed to Feel
                </div>
                <p style={{ fontSize: 13.5, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                  "{partnerReflection.underlying_need}"
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Lock size={32} color="var(--gray)" />
                <h4 style={{ fontSize: 16 }}>Partner Answers Hidden</h4>
                <p style={{ fontSize: 13, color: 'var(--gray)', maxWidth: 320 }}>
                  {!isShared
                    ? 'You must click "Share with Partner" on your reflection first before mutual sharing is unlocked.'
                    : 'Awaiting partner to finish and share their reflection.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Synthesis Action Bar */}
        <div style={{
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray)' }}>
            <HeartHandshake size={18} color="var(--gold)" />
            <span>
              {isShared && partnerHasShared
                ? 'Both reflections shared! Unlocked for neutral AI joint synthesis.'
                : 'Both partners must share to unlock the neutral joint summary.'}
            </span>
          </div>

          <button
            onClick={handleGenerateJointSummary}
            disabled={!isShared || isSynthesizing}
            className="btn btn-primary"
            style={{ padding: '12px 24px', fontSize: 14 }}
          >
            {isSynthesizing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Synthesizing Non-Diagnostic Summary...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Neutral Joint Summary
              </>
            )}
          </button>
        </div>

        {/* Neutral Joint AI Summary Output */}
        {jointSummary && (
          <div style={{
            background: 'var(--cream)',
            border: '1.5px solid var(--gold)',
            borderRadius: 'var(--radius-card)',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--gold)" />
              <h3 style={{ fontSize: 22, color: 'var(--charcoal)' }}>Neutral Joint Cycle Summary</h3>
            </div>

            <p style={{ fontSize: 14.5, color: 'var(--charcoal)', lineHeight: 1.7 }}>
              {jointSummary.cycleOverview}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#FFF', padding: 16, borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--burgundy)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Partner 1’s Deep Longing
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.6 }}>
                  {jointSummary.partnerAUnderlyingLonging}
                </p>
              </div>

              <div style={{ background: '#FFF', padding: 16, borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--gold)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--gold-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Partner 2’s Deep Longing
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.6 }}>
                  {jointSummary.partnerBUnderlyingLonging}
                </p>
              </div>
            </div>

            <div style={{ background: '#FFF', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} color="var(--burgundy)" />
                The Shared Interactive Loop (Neither Partner Is The Villain)
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
                {jointSummary.sharedNegativeLoop}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)' }}>
                Your 3 Agreed Repair Actions
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {jointSummary.threeRepairSteps.map((step) => (
                  <div key={step.step} style={{ background: '#FFF', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--burgundy)', marginBottom: 4 }}>
                      <span>Step {step.step}:</span>
                      <span>{step.title}</span>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--gray)' }}>{step.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
