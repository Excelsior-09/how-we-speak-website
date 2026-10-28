// ==============================================================================
// HOW WE SPEAK — MIRA AI RELATIONSHIP COMPANION VIEW
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Route: /app/mira
// Features: Conversational AI, structured advice, follow-ups, memory manager,
//           personalization preferences, history management.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Settings,
  Brain,
  MessageSquare,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'
import type { MiraMessage, MiraPreferences, MiraMemory } from '../types/database'

interface ConversationItem {
  id: string
  title: string
  updated_at: string
}

const DEFAULT_PREFERENCES: MiraPreferences = {
  id: 'local-prefs',
  user_id: '',
  communication_preference: 'balanced',
  advice_style: 'practical',
  response_length: 'moderate',
  personal_priorities: ['Less conflict', 'Better listening'],
  custom_priority: '',
  persistent_memory_enabled: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const SUGGESTED_STARTERS = [
  { text: "Help me understand why this conversation upset me.", category: "Understand feelings" },
  { text: "I need to bring up something difficult.", category: "Difficult talk" },
  { text: "Help me express a boundary without sounding harsh.", category: "Boundaries" },
  { text: "We keep having the same argument.", category: "Recurring conflict" },
  { text: "I want to understand my partner's perspective.", category: "Perspective" },
  { text: "Help me decide what to say next.", category: "Find the words" },
]

export const MiraView: React.FC = () => {
  const { user, isConfigured } = useAuth()
  
  // Conversations State
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConvId, setActiveConvId] = useState<string>('default')
  const [messages, setMessages] = useState<MiraMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Preferences & Memory State
  const [preferences, setPreferences] = useState<MiraPreferences>(DEFAULT_PREFERENCES)
  const [memories, setMemories] = useState<MiraMemory[]>([])
  const [isPrefsOpen, setIsPrefsOpen] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [newMemoryInput, setNewMemoryInput] = useState('')
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [newTitleInput, setNewTitleInput] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Load preferences, memory, and conversations from Supabase / localStorage
  useEffect(() => {
    async function loadData() {
      // 1. Preferences
      if (user && isConfigured) {
        try {
          const { data: prefData } = await supabase
            .from('mira_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
          if (prefData) {
            setPreferences(prefData as MiraPreferences)
          }
        } catch (e) {}

        // 2. Memories
        try {
          const { data: memData } = await supabase
            .from('mira_memories')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (memData) {
            setMemories(memData as MiraMemory[])
          }
        } catch (e) {}

        // 3. Conversations
        try {
          const { data: convData } = await supabase
            .from('mira_conversations')
            .select('id, title, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
          if (convData && convData.length > 0) {
            setConversations(convData as ConversationItem[])
            setActiveConvId(convData[0].id)
            return
          }
        } catch (e) {}
      }

      // Local fallback if unauthenticated
      const savedPrefs = localStorage.getItem('hws_mira_preferences')
      if (savedPrefs) {
        try { setPreferences(JSON.parse(savedPrefs)) } catch (e) {}
      }

      const savedMems = localStorage.getItem('hws_mira_memories')
      if (savedMems) {
        try { setMemories(JSON.parse(savedMems)) } catch (e) {}
      }

      const savedConvs = localStorage.getItem('hws_mira_conversations')
      if (savedConvs) {
        try {
          const parsed = JSON.parse(savedConvs)
          setConversations(parsed)
          if (parsed.length > 0) {
            setActiveConvId(parsed[0].id)
          }
        } catch (e) {}
      } else {
        const defaultConv: ConversationItem = {
          id: 'default',
          title: 'Conversation with Mira',
          updated_at: new Date().toISOString()
        }
        setConversations([defaultConv])
        setActiveConvId('default')
      }
    }

    loadData()

    // Check for pre-loaded prompt from state or navigation
    if (typeof window !== 'undefined') {
      const pendingPrompt = sessionStorage.getItem('hws_mira_prefill')
      if (pendingPrompt) {
        setInputMessage(pendingPrompt)
        sessionStorage.removeItem('hws_mira_prefill')
      }
    }
  }, [user, isConfigured])

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return

    async function loadConvMessages() {
      if (user && isConfigured && activeConvId !== 'default' && !activeConvId.startsWith('conv-')) {
        try {
          const { data, error } = await supabase
            .from('mira_messages')
            .select('*')
            .eq('conversation_id', activeConvId)
            .order('created_at', { ascending: true })

          if (!error && data) {
            setMessages(data as MiraMessage[])
            return
          }
        } catch (e) {}
      }

      const key = `hws_mira_msgs_${activeConvId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setMessages(JSON.parse(saved))
        } catch (e) {}
      } else {
        setMessages([])
      }
    }

    loadConvMessages()
  }, [activeConvId, user, isConfigured])

  const saveMessages = (convId: string, newMsgs: MiraMessage[]) => {
    setMessages(newMsgs)
    localStorage.setItem(`hws_mira_msgs_${convId}`, JSON.stringify(newMsgs))
  }

  const handleStartNewConversation = async () => {
    if (user && isConfigured) {
      try {
        const { data: newConv } = await supabase
          .from('mira_conversations')
          .insert({
            user_id: user.id,
            title: 'New Conversation',
            conversation_type: 'general',
            status: 'active'
          })
          .select('id, title, updated_at')
          .single()

        if (newConv) {
          const updated = [newConv as ConversationItem, ...conversations]
          setConversations(updated)
          setActiveConvId(newConv.id)
          setMessages([])
          return
        }
      } catch (e) {}
    }

    const newId = `conv-${Date.now()}`
    const newConv: ConversationItem = {
      id: newId,
      title: 'New Conversation',
      updated_at: new Date().toISOString()
    }
    const updated = [newConv, ...conversations]
    setConversations(updated)
    setActiveConvId(newId)
    localStorage.setItem('hws_mira_conversations', JSON.stringify(updated))
    setMessages([])
  }

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (user && isConfigured && id !== 'default' && !id.startsWith('conv-')) {
      try {
        await supabase.from('mira_conversations').delete().eq('id', id).eq('user_id', user.id)
      } catch (e) {}
    }

    const updated = conversations.filter(c => c.id !== id)
    setConversations(updated)
    localStorage.setItem('hws_mira_conversations', JSON.stringify(updated))
    localStorage.removeItem(`hws_mira_msgs_${id}`)
    if (activeConvId === id) {
      if (updated.length > 0) {
        setActiveConvId(updated[0].id)
      } else {
        handleStartNewConversation()
      }
    }
  }

  const handleSaveTitle = async (id: string) => {
    if (!newTitleInput.trim()) return
    const trimmedTitle = newTitleInput.trim()

    if (user && isConfigured && id !== 'default' && !id.startsWith('conv-')) {
      try {
        await supabase
          .from('mira_conversations')
          .update({ title: trimmedTitle, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id)
      } catch (e) {}
    }

    const updated = conversations.map(c => c.id === id ? { ...c, title: trimmedTitle } : c)
    setConversations(updated)
    localStorage.setItem('hws_mira_conversations', JSON.stringify(updated))
    setEditingTitleId(null)
  }

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend || inputMessage).trim()
    if (!msg || isLoading) return

    setInputMessage('')
    setErrorMsg(null)

    const userMessage: MiraMessage = {
      id: `usr-${Date.now()}`,
      conversation_id: activeConvId,
      user_id: user?.id || 'anon',
      role: 'user',
      content: msg,
      created_at: new Date().toISOString()
    }

    const updatedMsgs = [...messages, userMessage]
    saveMessages(activeConvId, updatedMsgs)

    // Update conversation title if this is the first user message
    if (messages.length === 0) {
      const autoTitle = msg.length > 30 ? `${msg.slice(0, 30)}...` : msg
      const updatedConvs = conversations.map(c => c.id === activeConvId ? { ...c, title: autoTitle } : c)
      setConversations(updatedConvs)
      localStorage.setItem('hws_mira_conversations', JSON.stringify(updatedConvs))
    }

    setIsLoading(true)

    try {
      let authToken: string | null = null
      if (user && isConfigured) {
        const session = (await supabase.auth.getSession()).data.session
        authToken = session?.access_token || null
      }

      const activeMemories = preferences.persistent_memory_enabled ? memories.map(m => m.content) : []

      const res = await fetch('/api/ai/mira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          message: msg,
          conversationId: activeConvId,
          history: updatedMsgs.slice(-8).map(m => ({ role: m.role, content: m.content })),
          preferences,
          memories: activeMemories
        })
      })

      if (res.status === 402) {
        const errData = await res.json()
        setErrorMsg(errData.error || 'Free trial limit reached. Please upgrade to continue.')
        setIsLoading(false)
        return
      }

      if (!res.ok) {
        let errJson: any = null
        try {
          errJson = await res.json()
        } catch (e) {}
        const fallbackErr = "Mira couldn't connect right now. Your message has not been lost. Please try again."
        const customMessage = errJson?.error || fallbackErr
        const correlationNote = errJson?.correlationId ? ` (Ref: ${errJson.correlationId})` : ''
        throw new Error(`${customMessage}${correlationNote}`)
      }

      const data = await res.json()
      const targetConvId = data.newConversationId || activeConvId

      if (data.newConversationId && activeConvId !== data.newConversationId) {
        setActiveConvId(data.newConversationId)
        const autoTitle = msg.length > 30 ? `${msg.slice(0, 30)}...` : msg
        const newConvItem: ConversationItem = {
          id: data.newConversationId,
          title: autoTitle,
          updated_at: new Date().toISOString()
        }
        const updatedList = [newConvItem, ...conversations.filter(c => c.id !== 'default' && c.id !== data.newConversationId)]
        setConversations(updatedList)
        localStorage.setItem('hws_mira_conversations', JSON.stringify(updatedList))
      }

      const assistantMessage: MiraMessage = {
        id: `ast-${Date.now()}`,
        conversation_id: targetConvId,
        user_id: user?.id || 'anon',
        role: 'assistant',
        content: data.message || "I'm listening and here to support you. Let's work through this together.",
        structured_data: data.structuredAdvice || null,
        created_at: new Date().toISOString()
      }

      saveMessages(targetConvId, [...updatedMsgs.map(m => ({ ...m, conversation_id: targetConvId })), assistantMessage])
    } catch (err: any) {
      setErrorMsg(err.message || "Mira couldn't connect right now. Your message has not been lost. Please try again.")
      if (!inputMessage) {
        setInputMessage(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyScript = (scriptText: string, index: number) => {
    navigator.clipboard.writeText(scriptText)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSavePreferences = async (newPrefs: MiraPreferences) => {
    setPreferences(newPrefs)
    localStorage.setItem('hws_mira_preferences', JSON.stringify(newPrefs))
    setIsPrefsOpen(false)

    if (user && isConfigured) {
      try {
        await supabase.from('mira_preferences').upsert({
          user_id: user.id,
          communication_preference: newPrefs.communication_preference,
          communication_tone: newPrefs.communication_preference,
          advice_style: newPrefs.advice_style,
          guidance_level: newPrefs.advice_style,
          response_length: newPrefs.response_length,
          personal_priorities: newPrefs.personal_priorities,
          custom_priority: newPrefs.custom_priority,
          persistent_memory_enabled: newPrefs.persistent_memory_enabled,
          updated_at: new Date().toISOString()
        })
      } catch (e) {}
    }
  }

  const handleAddMemory = async () => {
    if (!newMemoryInput.trim()) return
    const memContent = newMemoryInput.trim()

    let newMemId = `mem-${Date.now()}`
    if (user && isConfigured) {
      try {
        const { data: dbMem } = await supabase
          .from('mira_memories')
          .insert({
            user_id: user.id,
            category: 'relationship_context',
            content: memContent,
            consent_granted: true
          })
          .select('id, user_id, category, content, created_at, updated_at')
          .single()

        if (dbMem) {
          const updated = [dbMem as MiraMemory, ...memories]
          setMemories(updated)
          localStorage.setItem('hws_mira_memories', JSON.stringify(updated))
          setNewMemoryInput('')
          return
        }
      } catch (e) {}
    }

    const newMem: MiraMemory = {
      id: newMemId,
      user_id: user?.id || 'anon',
      category: 'relationship_context',
      content: memContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const updated = [newMem, ...memories]
    setMemories(updated)
    localStorage.setItem('hws_mira_memories', JSON.stringify(updated))
    setNewMemoryInput('')
  }

  const handleDeleteMemory = async (id: string) => {
    if (user && isConfigured && !id.startsWith('mem-')) {
      try {
        await supabase.from('mira_memories').delete().eq('id', id).eq('user_id', user.id)
      } catch (e) {}
    }

    const updated = memories.filter(m => m.id !== id)
    setMemories(updated)
    localStorage.setItem('hws_mira_memories', JSON.stringify(updated))
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Context Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 16,
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--burgundy) 0%, #8b1328 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(196, 30, 58, 0.25)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: 'var(--charcoal)' }}>Mira</h1>
              <span className="badge badge-burgundy" style={{ fontSize: 11, padding: '2px 8px' }}>AI Companion</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)' }}>
              Your Relationship Communication Guide · Calm, thoughtful, non-diagnostic
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsPrefsOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}
            title="Configure how Mira speaks and prioritizes advice"
          >
            <Settings size={15} />
            <span>How Mira Helps</span>
          </button>

          <button
            onClick={() => setIsMemoryOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}
            title="Manage consented memories"
          >
            <Brain size={15} />
            <span>Memory ({memories.length})</span>
          </button>

          <button
            onClick={handleStartNewConversation}
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '8px 16px', gap: 6 }}
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar + Chat Area) */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, minHeight: 640 }}>
        {/* Left: Saved Conversations List */}
        <div className="card-glass" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Conversations
            </span>
            <button
              onClick={handleStartNewConversation}
              style={{ background: 'none', border: 'none', color: 'var(--burgundy)', cursor: 'pointer', padding: 4 }}
              title="New Chat"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 540 }}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  background: activeConvId === conv.id ? 'var(--blush-soft)' : 'transparent',
                  color: activeConvId === conv.id ? 'var(--burgundy)' : 'var(--charcoal)',
                  fontWeight: activeConvId === conv.id ? 600 : 400,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                  {editingTitleId === conv.id ? (
                    <input
                      type="text"
                      value={newTitleInput}
                      onChange={e => setNewTitleInput(e.target.value)}
                      onBlur={() => handleSaveTitle(conv.id)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveTitle(conv.id)}
                      autoFocus
                      style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', width: 140 }}
                    />
                  ) : (
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {conv.title}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTitleId(conv.id)
                      setNewTitleInput(conv.title)
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 2 }}
                    title="Rename"
                  >
                    <Edit2 size={12} />
                  </button>
                  {conversations.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', padding: 2 }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="card-glass" style={{
          display: 'flex',
          flexDirection: 'column',
          height: 640,
          padding: 0,
          overflow: 'hidden',
          background: 'var(--warm-white)'
        }}>
          {/* Scrollable Message List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Welcoming state for empty conversation */}
            {messages.length === 0 && (
              <div style={{ maxWidth: 640, margin: 'auto', textAlign: 'center', padding: '40px 20px' }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 20,
                  background: 'var(--blush-soft)',
                  color: 'var(--burgundy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                  boxShadow: '0 4px 16px rgba(196, 30, 58, 0.12)'
                }}>
                  <Sparkles size={26} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--charcoal)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
                  Meet Mira
                </h2>
                <p style={{ fontSize: 14.5, color: 'var(--gray)', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 28px' }}>
                  Sometimes you know something feels off, but you don't know how to explain it. Start wherever you are. Mira will help you sort through what is happening and work out what to do next.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, textAlign: 'left' }}>
                  {SUGGESTED_STARTERS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s.text)}
                      style={{
                        padding: '12px 14px',
                        background: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 13,
                        color: 'var(--charcoal)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--burgundy)'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.transform = 'none'
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--burgundy)', fontWeight: 600 }}>{s.category}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((m, idx) => (
              <div
                key={m.id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 6
                }}
              >
                {/* Message Header Label */}
                <div style={{ fontSize: 11.5, color: 'var(--gray)', fontWeight: 500, padding: '0 4px' }}>
                  {m.role === 'user' ? 'You' : 'Mira'}
                </div>

                {/* Message Bubble */}
                <div style={{
                  maxWidth: '82%',
                  padding: m.role === 'user' ? '14px 18px' : '18px 22px',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? 'var(--charcoal)' : '#ffffff',
                  color: m.role === 'user' ? '#ffffff' : 'var(--charcoal)',
                  boxShadow: m.role === 'user' ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: 14.5,
                  lineHeight: 1.65
                }}>
                  {m.content}

                  {/* Render Structured Advice if available */}
                  {m.structured_data && (
                    <div style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      fontSize: 13.5
                    }}>
                      {m.structured_data.whatWeKnow && (
                        <div>
                          <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 2 }}>What we know:</strong>
                          <span style={{ color: 'var(--charcoal-mid)' }}>{m.structured_data.whatWeKnow}</span>
                        </div>
                      )}

                      {m.structured_data.whatMightBeHappening && (
                        <div>
                          <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 2 }}>What might be happening:</strong>
                          <span style={{ color: 'var(--charcoal-mid)' }}>{m.structured_data.whatMightBeHappening}</span>
                        </div>
                      )}

                      {m.structured_data.whatYouCanDo && (
                        <div>
                          <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 2 }}>What you can do:</strong>
                          <span style={{ color: 'var(--charcoal-mid)' }}>{m.structured_data.whatYouCanDo}</span>
                        </div>
                      )}

                      {m.structured_data.whatYouCouldSay && (
                        <div style={{
                          background: 'var(--cream)',
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: '1px solid rgba(196, 30, 58, 0.15)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <strong style={{ color: 'var(--burgundy)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              What you could say
                            </strong>
                            <button
                              onClick={() => handleCopyScript(m.structured_data!.whatYouCouldSay!, idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--burgundy)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 12
                              }}
                            >
                              {copiedIndex === idx ? <Check size={13} /> : <Copy size={13} />}
                              <span>{copiedIndex === idx ? 'Copied' : 'Copy wording'}</span>
                            </button>
                          </div>
                          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--charcoal)' }}>
                            {m.structured_data.whatYouCouldSay}
                          </p>
                        </div>
                      )}

                      {m.structured_data.whatToWatchFor && (
                        <div>
                          <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 2 }}>What to watch for:</strong>
                          <span style={{ color: 'var(--gray)' }}>{m.structured_data.whatToWatchFor}</span>
                        </div>
                      )}

                      {m.structured_data.followUpQuestion && (
                        <div style={{
                          marginTop: 6,
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'var(--blush-soft)',
                          color: 'var(--burgundy)',
                          fontWeight: 500
                        }}>
                          {m.structured_data.followUpQuestion}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading / Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: 'var(--gray)', fontSize: 13 }}>
                <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--burgundy)' }} />
                <span>Mira is reflecting on your situation...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: '#fff5f5',
                border: '1px solid #fed7d7',
                color: '#c53030',
                fontSize: 13.5,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{errorMsg}</div>
                {errorMsg.includes('Free trial limit') ? (
                  <a href="/index.html#bundle" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                    Upgrade
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
                      if (lastUserMsg) {
                        handleSendMessage(lastUserMsg.content)
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #c53030',
                      background: '#fff',
                      color: '#c53030',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    Try again
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer Area */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <textarea
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Ask Mira anything or describe what happened with your partner..."
              rows={2}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14.5,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'none',
                background: 'var(--warm-white)',
                lineHeight: 1.5
              }}
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="btn btn-primary"
              style={{
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !inputMessage.trim() || isLoading ? 0.6 : 1
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* HOW MIRA HELPS MODAL (Personalization Settings) */}
      {isPrefsOpen && (
        <div className="modal-overlay show" onClick={() => setIsPrefsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Settings size={20} style={{ color: 'var(--burgundy)' }} />
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>How Mira Helps You</h3>
              </div>
              <button
                onClick={() => setIsPrefsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--gray)', marginBottom: 20 }}>
              Customize Mira’s conversational tone, depth, and guidance priorities. You can adjust or reset these anytime.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Communication Preference */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 8 }}>
                  Communication Preference
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'gentle', label: 'Gentle & Reassuring' },
                    { id: 'balanced', label: 'Balanced & Thoughtful' },
                    { id: 'direct', label: 'Direct & Clear' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPreferences({ ...preferences, communication_preference: opt.id as any })}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: preferences.communication_preference === opt.id ? 'var(--burgundy)' : 'var(--border)',
                        background: preferences.communication_preference === opt.id ? 'var(--blush-soft)' : '#fff',
                        color: preferences.communication_preference === opt.id ? 'var(--burgundy)' : 'var(--charcoal)',
                        fontWeight: preferences.communication_preference === opt.id ? 600 : 400
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advice Style */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 8 }}>
                  Advice Style
                </label>
                <select
                  value={preferences.advice_style}
                  onChange={e => setPreferences({ ...preferences, advice_style: e.target.value as any })}
                  className="input-select"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}
                >
                  <option value="practical">Give me practical next steps</option>
                  <option value="listen">Listen and help me understand my feelings</option>
                  <option value="words">Help me find the right words to say</option>
                  <option value="challenge">Challenge my assumptions respectfully</option>
                  <option value="both-perspectives">Help me consider both perspectives</option>
                </select>
              </div>

              {/* Response Length */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 8 }}>
                  Response Length
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { id: 'short', label: 'Short & Focused' },
                    { id: 'moderate', label: 'Moderate Detail' },
                    { id: 'detailed', label: 'Detailed Guidance' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setPreferences({ ...preferences, response_length: opt.id as any })}
                      style={{
                        padding: '8px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: preferences.response_length === opt.id ? 'var(--burgundy)' : 'var(--border)',
                        background: preferences.response_length === opt.id ? 'var(--blush-soft)' : '#fff',
                        color: preferences.response_length === opt.id ? 'var(--burgundy)' : 'var(--charcoal)',
                        fontWeight: preferences.response_length === opt.id ? 600 : 400
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Priorities */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)', display: 'block', marginBottom: 8 }}>
                  Personal Priorities (Select all that matter)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    'Better listening',
                    'More emotional openness',
                    'Healthy boundaries',
                    'Less conflict',
                    'Rebuilding trust',
                    'More affection & connection',
                    'Clearer expectations',
                    'Understanding recurring patterns'
                  ].map(pri => {
                    const isSelected = preferences.personal_priorities.includes(pri)
                    return (
                      <button
                        key={pri}
                        onClick={() => {
                          const updated = isSelected
                            ? preferences.personal_priorities.filter(p => p !== pri)
                            : [...preferences.personal_priorities, pri]
                          setPreferences({ ...preferences, personal_priorities: updated })
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--burgundy)' : 'var(--border)',
                          background: isSelected ? 'var(--blush-soft)' : '#fff',
                          color: isSelected ? 'var(--burgundy)' : 'var(--charcoal)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {isSelected && <Check size={13} />}
                        <span>{pri}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setIsPrefsOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleSavePreferences(preferences)} className="btn btn-primary">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONSENT-BASED MEMORY MANAGER MODAL */}
      {isMemoryOpen && (
        <div className="modal-overlay show" onClick={() => setIsMemoryOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Brain size={20} style={{ color: 'var(--burgundy)' }} />
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>Mira’s Saved Memory</h3>
              </div>
              <button
                onClick={() => setIsMemoryOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray)' }}
              >
                ✕
              </button>
            </div>

            {/* Persistent Memory Consent Switch */}
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--cream)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20
            }}>
              <div>
                <strong style={{ fontSize: 13.5, color: 'var(--charcoal)', display: 'block' }}>
                  Enable Persistent Memory
                </strong>
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                  Allows Mira to remember approved context across different conversations.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.persistent_memory_enabled}
                onChange={e => {
                  const updated = { ...preferences, persistent_memory_enabled: e.target.checked }
                  setPreferences(updated)
                  localStorage.setItem('hws_mira_preferences', JSON.stringify(updated))
                }}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--burgundy)' }}
              />
            </div>

            {/* Add New Memory */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                type="text"
                value={newMemoryInput}
                onChange={e => setNewMemoryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMemory()}
                placeholder="e.g. My partner needs time alone to recharge after work"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  fontSize: 13
                }}
              />
              <button onClick={handleAddMemory} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
                Add
              </button>
            </div>

            {/* Memory List */}
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {memories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--gray)', fontSize: 13 }}>
                  No memories saved yet. Add key context that helps Mira give you better advice.
                </div>
              ) : (
                memories.map(mem => (
                  <div
                    key={mem.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: '#fff',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: 'var(--charcoal)'
                    }}
                  >
                    <span>{mem.content}</span>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      style={{ background: 'none', border: 'none', color: '#c53030', cursor: 'pointer', padding: 4 }}
                      title="Delete Memory"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button onClick={() => setIsMemoryOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
