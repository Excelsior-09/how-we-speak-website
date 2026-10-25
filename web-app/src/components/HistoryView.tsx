// ==============================================================================
// HOW WE SPEAK — SAVED CONVERSATION PLANS (HISTORY)
// Route: /app/history
// Features: List saved plans, search, quick copy, delete, navigate to detail
// ==============================================================================

import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'
import type { RehearsalPlan } from '../types/database'

export const HistoryView: React.FC = () => {
  const { user, isConfigured } = useAuth()
  const { navigate } = useRouter()
  const [plans, setPlans] = useState<RehearsalPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadPlans() {
      setLoading(true)
      if (user && isConfigured) {
        try {
          const { data, error } = await supabase
            .from('rehearsal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (!error && data) {
            setPlans(data as RehearsalPlan[])
          }
        } catch (err) {
          console.warn('Error loading plans from Supabase:', err)
        }
      } else {
        const local = localStorage.getItem('hws_saved_plans')
        if (local) {
          try {
            setPlans(JSON.parse(local))
          } catch {
            setPlans([])
          }
        }
      }
      setLoading(false)
    }

    loadPlans()
  }, [user, isConfigured])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this saved plan?')) return

    if (user && isConfigured) {
      await supabase.from('rehearsal_plans').delete().eq('id', id).eq('user_id', user.id)
    }

    const filtered = plans.filter((p) => p.id !== id)
    setPlans(filtered)
    localStorage.setItem('hws_saved_plans', JSON.stringify(filtered))
  }

  const filtered = plans.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.situation_raw?.toLowerCase().includes(q) ||
      p.chosen_script?.toLowerCase().includes(q) ||
      p.communication_goal?.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-burgundy">Encrypted Vault</span>
            <span className="badge badge-gold">{plans.length} Saved Plans</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: 8 }}>
            Saved Conversation Plans
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 720 }}>
            Review, edit, and practice your conversation plans before initiating with your partner. Your plans are strictly private to your account.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/rehearse')}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: 13.5 }}
        >
          <Sparkles size={15} />
          New Rehearsal
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 440 }}>
        <Search size={18} color="var(--gray)" style={{ position: 'absolute', left: 16, top: 14 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plans by situation, keyword, or script..."
          className="input-field"
          style={{ paddingLeft: 46 }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray)' }}>
          Loading your conversation plans...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="card-glass" style={{ padding: 60, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
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
            <History size={28} />
          </div>
          <h3 style={{ fontSize: 20 }}>No Saved Plans Found</h3>
          <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 420 }}>
            {search ? 'No plans match your search query.' : 'You have not saved any conversation rehearsals yet. Rehearse a situation to prepare your opening and follow-up.'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/app/rehearse')}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              Start Your First Rehearsal
            </button>
          )}
        </div>
      ) : (
        /* Plans Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
        }}>
          {filtered.map((plan) => (
            <div
              key={plan.id}
              className="card-glass"
              style={{
                padding: 26,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                transition: 'transform var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span className="badge badge-burgundy" style={{ fontSize: 10.5 }}>
                      {plan.communication_goal?.replace(/-/g, ' ')}
                    </span>
                    {plan.communication_method && (
                      <span className="badge badge-gold" style={{ fontSize: 10.5 }}>
                        {plan.communication_method}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 18 }}>{plan.title}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  title="Delete Plan"
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px', color: 'var(--gray)' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ fontSize: 12.5, color: 'var(--gray)', fontStyle: 'italic' }}>
                Situation: "{plan.situation_raw.slice(0, 90)}{plan.situation_raw.length > 90 ? '...' : ''}"
              </div>

              <div style={{
                background: '#FFFFFF',
                borderLeft: '3px solid var(--burgundy)',
                padding: 14,
                borderRadius: 'var(--radius-sm)',
                fontSize: 13.5,
                fontStyle: 'italic',
                color: 'var(--charcoal)',
                lineHeight: 1.6,
              }}>
                "{plan.chosen_script}"
              </div>

              <div style={{
                marginTop: 'auto',
                paddingTop: 12,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--gray)' }}>
                  <Calendar size={13} />
                  <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(plan.chosen_script, plan.id)}
                    className="btn btn-ghost"
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    {copiedId === plan.id ? <Check size={13} color="#2ecc71" /> : <Copy size={13} />}
                    {copiedId === plan.id ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/app/history/${plan.id}`)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    <span>View Plan</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
