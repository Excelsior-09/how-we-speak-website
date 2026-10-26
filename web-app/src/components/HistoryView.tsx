// ==============================================================================
// HOW WE SPEAK — MY CONVERSATIONS (SAVED PLANS)
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
  Calendar,
  MessageSquare
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
    if (!window.confirm('Are you sure you want to delete this saved conversation?')) return

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
            <span className="badge badge-neutral">Private to You</span>
            <span className="badge badge-burgundy">{plans.length} Saved</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: 8, lineHeight: 1.25 }}>
            My Conversations
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 720, lineHeight: 1.6 }}>
            Review and reopen your saved conversation plans. What you practice here is private to your account.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/rehearse')}
          className="btn btn-primary"
          style={{ padding: '11px 22px', fontSize: 14 }}
        >
          <MessageSquare size={16} />
          <span>Practice a Conversation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 440 }}>
        <Search size={18} color="var(--gray)" style={{ position: 'absolute', left: 16, top: 14 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic, keyword, or words..."
          className="input-field"
          style={{ paddingLeft: 46 }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray)', fontSize: 14 }}>
          Loading your saved conversations...
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed var(--gray-border)',
            borderRadius: 'var(--radius-card)',
            padding: 56,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
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
            <History size={24} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600 }}>
            {search ? 'No conversations found' : 'Your first conversation starts here.'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 440, lineHeight: 1.5 }}>
            {search
              ? 'Try searching with a different word or clear your search to view all.'
              : 'Prepare what you want to say, explore different approaches, and save a plan for later.'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/app/rehearse')}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              Practice a Conversation
            </button>
          )}
        </div>
      ) : (
        /* Plans Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(26, 26, 26, 0.16)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                      {plan.communication_goal ? plan.communication_goal.replace(/-/g, ' ') : 'Conversation'}
                    </span>
                    {plan.communication_method && (
                      <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                        {plan.communication_method}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>{plan.title || 'Untitled Conversation'}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  title="Delete conversation"
                  aria-label="Delete conversation"
                  className="btn btn-ghost"
                  style={{ padding: '6px', color: 'var(--gray)', minHeight: 'auto' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                {plan.situation_raw.slice(0, 100)}{plan.situation_raw.length > 100 ? '...' : ''}
              </div>

              <div
                style={{
                  background: 'var(--surface-tint)',
                  borderLeft: '3px solid var(--burgundy)',
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13.5,
                  fontStyle: 'italic',
                  color: 'var(--charcoal)',
                  lineHeight: 1.6,
                }}
              >
                "{plan.chosen_script}"
              </div>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--gray)' }}>
                  <Calendar size={13} />
                  <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(plan.chosen_script, plan.id)}
                    className="btn btn-ghost"
                    style={{ padding: '6px 10px', fontSize: 12, minHeight: 'auto' }}
                  >
                    {copiedId === plan.id ? <Check size={13} color="#27ae60" /> : <Copy size={13} />}
                    <span>{copiedId === plan.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/app/history/${plan.id}`)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 12.5, minHeight: 'auto' }}
                  >
                    <span>Open</span>
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
