// ==============================================================================
// HOW WE SPEAK — MY PARTNER & COUPLES AI SPACE
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Real database invitations, secure account linking & unlinking,
//           strict private vs shared boundaries, interactive shared dialogue,
//           live turn-taking perspectives, and Mira AI shared conversation analysis.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react'
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
  Plus,
  X,
  UserMinus,
  CheckCircle2,
  MessageSquare,
  Send,
  Users,
  BookOpen,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../lib/useAuth'
import { supabase } from '../lib/supabase'
import { executeRecaptcha } from '../lib/recaptcha'
import type { MiraConversation, MiraMessage, ConversationAnalysis } from '../types/database'

interface WorkspaceViewProps {
  partnerLinked?: boolean
  onTogglePartnerLink?: () => void
  onRequireAuth?: (mode?: 'signin' | 'signup') => void
}

interface JointMediationResult {
  overview: string
  partnerAView: string
  partnerBView: string
  overlappingNeeds: string
  compromiseExperiment: string
  phrasesToUse: string[]
  pauseRecommendation?: string
}

const SUGGESTED_TOPICS = [
  'Evening stress & transition windows',
  'Division of household mental load',
  'Feeling emotionally distant lately',
  'Tone during disagreements',
  'Quality time vs personal downtime',
  'Family & in-law boundaries',
]

