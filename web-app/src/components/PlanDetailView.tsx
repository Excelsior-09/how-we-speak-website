// ==============================================================================
// HOW WE SPEAK — INDIVIDUAL SAVED PLAN DETAIL VIEW
// Route: /app/history/:id
// Features: View full plan, edit opening script, save changes to database, copy
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  Trash2,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'
import type { RehearsalPlan } from '../types/database'

interface PlanDetailViewProps {
  planId: string
}

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ planId }) => {
  const { user, isConfigured } = useAuth()
  const { navigate } = useRouter()
  const [plan, setPlan] = useState<RehearsalPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // In-Place Editing State
  const [isEditing, setIsEditing] = useState(false)
  const [editedScript, setEditedScript] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlan() {
      setLoading(true)
      if (user && isConfigured) {
        try {
          const { data, error } = await supabase
            .from('rehearsal_plans')
            .select('*')
            .eq('id', planId)
            .eq('user_id', user.id)
            .single()

          if (!error && data) {
            setPlan(data as RehearsalPlan)
            setEditedScript((data as RehearsalPlan).chosen_script)
          }
        } catch (err) {
          console.warn('Error fetching plan:', err)
        }
      } else {
        const local = localStorage.getItem('hws_saved_plans')
        if (local) {
          try {
            const list: RehearsalPlan[] = JSON.parse(local)
            const found = list.find((p) => p.id === planId)
            if (found) {
              setPlan(found)
              setEditedScript(found.chosen_script)
            }
          } catch {
            // No-op
          }
        }
      }
      setLoading(false)
    }

    loadPlan()
  }, [planId, user, isConfigured])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSaveChanges = async () => {
    if (!plan) return
    setIsSaving(true)
    setSaveMessage(null)

    const updatedPlan: RehearsalPlan = {
      ...plan,
      chosen_script: editedScript,
      updated_at: new Date().toISOString(),
    }

    if (user && isConfigured) {
      try {
        const { error } = await supabase
          .from('rehearsal_plans')
          .update({
            chosen_script: editedScript,
            updated_at: new Date().toISOString(),
          })
          .eq('id', plan.id)
          .eq('user_id', user.id)

        if (error) throw error
        setPlan(updatedPlan)
        setIsEditing(false)
        setSaveMessage('Plan updated successfully.')
      } catch (err: any) {
        setSaveMessage(err.message || 'Failed to update plan.')
      } finally {
        setIsSaving(false)
      }
    } else {
      const local = JSON.parse(localStorage.getItem('hws_saved_plans') || '[]')
      const updatedList = local.map((p: RehearsalPlan) => (p.id === plan.id ? updatedPlan : p))
      localStorage.setItem('hws_saved_plans', JSON.stringify(updatedList))
      setPlan(updatedPlan)
      setIsEditing(false)
      setIsSaving(false)
      setSaveMessage('Plan updated locally.')
    }
  }

  const handleDelete = async () => {
    if (!plan) return
    if (!window.confirm('Delete this saved conversation plan?')) return

    if (user && isConfigured) {
      await supabase.from('rehearsal_plans').delete().eq('id', plan.id).eq('user_id', user.id)
    }

    const local = JSON.parse(localStorage.getItem('hws_saved_plans') || '[]')
    const filtered = local.filter((p: RehearsalPlan) => p.id !== plan.id)
    localStorage.setItem('hws_saved_plans', JSON.stringify(filtered))

    navigate('/app/history')
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--gray)' }}>
        Loading conversation plan...
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="card-glass" style={{ padding: 48, textAlign: 'center' }}>
        <h3>Plan Not Found</h3>
        <p style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8 }}>
          This conversation plan may have been deleted or belongs to a different account.
        </p>
        <button
          onClick={() => navigate('/app/history')}
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
        >
          <ArrowLeft size={14} /> Back to My Conversations
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/app/history')}
          className="btn btn-ghost"
          style={{ padding: '6px 12px', fontSize: 13 }}
        >
          <ArrowLeft size={15} />
          Back to My Conversations
        </button>

        <button
          onClick={handleDelete}
          className="btn btn-ghost"
          style={{ color: '#9b1c1c', fontSize: 13 }}
        >
          <Trash2 size={15} />
          Delete Conversation
        </button>
      </div>

      {/* Plan Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="badge badge-burgundy">{plan.communication_goal?.replace(/-/g, ' ')}</span>
            <span className="badge badge-gold">{plan.selected_tone}</span>
            {plan.communication_method && (
              <span className="badge badge-blush">{plan.communication_method}</span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 3vw, 36px)', marginBottom: 6 }}>{plan.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray)' }}>
            <Calendar size={13} />
            <span>Saved on {new Date(plan.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <button
          onClick={() => handleCopy(plan.chosen_script, 'primary')}
          className="btn btn-primary"
          style={{ padding: '10px 18px', fontSize: 13 }}
        >
          {copiedKey === 'primary' ? <Check size={14} /> : <Copy size={14} />}
          {copiedKey === 'primary' ? 'Copied Primary Script' : 'Copy Primary Script'}
        </button>
      </div>

      {saveMessage && (
        <div style={{
          background: 'var(--cream)',
          border: '1px solid var(--gold)',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--charcoal)',
        }}>
          {saveMessage}
        </div>
      )}

      {/* Primary Chosen Script Card */}
      <div className="card-glass" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--burgundy)' }}>
            Chosen Opening Script
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 8px' }}
          >
            <Edit3 size={13} />
            {isEditing ? 'Cancel Edit' : 'Edit Script'}
          </button>
        </div>

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              rows={4}
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              className="input-field"
              style={{ fontSize: 14, background: '#FFF' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: 12.5 }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#FFFFFF',
            borderLeft: '4px solid var(--burgundy)',
            padding: 18,
            borderRadius: 'var(--radius-sm)',
            fontSize: 15,
            fontStyle: 'italic',
            color: 'var(--charcoal)',
            lineHeight: 1.6,
          }}>
            "{plan.chosen_script}"
          </div>
        )}
      </div>

      {/* Stated Situation & Neutral Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
      }}>
        <div className="card-glass" style={{ padding: 22 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray)', marginBottom: 6 }}>
            Your Stated Raw Situation
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
            "{plan.situation_raw}"
          </p>
        </div>

        {plan.structured_result?.neutralSummary && (
          <div className="card-glass" style={{ padding: 22, borderLeft: '3px solid var(--gold)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-muted)', marginBottom: 6 }}>
              Objective Situation Summary
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--charcoal-muted)', lineHeight: 1.6 }}>
              {plan.structured_result.neutralSummary}
            </p>
          </div>
        )}
      </div>

      {/* Alternative Openings Reference */}
      {plan.structured_result?.openings && (
        <div className="card-glass" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.08em' }}>
            Alternative Script Variations
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div style={{ background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', marginBottom: 4 }}>
                Gentle Opening
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                {plan.structured_result.openings.gentle}
              </p>
            </div>

            <div style={{ background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', marginBottom: 4 }}>
                Direct Opening
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                {plan.structured_result.openings.direct}
              </p>
            </div>

            <div style={{ background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                Firm Opening
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                {plan.structured_result.openings.firm}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up Language Reference */}
      {plan.structured_result?.followups && (
        <div className="card-glass" style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="var(--burgundy)" />
            <span style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--charcoal)' }}>
              Follow-Up Responses to Partner Reactions
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <div style={{ background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#27ae60', textTransform: 'uppercase', marginBottom: 4 }}>
                If Partner Is Receptive
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                "{plan.structured_result.followups.receptive}"
              </p>
            </div>

            <div style={{ background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', marginBottom: 4 }}>
                If Partner Gets Defensive
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                "{plan.structured_result.followups.defensiveness}"
              </p>
            </div>

            <div style={{ background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                If Partner Requests Time
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                "{plan.structured_result.followups.requestForTime}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Practical Action Reminder */}
      {plan.action_reminders && plan.action_reminders.length > 0 && (
        <div className="card-glass" style={{ padding: 20, background: 'var(--cream)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: 4 }}>
            Practical Grounding Reminder
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--charcoal)' }}>{plan.action_reminders[0]}</p>
        </div>
      )}
    </div>
  )
}
