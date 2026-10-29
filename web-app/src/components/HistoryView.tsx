// ==============================================================================
// HOW WE SPEAK — MY CONVERSATIONS (SAVED PLANS & MIRA CHATS)
// Route: /app/history
// Features: List saved plans, Mira chat history, search, quick copy, delete, navigate
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
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'
import type { RehearsalPlan, MiraConversation } from '../types/database'

export const HistoryView: React.FC = () => {
  const { user, isConfigured } = useAuth()
  const { navigate } = useRouter()
  const [activeTab, setActiveTab] = useState<'plans' | 'mira'>('plans')
  const [plans, setPlans] = useState<RehearsalPlan[]>([])
  const [miraConvs, setMiraConvs] = useState<MiraConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      if (user && isConfigured) {
        try {
          const [plansRes, miraRes] = await Promise.all([
            supabase.from('rehearsal_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('mira_conversations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false })
          ])

          if (!plansRes.error && plansRes.data) {
            setPlans(plansRes.data as RehearsalPlan[])
          }
          if (!miraRes.error && miraRes.data) {
            setMiraConvs(miraRes.data as MiraConversation[])
          }
        } catch (err) {
          console.warn('Error loading history from Supabase:', err)
        }
      } else {
        const local = localStorage.getItem('hws_saved_plans')
        if (local) {
          try { setPlans(JSON.parse(local)) } catch { setPlans([]) }
        }
        const localMira = localStorage.getItem('hws_mira_conversations')
        if (localMira) {
          try { setMiraConvs(JSON.parse(localMira)) } catch { setMiraConvs([]) }
        }
      }
      setLoading(false)
    }

    loadData()
  }, [user, isConfigured])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this saved conversation plan?')) return

    if (user && isConfigured) {
      await supabase.from('rehearsal_plans').delete().eq('id', id).eq('user_id', user.id)
    }

    const filtered = plans.filter((p) => p.id !== id)
    setPlans(filtered)
    localStorage.setItem('hws_saved_plans', JSON.stringify(filtered))
  }

  const handleDeleteMiraConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this conversation with Mira?')) return
    if (user && isConfigured) {
      await supabase.from('mira_conversations').delete().eq('id', id).eq('user_id', user.id)
    }
    const filteredM = miraConvs.filter(c => c.id !== id)
    setMiraConvs(filteredM)
    localStorage.setItem('hws_mira_conversations', JSON.stringify(filteredM))
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

  const filteredMira = miraConvs.filter((c) => {
    const q = search.toLowerCase()
    return c.title?.toLowerCase().includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-neutral">Private to You</span>
            <span className="badge badge-burgundy">{plans.length + miraConvs.length} Saved</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: 8, lineHeight: 1.25 }}>
            My Conversations
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 720, lineHeight: 1.6 }}>
            Review and reopen your saved conversation plans. Revisit past rehearsals and Mira chats with end-to-end privacy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app/mira')}
            className="btn btn-secondary"
            style={{ padding: '11px 20px', fontSize: 14 }}
          >
            <Sparkles size={16} />
            <span>Talk to Mira</span>
          </button>
          <button
            onClick={() => navigate('/app/rehearse')}
            className="btn btn-primary"
            style={{ padding: '11px 22px', fontSize: 14 }}
          >
            <MessageSquare size={16} />
            <span>Practice a Conversation</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('plans')}
            className={`btn ${activeTab === 'plans' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '7px 16px' }}
          >
            <MessageSquare size={14} />
            <span>Practice Plans ({plans.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('mira')}
            className={`btn ${activeTab === 'mira' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '7px 16px' }}
          >
            <Sparkles size={14} />
            <span>Mira Chats ({miraConvs.length})</span>
          </button>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <Search size={18} color="var(--gray)" style={{ position: 'absolute', left: 16, top: 14 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic or keyword..."
            className="input-field"
            style={{ paddingLeft: 46 }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray)', fontSize: 14 }}>
          Loading your saved conversations...
        </div>
      ) : activeTab === 'plans' ? (
        filtered.length === 0 ? (
          /* Empty State for Plans */
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
              {search ? 'No practice plans found' : 'Your first conversation plan starts here.'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 440, lineHeight: 1.5 }}>
              Prepare what you want to say, explore different approaches, and save a plan for later.
            </p>
            <button
              onClick={() => navigate('/app/rehearse')}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              Practice a Conversation
            </button>
          </div>
        ) : (
          /* Plans Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
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
                    style={{ color: 'var(--gray)', padding: 6, minHeight: 'auto' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p style={{
                  fontSize: 13.5,
                  color: 'var(--charcoal-muted)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: 0,
                }}>
                  {plan.chosen_script}
                </p>

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
        )
      ) : (
        /* Mira Conversations Tab */
        filteredMira.length === 0 ? (
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
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600 }}>
              {search ? 'No Mira conversations found' : 'Start a conversation with Mira'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 440, lineHeight: 1.5 }}>
              Talk through relationship dynamics, rehearse difficult moments, and get structured practical guidance.
            </p>
            <button
              onClick={() => navigate('/app/mira')}
              className="btn btn-primary"
              style={{ marginTop: 8 }}
            >
              Open Mira Companion
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
              gap: 20,
            }}
          >
            {filteredMira.map((conv) => (
              <div
                key={conv.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--burgundy-subtle)',
                      color: 'var(--burgundy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
                        {conv.title || 'Conversation with Mira'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {conv.is_shared ? (
                          <span className="badge badge-gold" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                            Shared with Partner
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: 10.5, padding: '2px 8px' }}>
                            Private Mira Space
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteMiraConv(conv.id, e)}
                    title="Delete conversation"
                    aria-label="Delete conversation"
                    className="btn btn-ghost"
                    style={{ color: 'var(--gray)', padding: 6, minHeight: 'auto' }}
                  >
                    <Trash2 size={16} />
                  </button>
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
                    <span>{new Date(conv.updated_at || (conv as any).created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (conv.is_shared) {
                        navigate('/app/workspace')
                      } else {
                        navigate('/app/mira')
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 12.5, minHeight: 'auto', gap: 6 }}
                  >
                    <span>{conv.is_shared ? 'Open Shared Space' : 'Resume Chat'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