const COMMON_EMOTIONS = [
  'Overwhelmed',
  'Unheard',
  'Frustrated',
  'Unappreciated',
  'Anxious',
  'Guarded',
  'Tired',
  'Disconnected',
]

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ onRequireAuth }) => {
  const { user, profile, activeSpace, partnerProfile, isConfigured, refreshUserData } = useAuth()

  // Tab State
  const [activeTab, setActiveTab] = useState<'dialogue' | 'reflections' | 'settings'>('dialogue')

  // Real Partner Invitation State
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const [realInviteToken, setRealInviteToken] = useState<string | null>(null)
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null)
  const [incomingInviteToken, setIncomingInviteToken] = useState<string | null>(null)
  const [incomingInviteData, setIncomingInviteData] = useState<{
    valid: boolean
    inviter_name?: string
    inviter_archetype?: string
    expires_at?: string
    error?: string
  } | null>(null)
  const [incomingInviteLoading, setIncomingInviteLoading] = useState(false)
  const [pairingError, setPairingError] = useState<string | null>(null)
  const [pairingSuccess, setPairingSuccess] = useState<string | null>(null)
  const [isPairing, setIsPairing] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // Shared Conversations State
  const [sharedConversations, setSharedConversations] = useState<MiraConversation[]>([])
  const [activeSharedConvId, setActiveSharedConvId] = useState<string | null>(null)
  const [sharedMessages, setSharedMessages] = useState<MiraMessage[]>([])
  const [newSharedMsgText, setNewSharedMsgText] = useState('')
  const [isSendingMsg, setIsSendingMsg] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')

  // Mira AI Shared Conversation Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [currentAnalysis, setCurrentAnalysis] = useState<ConversationAnalysis | null>(null)
  const [showConsentModal, setShowConsentModal] = useState(false)

  // Guided Exercises State (Turn-Taking Reflection)
  const [topic, setTopic] = useState('Evening stress & transition windows')
  const [customTopic, setCustomTopic] = useState('')
  const [isCustomTopic, setIsCustomTopic] = useState(false)
  const [myExperience, setMyExperience] = useState(
    "When you arrive home and immediately check your phone or retreat, I feel disconnected and worried that our time together isn't a priority."
  )
  const [myEmotions, setMyEmotions] = useState<string[]>(['Disconnected', 'Unappreciated'])
  const [myUnderlyingNeed, setMyUnderlyingNeed] = useState(
    "I need 10 minutes of intentional greeting so I know we're in this together."
  )
  const [myShared, setMyShared] = useState(false)
  const [partnerHasShared, setPartnerHasShared] = useState(false)
  const [partnerExperience, setPartnerExperience] = useState<string | null>(null)
  const [partnerEmotions, setPartnerEmotions] = useState<string[]>([])
  const [partnerNeed, setPartnerNeed] = useState<string | null>(null)
  const [isMediating, setIsMediating] = useState(false)
  const [mediationResult, setMediationResult] = useState<JointMediationResult | null>(null)
  const [aiConsentBoth, setAiConsentBoth] = useState(true)

  // Couple Settings
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

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isPartnerConnected = Boolean(activeSpace?.status === 'active' && activeSpace?.partner_2_id) || Boolean(partnerProfile)
  const partnerDisplayName = partnerProfile?.display_name || 'Your Partner'
  const myDisplayName = profile?.display_name || 'You'

  // Construct invite link and code
  const inviteCode = realInviteToken || (activeSpace ? `hws_${activeSpace.id.replace(/-/g, '').substring(0, 10)}` : 'hws_7a2b9f1c')
  const inviteLink = typeof window !== 'undefined'
    ? `${window.location.origin}/app/workspace?invite=${inviteCode}`
    : `https://tryhowwespeak.com/app/workspace?invite=${inviteCode}`

  // 1. Detect incoming invitation token from URL or session storage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('invite') || params.get('code') || params.get('token') || sessionStorage.getItem('hws_partner_invite_token')
    if (token) {
      const cleanToken = token.trim()
      setInviteInput(cleanToken)
      setIncomingInviteToken(cleanToken)
      sessionStorage.setItem('hws_partner_invite_token', cleanToken)
      setIncomingInviteLoading(true)

      fetch(`/api/partner/invite?token=${encodeURIComponent(cleanToken)}`)
        .then((res) => res.json())
        .then((data) => {
          setIncomingInviteData(data)
        })
        .catch(() => {
          setIncomingInviteData({ valid: false, error: 'Could not connect to verify invitation code.' })
        })
        .finally(() => {
          setIncomingInviteLoading(false)
        })
    }
  }, [])

  // 2. Fetch or generate real persistent partner invitation
  useEffect(() => {
    async function loadOrCreateInvite() {
      if (!user || !isConfigured || isPartnerConnected) return

      try {
        // Query database for existing active pending invitation
        const { data: invData } = await supabase
          .from('workspace_invitations')
          .select('*')
          .eq('inviter_id', user.id)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (invData && invData.token) {
          setRealInviteToken(invData.token)
          setInviteExpiresAt(invData.expires_at)
          return
        }

        // Call RPC create_partner_invitation or fallback API
        const { data: rpcInv, error: rpcErr } = await supabase.rpc('create_partner_invitation')
        if (!rpcErr && rpcInv && rpcInv.token) {
          setRealInviteToken(rpcInv.token)
          setInviteExpiresAt(rpcInv.expires_at)
          return
        }

        // Call API endpoint
        const session = (await supabase.auth.getSession()).data.session
        const res = await fetch('/api/partner/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ action: 'create' })
        })
        if (res.ok) {
          const json = await res.json()
          if (json.invitation?.token) {
            setRealInviteToken(json.invitation.token)
            setInviteExpiresAt(json.invitation.expires_at)
          }
        }
      } catch (e) {
        console.warn('Error loading partner invite:', e)
      }
    }

    loadOrCreateInvite()
  }, [user, isConfigured, isPartnerConnected])

  // 3. Load Shared Conversations when partner is connected
  useEffect(() => {
    async function loadShared() {
      if (!user || !isConfigured || !activeSpace?.id || !isPartnerConnected) return

      try {
        const { data, error } = await supabase
          .from('mira_conversations')
          .select('*')
          .eq('space_id', activeSpace.id)
          .eq('is_shared', true)
          .order('updated_at', { ascending: false })

        if (!error && data && data.length > 0) {
          setSharedConversations(data as MiraConversation[])
          if (!activeSharedConvId || !data.some(c => c.id === activeSharedConvId)) {
            setActiveSharedConvId(data[0].id)
          }
        } else if (!error && (!data || data.length === 0)) {
          // Initialize first shared topic
          const { data: firstConv } = await supabase
            .from('mira_conversations')
            .insert({
              user_id: user.id,
              title: 'Evening Stress & Decompression Windows',
              is_shared: true,
              space_id: activeSpace.id,
              conversation_type: 'partner',
              status: 'active'
            })
            .select('*')
            .single()

          if (firstConv) {
            setSharedConversations([firstConv as MiraConversation])
            setActiveSharedConvId(firstConv.id)
          }
        }
      } catch (e) {
        console.warn('Error loading shared conversations:', e)
      }
    }

    loadShared()
  }, [user, isConfigured, activeSpace?.id, isPartnerConnected])

  // 4. Load messages for active shared conversation & poll for live partner updates
  useEffect(() => {
    if (!activeSharedConvId || !isPartnerConnected) return

    async function loadMessages() {
      try {
        const { data, error } = await supabase
          .from('mira_messages')
          .select('*')
          .eq('conversation_id', activeSharedConvId)
          .order('created_at', { ascending: true })

        if (!error && data) {
          setSharedMessages(data as MiraMessage[])
        }
      } catch (e) {}
    }

    async function loadSavedAnalysis() {
      try {
        const { data } = await supabase
          .from('conversation_analyses')
          .select('*')
          .eq('conversation_id', activeSharedConvId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (data) {
          setCurrentAnalysis(data as ConversationAnalysis)
        } else {
          setCurrentAnalysis(null)
        }
      } catch (e) {}
    }

    loadMessages()
    loadSavedAnalysis()

    // Poll every 4 seconds so both partners see live conversation updates
    const interval = setInterval(loadMessages, 4000)
    return () => clearInterval(interval)
  }, [activeSharedConvId, isPartnerConnected])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sharedMessages])

  // Copy Invite Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2200)
  }

  // Copy Invite Link
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  // Accept Partner Invitation by manual input
  const handleAcceptInvite = async () => {
    if (!inviteInput.trim()) return
    setIsPairing(true)
    setPairingError(null)
    setPairingSuccess(null)

    if (user && isConfigured) {
      try {
        const session = (await supabase.auth.getSession()).data.session
        const res = await fetch('/api/partner/invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ action: 'accept', token: inviteInput.trim() })
        })

        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || 'Could not accept invitation code.')
        }

        setPairingSuccess('Partner connected successfully! Activating your shared space...')
        await refreshUserData()
        setTimeout(() => {
          setPairingSuccess(null)
          setActiveTab('dialogue')
        }, 1500)
      } catch (err: any) {
        setPairingError(err.message || 'Could not accept invitation code.')
      } finally {
        setIsPairing(false)
      }
    } else {
      setPairingError('Please sign in or create an account to accept your partner invitation code.')
      setIsPairing(false)
      onRequireAuth?.('signin')
    }
  }

  // Accept Incoming Partner Invitation (from URL link or banner)
  const handleAcceptIncomingInvite = async () => {
    if (!incomingInviteToken) return
    setIsPairing(true)
    setPairingError(null)
    setPairingSuccess(null)

    if (!user) {
      onRequireAuth?.('signin')
      setIsPairing(false)
      return
    }

    try {
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch('/api/partner/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ action: 'accept', token: incomingInviteToken })
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Could not connect with partner.')
      }

      setPairingSuccess('Partner connected successfully! Activating your shared communication room...')
      sessionStorage.removeItem('hws_partner_invite_token')
      setIncomingInviteToken(null)
      setIncomingInviteData(null)
      await refreshUserData()
      setTimeout(() => {
        setPairingSuccess(null)
        setActiveTab('dialogue')
      }, 1500)
    } catch (err: any) {
      setPairingError(err.message || 'Could not connect with partner.')
    } finally {
      setIsPairing(false)
    }
  }

  const handleDeclineIncomingInvite = () => {
    sessionStorage.removeItem('hws_partner_invite_token')
    setIncomingInviteToken(null)
    setIncomingInviteData(null)
    setPairingError(null)
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      url.searchParams.delete('code')
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.pathname + (url.search || ''))
    }
  }

  // Disconnect Partner Relationship
  const handleDisconnect = async () => {
    if (!activeSpace?.id) {
      setShowDisconnectModal(false)
      return
    }

    setIsDisconnecting(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      await fetch('/api/partner/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ action: 'disconnect', spaceId: activeSpace.id })
      })

      setShowDisconnectModal(false)
      await refreshUserData()
    } catch (e) {
      console.warn('Disconnect error:', e)
    } finally {
      setIsDisconnecting(false)
    }
  }

  // Send a message in the Shared Conversation
  const handleSendSharedMessage = async () => {
    const text = newSharedMsgText.trim()
    if (!text || !activeSharedConvId || !user || isSendingMsg) return

    setIsSendingMsg(true)
    setNewSharedMsgText('')

    try {
      const clientMsgId = `shared_${activeSharedConvId}_${Date.now()}`
      const { data, error } = await supabase
        .from('mira_messages')
        .insert({
          conversation_id: activeSharedConvId,
          user_id: user.id,
          role: 'user',
          content: text,
          idempotency_key: clientMsgId
        })
        .select('*')
        .single()

      if (!error && data) {
        setSharedMessages(prev => [...prev, data as MiraMessage])
      }

      await supabase
        .from('mira_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeSharedConvId)
    } catch (e) {
      console.warn('Error sending shared message:', e)
    } finally {
      setIsSendingMsg(false)
    }
  }

  // Create New Shared Topic
  const handleCreateNewSharedTopic = async () => {
    if (!newTopicTitle.trim() || !activeSpace?.id || !user) return

    try {
      const { data, error } = await supabase
        .from('mira_conversations')
        .insert({
          user_id: user.id,
          title: newTopicTitle.trim(),
          is_shared: true,
          space_id: activeSpace.id,
          conversation_type: 'partner',
          status: 'active'
        })
        .select('*')
        .single()

      if (!error && data) {
        setSharedConversations(prev => [data as MiraConversation, ...prev])
        setActiveSharedConvId(data.id)
        setShowNewTopicModal(false)
        setNewTopicTitle('')
      }
    } catch (e) {
      console.warn('Error creating shared topic:', e)
    }
  }

  // Analyze Shared Conversation via Mira AI
  const handleAnalyzeSharedConversation = async () => {
    if (!activeSharedConvId || !activeSpace?.id || sharedMessages.length < 2) return

    setShowConsentModal(false)
    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      let captchaToken: string | null = null
      try {
        captchaToken = await executeRecaptcha('analyze_conversation')
      } catch (cErr) {}

      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch('/api/ai/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(captchaToken ? { 'x-captcha-token': captchaToken } : {})
        },
        body: JSON.stringify({
          conversationId: activeSharedConvId,
          spaceId: activeSpace.id,
          captchaToken: captchaToken || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Mira could not analyze the conversation. Please try again.')
      }

      setCurrentAnalysis(data.analysis)
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis could not be completed right now.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Toggle emotion chip in reflection exercise
  const toggleEmotion = (eName: string) => {
    if (myEmotions.includes(eName)) {
      setMyEmotions(myEmotions.filter((e) => e !== eName))
    } else {
      setMyEmotions([...myEmotions, eName])
    }
  }

  // Handle toggling your share status in reflection exercise
  const handleToggleMyShare = () => {
    const nextShare = !myShared
    setMyShared(nextShare)

    if (nextShare && isPartnerConnected) {
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

  // Ask Mira to help us with guided reflection
  const handleAskMiraJoint = async () => {
    if (!myShared || !partnerHasShared) return
    setIsMediating(true)

    const activeTopic = isCustomTopic ? customTopic : topic

    try {
      let captchaToken: string | null = null
      try {
        captchaToken = await executeRecaptcha('joint_summary')
      } catch (cErr) {}

      const res = await fetch('/api/ai/joint-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(captchaToken ? { 'x-captcha-token': captchaToken } : {}),
        },
        body: JSON.stringify({
          exerciseId: 'ex_couples_joint_session',
          mockExercise: { topic: activeTopic },
          captchaToken: captchaToken || undefined,
          mockReflections: [
            {
              trigger_notes: myExperience,
              felt_emotions: myEmotions,
              underlying_need: myUnderlyingNeed,
              is_shared: true,
              user: { display_name: myDisplayName },
            },
            {
              trigger_notes: partnerExperience || "I felt overwhelmed by work stress.",
              felt_emotions: partnerEmotions,
              underlying_need: partnerNeed || "I need a transition window.",
              is_shared: true,
              user: { display_name: partnerDisplayName },
            },
          ],
        }),
      })

      if (res.ok) {
        const d = await res.json()
        setMediationResult({
          overview: d.cycleOverview || "Both of you are reacting to legitimate nervous system needs. One partner seeks connection to feel secure, while the other seeks decompression to avoid overwhelm.",
          partnerAView: d.partnerAUnderlyingLonging || `You are longing for presence, connection, and emotional assurance that your time together matters.`,
          partnerBView: d.partnerBUnderlyingLonging || `${partnerDisplayName} is longing for physiological decompression and relief from feeling pressured or inadequate.`,
          overlappingNeeds: d.sharedNegativeLoop || "Both of you want to feel loved, safe, and emotionally close without being triggered into defensiveness.",
          compromiseExperiment: "Try a 20-minute silent decompression window upon arrival, followed by an intentional 10-minute check-in.",
          phrasesToUse: [
            `"${partnerDisplayName}, I'm so glad you're home. Take 20 minutes to reset, and let's check in at 6:30."`,
            `"Thank you for understanding. I want to be present with you—I just need 20 minutes to unwind."`,
          ],
          pauseRecommendation: "If either of you notices an elevated pulse, touch hands and say: 'Let's take 10 minutes so we can remain kind.'",
        })
      } else {
        throw new Error('Joint mediation failed')
      }
    } catch (e) {
      setMediationResult({
        overview: "Both of you are experiencing understandable reactions to end-of-day stress. Neither partner is trying to push the other away.",
        partnerAView: `You are longing for warmth, emotional reassurance, and proof that your relationship comes first.`,
        partnerBView: `${partnerDisplayName} is longing for emotional relief from workday demands so they can show up with genuine energy.`,
        overlappingNeeds: "Both of you desire a peaceful, welcoming home and mutual emotional security.",
        compromiseExperiment: "Agree to a 20-minute transition boundary upon returning home.",
        phrasesToUse: [
          `"I love you and want to hear about your day. Let's take 20 minutes to decompress first."`,
          `"I appreciate you giving me time to shift gears. I can't wait to catch up shortly."`,
        ],
        pauseRecommendation: "If either partner feels flooded, touch your hand to your chest and say: 'Let's take 10 minutes so we stay kind.'",
      })
    } finally {
      setIsMediating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="badge badge-neutral">Couples Collaboration Space</span>
            {isPartnerConnected ? (
              <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <HeartHandshake size={12} />
                Connected with {partnerDisplayName}
              </span>
            ) : (
              <span className="badge badge-burgundy">Unpaired Space</span>
            )}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 3.4vw, 40px)', marginBottom: 8, lineHeight: 1.25, fontWeight: 700 }}>
            My Partner & Couples Space
          </h1>
          <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 740, lineHeight: 1.6 }}>
            A persistent, collaborative communication room for two. What you practice in your private Mira chats remains 100% confidential. Only explicitly shared conversations appear here.
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
              <span>Mediation Rules</span>
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

      {/* ── NAVIGATION TABS WHEN CONNECTED ───────────────────────────────── */}
      {isPartnerConnected && (
        <div style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12
        }}>
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`btn ${activeTab === 'dialogue' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13.5, padding: '8px 18px' }}
          >
            <MessageSquare size={16} />
            <span>Shared Dialogue & Mira AI</span>
          </button>

          <button
            onClick={() => setActiveTab('reflections')}
            className={`btn ${activeTab === 'reflections' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13.5, padding: '8px 18px' }}
          >
            <BookOpen size={16} />
            <span>Guided Perspective Exercises</span>
          </button>
        </div>
      )}

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
              Partner Pairing
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 12 }}>
              Better conversations start with an invitation.
            </h2>
            <p style={{ fontSize: 15, color: 'var(--gray)', lineHeight: 1.65 }}>
              Connecting your partner allows you to explore sensitive topics calmly in a shared space, exchange thoughts, and invite Mira to facilitate balanced, practical next steps when you are both ready.
            </p>
          </div>

          {/* INCOMING INVITATION REVIEW CARD (When visiting invite link or entering partner code) */}
          {incomingInviteToken && incomingInviteLoading && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-card)',
                padding: '24px 32px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: 720,
                color: 'var(--charcoal-muted)'
              }}
            >
              <RefreshCw size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Verifying partner invitation details...</span>
            </div>
          )}

          {incomingInviteToken && !incomingInviteLoading && incomingInviteData && (
            <div
              id="incoming-partner-invitation-card"
              style={{
                background: '#FFFFFF',
                border: '2px solid var(--burgundy)',
                borderRadius: 'var(--radius-card)',
                padding: '28px 32px',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                maxWidth: 720,
              }}
            >
              {!incomingInviteData.valid ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--burgundy)', fontWeight: 600, fontSize: 16 }}>
                    <AlertCircle size={20} />
                    <span>Invitation Unavailable</span>
                  </div>
                  <p style={{ color: 'var(--gray)', fontSize: 13.5, margin: '8px 0 16px', lineHeight: 1.5 }}>
                    {incomingInviteData.error || 'This partner invitation code is no longer valid or has expired. Please ask your partner to generate a new invitation.'}
                  </p>
                  <button
                    onClick={handleDeclineIncomingInvite}
                    className="btn btn-secondary"
                    style={{ fontSize: 13 }}
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: 'var(--burgundy-subtle)',
                      color: 'var(--burgundy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <HeartHandshake size={24} />
                    </div>
                    <div>
                      <span className="badge badge-burgundy">Incoming Partner Invitation</span>
                      <h3 style={{ fontSize: 20, margin: '2px 0 0', color: 'var(--charcoal)' }}>
                        Connect with {incomingInviteData.inviter_name || 'Your Partner'}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--charcoal-muted)', lineHeight: 1.6, margin: 0 }}>
                    <strong>{incomingInviteData.inviter_name || 'Your Partner'}</strong> has invited you to connect on TryHowWeSpeak in a private shared couples room. Connecting enables shared conversation practice, gentle perspective-taking, and objective Mira AI mediation.
                  </p>

                  <div style={{ fontSize: 12, color: 'var(--gray)', background: 'var(--warm-white)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    🔒 <strong>Strict Privacy Boundary:</strong> Connecting your partner will never expose your personal private reflections or solo rehearsal plans. Only conversations explicitly initiated or shared in the couples room will be accessible to both partners.
                  </div>

                  {!user ? (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                      <button
                        onClick={() => onRequireAuth?.('signup')}
                        className="btn btn-primary"
                        style={{ fontSize: 14, padding: '10px 22px' }}
                        id="btn-invite-create-account"
                      >
                        Create Account to Connect
                      </button>
                      <button
                        onClick={() => onRequireAuth?.('signin')}
                        className="btn btn-secondary"
                        style={{ fontSize: 14, padding: '10px 20px' }}
                        id="btn-invite-sign-in"
                      >
                        Sign In with Existing Account
                      </button>
                      <button
                        onClick={handleDeclineIncomingInvite}
                        className="btn btn-ghost"
                        style={{ fontSize: 13, color: 'var(--gray)' }}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                      <button
                        onClick={handleAcceptIncomingInvite}
                        disabled={isPairing}
                        className="btn btn-primary"
                        style={{ fontSize: 14, padding: '10px 24px' }}
                        id="btn-accept-partner-invitation"
                      >
                        {isPairing ? <RefreshCw size={15} className="animate-spin" /> : <UserCheck size={16} />}
                        <span>{isPairing ? 'Connecting Partner...' : 'Accept Invitation & Connect'}</span>
                      </button>
                      <button
                        onClick={handleDeclineIncomingInvite}
                        disabled={isPairing}
                        className="btn btn-secondary"
                        style={{ fontSize: 13.5, padding: '10px 18px' }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Invitation Box */}
          <div
            style={{
              background: 'var(--surface-tint)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 32px',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              maxWidth: 720,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--charcoal)', margin: 0 }}>
                  Invite your partner
                </h3>
                <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                  Pending Partner Connection
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.5, margin: '6px 0 0' }}>
                Share your invitation code or private invitation link. Once your partner opens it and accepts, your persistent shared communication room will be activated.
              </p>
            </div>

            {/* Display Invitation Code */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)' }}>
                  Your Private Invitation Code
                </span>
                <code id="invitation-code-display" style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, color: 'var(--burgundy)', letterSpacing: '0.06em' }}>
                  {inviteCode}
                </code>
              </div>
              <button
                id="btn-copy-invite-code"
                onClick={handleCopyCode}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                {copiedCode ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Display Invitation Link */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)' }}>
                Private Invitation Link
              </span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  id="invitation-link-input"
                  className="input-field"
                  style={{ fontSize: 13, background: '#FFFFFF', flex: 1, minWidth: 240 }}
                />
                <button
                  id="btn-copy-invite-link"
                  onClick={handleCopyInvite}
                  className="btn btn-primary"
                  style={{ padding: '0 20px', fontSize: 13.5 }}
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Invitation Link'}</span>
                </button>
              </div>
            </div>

            {inviteExpiresAt && (
              <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                Valid for 7 days (expires {new Date(inviteExpiresAt).toLocaleDateString()})
              </span>
            )}

            {/* How Partner Joins Instructions */}
            <div style={{
              background: 'var(--warm-white)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              border: '1px solid var(--border-subtle)',
              fontSize: 12.5,
              color: 'var(--charcoal-muted)',
              lineHeight: 1.55
            }}>
              <strong style={{ color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>
                How your partner joins:
              </strong>
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                <li>Copy either your <strong>Invitation Code</strong> or <strong>Invitation Link</strong> above.</li>
                <li>Send it to your partner via private text message, email, or chat.</li>
                <li>When they open the link or paste the code below, your shared room is instantly activated.</li>
              </ol>
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
                  placeholder="Paste invite code (e.g. hws_8f3a92e1...)"
                  className="input-field"
                  style={{ fontSize: 13, background: '#FFFFFF', flex: 1, minWidth: 240 }}
                />
                <button
                  id="btn-connect-partner"
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
              {pairingSuccess && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>{pairingSuccess}</span>}
            </div>
          </div>

          {/* Privacy Clarity Guarantee */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
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
                  Your individual conversations with Mira, practice rehearsals, and personal notes remain 100% confidential. Your partner cannot view them.
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
                  Only conversations and exercises created inside the My Partner space are accessible to both partners and eligible for Mira analysis.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'dialogue' ? (
        /* ── TAB 1: SHARED DIALOGUE & MIRA AI ANALYSIS ────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Privacy Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderRadius: 12,
            background: 'rgba(196, 30, 58, 0.05)',
            border: '1px solid rgba(196, 30, 58, 0.15)',
            fontSize: 13,
            color: 'var(--charcoal)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} className="text-burgundy" style={{ color: 'var(--burgundy)' }} />
              <strong style={{ fontWeight: 600, color: 'var(--burgundy)' }}>Shared Couple Dialogue</strong>
              <span style={{ color: 'var(--gray)' }}>• Visible to both you and {partnerDisplayName}</span>
            </div>
            <span style={{ fontSize: 12, color: 'var(--gray)' }}>Private Mira chats remain completely confidential</span>
          </div>

          {/* Conversation Workspace Layout */}
          <div className="workspace-dialogue-grid">
            {/* Left: Shared Topics Sidebar */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Shared Topics
                </span>
                <button
                  onClick={() => setShowNewTopicModal(true)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: 11.5 }}
                >
                  <Plus size={13} />
                  <span>New Topic</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1 }}>
                {sharedConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveSharedConvId(conv.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: activeSharedConvId === conv.id ? 'var(--blush-soft)' : 'transparent',
                      border: activeSharedConvId === conv.id ? '1px solid var(--burgundy)' : '1px solid transparent',
                      color: activeSharedConvId === conv.id ? 'var(--burgundy)' : 'var(--charcoal)',
                      fontWeight: activeSharedConvId === conv.id ? 600 : 400,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.title}
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Message Stream & Mira Analysis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Message Box */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                height: 480,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {/* Active Topic Header & Mira Analysis Trigger */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
                      {sharedConversations.find(c => c.id === activeSharedConvId)?.title || 'Shared Dialogue'}
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                      Both partners can contribute perspectives here
                    </span>
                  </div>

                  <button
                    onClick={() => setShowConsentModal(true)}
                    disabled={isAnalyzing || sharedMessages.length < 2}
                    className="btn btn-primary"
                    style={{ fontSize: 12.5, padding: '8px 16px', background: 'var(--burgundy)' }}
                  >
                    {isAnalyzing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Ask Mira to Analyze</span>
                  </button>
                </div>

                {analysisError && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(196, 30, 58, 0.08)', color: 'var(--burgundy)', fontSize: 12.5, marginBottom: 12 }}>
                    {analysisError}
                  </div>
                )}

                {/* Message Feed */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 6 }}>
                  {sharedMessages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--gray)', padding: 30 }}>
                      <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <p style={{ fontSize: 14, margin: 0 }}>This shared conversation is ready.</p>
                      <span style={{ fontSize: 12 }}>Start by sharing what has been on your mind regarding this topic.</span>
                    </div>
                  ) : (
                    sharedMessages.map((m) => {
                      const isMe = m.user_id === user?.id
                      const senderLabel = isMe ? 'You' : partnerDisplayName
                      return (
                        <div
                          key={m.id}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isMe ? 'var(--burgundy)' : 'var(--charcoal)' }}>
                              {senderLabel}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--gray)' }}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{
                            padding: '12px 16px',
                            borderRadius: 14,
                            background: isMe ? 'var(--blush-soft)' : '#F9F8F6',
                            border: isMe ? '1px solid rgba(196, 30, 58, 0.2)' : '1px solid var(--border)',
                            color: 'var(--charcoal)',
                            fontSize: 13.5,
                            lineHeight: 1.55
                          }}>
                            {m.content}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 8 }}>
                  <input
                    type="text"
                    value={newSharedMsgText}
                    onChange={(e) => setNewSharedMsgText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendSharedMessage()
                      }
                    }}
                    placeholder={`Message ${partnerDisplayName}...`}
                    className="input-field"
                    style={{ fontSize: 13.5, background: '#FFFFFF', flex: 1 }}
                  />
                  <button
                    onClick={handleSendSharedMessage}
                    disabled={isSendingMsg || !newSharedMsgText.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0 20px', fontSize: 13 }}
                  >
                    {isSendingMsg ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Send</span>
                  </button>
                </div>
              </div>

              {/* Analysis Result Card */}
              {currentAnalysis && (
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid var(--gold)',
                  borderRadius: 'var(--radius-card)',
                  padding: 28,
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--blush-soft)', color: 'var(--burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
                          Mira Clinical Conversation Analysis
                        </h4>
                        <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
                          Balanced synthesis of both perspectives • Visible to both partners
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-gold">Authorized Analysis</span>
                  </div>

                  {/* Overview */}
                  <div>
                    <h5 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--burgundy)', marginBottom: 6 }}>
                      Interaction Dynamic Overview
                    </h5>
                    <p style={{ fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.6, margin: 0 }}>
                      {currentAnalysis.overview}
                    </p>
                  </div>

                  {/* Perspectives Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
                    <div style={{ background: 'var(--surface-tint)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <strong style={{ fontSize: 13, color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>
                        {myDisplayName}'s Underlying Longing
                      </strong>
                      <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.55 }}>
                        {currentAnalysis.partner_1_perspective || "Longing for emotional presence, reassurance, and shared clarity."}
                      </p>
                    </div>

                    <div style={{ background: 'var(--surface-tint)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                      <strong style={{ fontSize: 13, color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>
                        {partnerDisplayName}'s Underlying Longing
                      </strong>
                      <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.55 }}>
                        {currentAnalysis.partner_2_perspective || "Longing for emotional safety, decompression room, and feeling accepted."}
                      </p>
                    </div>
                  </div>

                  {/* Misunderstandings */}
                  {currentAnalysis.misunderstandings?.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 8 }}>
                        Where Words Got Twisted
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {currentAnalysis.misunderstandings.map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--gray)' }}>
                            <span style={{ color: 'var(--burgundy)', fontWeight: 700 }}>•</span>
                            <span>{m}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3 Practical Repair Steps & Scripts */}
                  {currentAnalysis.repair_steps?.length > 0 && (
                    <div>
                      <h5 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--burgundy)', marginBottom: 10 }}>
                        3 Concrete Repair Actions & Phrasing
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {currentAnalysis.repair_steps.map((s, idx) => (
                          <div key={idx} style={{ background: 'var(--cream)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--burgundy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                                {s.step || idx + 1}
                              </span>
                              <strong style={{ fontSize: 13.5, color: 'var(--charcoal)' }}>{s.title}</strong>
                            </div>
                            <p style={{ fontSize: 12.5, color: 'var(--gray)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                              {s.action}
                            </p>
                            {s.scriptPartner1 && (
                              <div style={{ fontSize: 12.5, color: 'var(--burgundy)', fontStyle: 'italic', marginBottom: 4 }}>
                                <strong>{myDisplayName}: </strong>{s.scriptPartner1}
                              </div>
                            )}
                            {s.scriptPartner2 && (
                              <div style={{ fontSize: 12.5, color: '#4338CA', fontStyle: 'italic' }}>
                                <strong>{partnerDisplayName}: </strong>{s.scriptPartner2}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarifying Questions */}
                  {currentAnalysis.clarifying_questions?.length > 0 && (
                    <div style={{ background: 'var(--surface-tint)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', display: 'block', marginBottom: 6 }}>
                        Questions to Gently Explore Together:
                      </span>
                      {currentAnalysis.clarifying_questions.map((q, idx) => (
                        <div key={idx} style={{ fontSize: 12.5, color: 'var(--gray)', marginBottom: 4 }}>
                          • {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── TAB 2: GUIDED PERSPECTIVE EXERCISES (EXISTING FEATURE) ────────── */
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
                <span className="badge badge-neutral" style={{ marginBottom: 6 }}>Guided Reflection Exercise</span>
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
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
                  rows={3}
                  value={myExperience}
                  onChange={(e) => setMyExperience(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 13, background: '#FFFFFF', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                  Emotions felt underneath the surface:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {COMMON_EMOTIONS.map((eName) => {
                    const sel = myEmotions.includes(eName)
                    return (
                      <button
                        key={eName}
                        type="button"
                        onClick={() => toggleEmotion(eName)}
                        style={{
                          padding: '5px 11px',
                          fontSize: 11.5,
                          borderRadius: 20,
                          border: sel ? '1px solid var(--burgundy)' : '1px solid var(--border)',
                          background: sel ? 'var(--blush-soft)' : '#FFFFFF',
                          color: sel ? 'var(--burgundy)' : 'var(--charcoal)',
                          cursor: 'pointer',
                          fontWeight: sel ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        {eName}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                  What do you genuinely need from {partnerDisplayName}?
                </label>
                <textarea
                  rows={2}
                  value={myUnderlyingNeed}
                  onChange={(e) => setMyUnderlyingNeed(e.target.value)}
                  className="input-field"
                  style={{ fontSize: 13, background: '#FFFFFF', resize: 'vertical' }}
                />
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 6 }}>
                {myShared ? (
                  <>
                    <CheckCircle2 size={13} style={{ color: '#059669' }} />
                    <span>Shared: {partnerDisplayName} and Mira can view this reflection.</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} style={{ color: 'var(--burgundy)' }} />
                    <span>Private: {partnerDisplayName} cannot see this draft until shared.</span>
                  </>
                )}
              </div>
            </div>

            {/* ── Partner 2: Partner's Perspective ───────────────────────────── */}
            <div
              style={{
                background: '#FFFFFF',
                border: partnerHasShared ? '1.5px solid var(--gold-muted)' : '1px solid var(--border)',
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
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cream)', color: 'var(--gold-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {partnerDisplayName.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)' }}>Partner's Perspective</h3>
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>{partnerDisplayName}</span>
                  </div>
                </div>

                <span className={`badge ${partnerHasShared ? 'badge-gold' : 'badge-neutral'}`}>
                  {partnerHasShared ? 'Shared' : 'Pending Share'}
                </span>
              </div>

              {!partnerHasShared ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'var(--surface-tint)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border)',
                    gap: 10,
                  }}
                >
                  <Lock size={22} style={{ color: 'var(--gray)' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
                    Awaiting {partnerDisplayName}'s Reflection
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--gray)', maxWidth: 280, margin: 0, lineHeight: 1.5 }}>
                    Once both of you mark your reflections as shared, Mira will unlock the mutual mediation analysis.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 4 }}>
                      What felt difficult for {partnerDisplayName}:
                    </span>
                    <p style={{ fontSize: 13.5, color: 'var(--charcoal)', background: 'var(--surface-tint)', padding: 12, borderRadius: 8, margin: 0, lineHeight: 1.55 }}>
                      {partnerExperience}
                    </p>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 6 }}>
                      Emotions felt underneath:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {partnerEmotions.map((e) => (
                        <span key={e} className="badge badge-neutral" style={{ fontSize: 11 }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 4 }}>
                      What {partnerDisplayName} needs:
                    </span>
                    <p style={{ fontSize: 13.5, color: 'var(--charcoal)', background: 'var(--surface-tint)', padding: 12, borderRadius: 8, margin: 0, lineHeight: 1.55 }}>
                      {partnerNeed}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mediation Call-to-Action */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '24px 30px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 4 }}>
                Ask Mira to Mediate This Discussion
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0 }}>
                {myShared && partnerHasShared
                  ? "Both reflections are shared. Mira is ready to identify overlapping needs and suggest a gentle compromise."
                  : "Both partners must share their perspective before Mira can provide mutual mediation."}
              </p>
            </div>

            <button
              onClick={handleAskMiraJoint}
              disabled={!myShared || !partnerHasShared || isMediating}
              className="btn btn-primary"
              style={{ fontSize: 13.5, padding: '10px 22px' }}
            >
              {isMediating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>Ask Mira to help us</span>
            </button>
          </div>

          {/* Mediation Result Section */}
          {mediationResult && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid var(--burgundy)',
                borderRadius: 'var(--radius-card)',
                padding: '32px 36px',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blush-soft)', color: 'var(--burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
                    Mira's Balanced Mediation Summary
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                    Neutral synthesis of both nervous system needs
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--burgundy)', marginBottom: 6 }}>
                  Understanding the Underlying Cycle
                </h4>
                <p style={{ fontSize: 14.5, color: 'var(--charcoal)', lineHeight: 1.65, margin: 0 }}>
                  {mediationResult.overview}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--surface-tint)', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: 13, color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>
                    Your Underlying Longing:
                  </strong>
                  <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                    {mediationResult.partnerAView}
                  </p>
                </div>

                <div style={{ background: 'var(--surface-tint)', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <strong style={{ fontSize: 13, color: 'var(--charcoal)', display: 'block', marginBottom: 4 }}>
                    {partnerDisplayName}'s Underlying Longing:
                  </strong>
                  <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                    {mediationResult.partnerBView}
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--burgundy)', marginBottom: 8 }}>
                  Gentle Words to Try Together:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mediationResult.phrasesToUse.map((phrase, i) => (
                    <div key={i} style={{ background: 'var(--cream)', padding: '12px 16px', borderRadius: 8, fontSize: 13.5, fontStyle: 'italic', color: 'var(--charcoal)', border: '1px solid var(--border)' }}>
                      {phrase}
                    </div>
                  ))}
                </div>
              </div>

              {/* Our Agreed Next Steps */}
              <div style={{ background: 'var(--surface-tint)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--charcoal)', marginBottom: 10 }}>
                  Our Agreed Next Steps
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--charcoal)' }}>
                    <input type="checkbox" defaultChecked />
                    <span>Agree to a 20-minute transition boundary upon returning home.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--charcoal)' }}>
                    <input type="checkbox" checked={aiConsentBoth} onChange={(e) => setAiConsentBoth(e.target.checked)} />
                    <span>Joint consent: Both partners agree to let Mira mediate guided discussions.</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: NEW SHARED TOPIC ───────────────────────────────────────── */}
      {showNewTopicModal && (
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
            padding: 16
          }}
          onClick={() => setShowNewTopicModal(false)}
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
              gap: 18
            }}
          >
            <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
              Start a Shared Conversation Topic
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
              Choose a specific conversation topic to explore together with {partnerDisplayName}.
            </p>

            <input
              type="text"
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="e.g. Division of evening chores & rest..."
              className="input-field"
              style={{ fontSize: 14, background: '#FFFFFF' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewSharedTopic}
                disabled={!newTopicTitle.trim()}
                className="btn btn-primary"
                style={{ fontSize: 13 }}
              >
                Create Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MIRA AI ANALYSIS CONSENT ───────────────────────────────── */}
      {showConsentModal && (
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
            padding: 16
          }}
          onClick={() => setShowConsentModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-card)',
              maxWidth: 520,
              width: '100%',
              padding: '28px 32px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={22} style={{ color: 'var(--burgundy)' }} />
              <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--charcoal)', margin: 0 }}>
                Analyze Shared Conversation With Mira?
              </h3>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.6, margin: 0 }}>
              Mira will read the <strong>{sharedMessages.length} messages</strong> in this specific shared conversation between you and {partnerDisplayName} to highlight emotional longings, communication loops, and practical repair scripts.
            </p>

            <div style={{ background: 'var(--surface-tint)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Shield size={15} style={{ color: '#059669' }} />
                <strong style={{ fontSize: 12.5, color: 'var(--charcoal)' }}>Privacy & Boundaries Guarantee:</strong>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                <li>Your private individual chats with Mira are never accessed or shared.</li>
                <li>The analysis is completely neutral and never assigns blame or disorders.</li>
                <li>Both you and {partnerDisplayName} will have access to the resulting report.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => setShowConsentModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyzeSharedConversation}
                className="btn btn-primary"
                style={{ fontSize: 13, background: 'var(--burgundy)' }}
              >
                Proceed With Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HOW MIRA HELPS US SETTINGS ─────────────────────────────── */}
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
              maxWidth: 580,
              width: '100%',
              padding: '32px 36px',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal)' }}>
                  Couples Mediation Preferences
                </h3>
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                  Personal and shared preferences for when Mira facilitates discussions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="btn btn-ghost"
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: Individual Guidance Style */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Your Individual Style
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    Communication Tone:
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'gentle', label: 'Gentle' },
                      { id: 'balanced', label: 'Balanced' },
                      { id: 'direct', label: 'Direct' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setIndividualTone(t.id as any)}
                        className={`btn ${individualTone === t.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
                    Support Focus:
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'listen', label: 'Listen' },
                      { id: 'practical', label: 'Practical Steps' },
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
              Are you sure you want to disconnect from {partnerDisplayName}? Your private rehearsal sessions and individual Mira chats will remain completely intact.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
                disabled={isDisconnecting}
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="btn btn-primary"
                style={{ fontSize: 13, background: 'var(--burgundy)' }}
              >
                {isDisconnecting ? 'Disconnecting...' : 'Confirm Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
