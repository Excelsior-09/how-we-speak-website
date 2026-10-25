// ==============================================================================
// HOW WE SPEAK — CURATED SCRIPT BANK
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: Gottman & NVC communication scripts, Gumroad product locks, instant copy
// ==============================================================================

import React, { useState } from 'react'
import { Copy, Check, Search, Lock, ExternalLink } from 'lucide-react'
import { useAuth } from '../lib/useAuth'

interface ScriptItem {
  id: string
  category: string
  title: string
  context: string
  script: string
  whyItWorks: string
  requiredProduct?: string
  productTitle?: string
  productUrl?: string
}

export const ScriptsView: React.FC = () => {
  const { entitlements } = useAuth()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const hasBundle = entitlements.some((e) => e.product_key === 'bundle')
  const ownedKeys = entitlements.map((e) => e.product_key)

  const scripts: ScriptItem[] = [
    {
      id: 's1',
      category: 'DE_ESCALATION',
      title: 'When He Withdraws (Men Edition)',
      context: 'When your partner goes silent during an argument and you feel panic rising.',
      script: "I can see your nervous system is flooded right now, and I don't want to make things worse. I'm going to take a walk, and let's sit down in 20 minutes once our adrenaline is down.",
      whyItWorks: "Validates physiological flooding without accusing him of malicious stonewalling. Gives an exact return time so anxious pursuit isn't triggered.",
      requiredProduct: 'men-edition',
      productTitle: 'Men Edition Guide ($37)',
      productUrl: 'https://themindly.gumroad.com/l/How-We-Speak-Men-Edition',
    },
    {
      id: 's2',
      category: 'EMOTIONAL_SUPPORT',
      title: 'Listening Without Fixing (Women Edition)',
      context: 'When she shares an emotional struggle and you instinctively jump to problem-solving.',
      script: "That sounds genuinely overwhelming. Before I jump in with ideas, do you want me to just listen and hold space, or would you like help troubleshooting?",
      whyItWorks: "Distinguishes between empathy bids and practical advice bids. Prevents the common 'You don't listen' conflict loop.",
      requiredProduct: 'women-edition',
      productTitle: 'Women Edition Guide ($37)',
      productUrl: 'https://themindly.gumroad.com/l/howwespeak-women',
    },
    {
      id: 's3',
      category: 'APOLOGY',
      title: 'The Repair That Actually Lands',
      context: 'After an argument where you raised your voice or reacted defensively.',
      script: "I reacted out of fear earlier, and the way I spoke to you wasn't okay. You didn't deserve that tone. I'm sorry for closing down, and I want to hear how that felt for you.",
      whyItWorks: "Takes 100% ownership without the word 'but'. Invites their emotional experience rather than defending your intentions.",
      requiredProduct: 'script-collection',
      productTitle: 'Complete Script Collection ($27)',
      productUrl: 'https://themindly.gumroad.com/l/howwespeak-scripts',
    },
    {
      id: 's4',
      category: 'INTIMACY',
      title: 'Talking About Desire (Sex Talk Framework)',
      context: 'Initiating conversation about sexual mismatch without triggering rejection or inadequacy.',
      script: "I love our closeness, and I really miss feeling physically connected with you. There is zero pressure tonight—I just want us to talk about how we can make intimacy feel safe and exciting for both of us.",
      whyItWorks: "Removes immediate performance pressure and reaffirms love while directly addressing unmet intimacy needs.",
      requiredProduct: 'sex-talk',
      productTitle: 'Sex Talk Framework ($27)',
      productUrl: 'https://themindly.gumroad.com/l/howwespeak-bundle',
    },
    {
      id: 's5',
      category: 'BOUNDARIES',
      title: 'The Softened Space Request',
      context: 'When you need to be alone to process emotions without making your partner spiral.',
      script: "I love you and I am not leaving this conversation. My brain is just overloaded right now and I need 30 minutes of quiet so I can show up for you with kindness. Can we resume at 7:00?",
      whyItWorks: "Contains the three critical reassurances: Love affirmed, no abandonment, and exact resumption timestamp.",
      requiredProduct: 'trial', // Included in free trial
    },
  ]

  const categories = [
    { id: 'ALL', label: 'All Scripts' },
    { id: 'DE_ESCALATION', label: 'De-escalation' },
    { id: 'EMOTIONAL_SUPPORT', label: 'Emotional Support' },
    { id: 'APOLOGY', label: 'Apologies & Repair' },
    { id: 'INTIMACY', label: 'Intimacy & Sex Talk' },
    { id: 'BOUNDARIES', label: 'Boundaries' },
  ]

  const filtered = scripts.filter((s) => {
    const matchesCat = activeCategory === 'ALL' || s.category === activeCategory
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.script.toLowerCase().includes(search.toLowerCase()) ||
      s.context.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="badge badge-burgundy">Curated Clinical Bank</span>
          <span className="badge badge-gold">Gottman Tested</span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', marginBottom: 8 }}>
          Communication Script Bank
        </h1>
        <p style={{ color: 'var(--gray)', fontSize: 16, maxWidth: 720 }}>
          Clinical, ready-to-use conversation starters for difficult moments. Derived from the How We Speak guides and Gottman Institute research.
        </p>
      </div>

      {/* Controls: Search and Filter Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative', maxWidth: 480 }}>
          <Search size={18} color="var(--gray)" style={{ position: 'absolute', left: 16, top: 15 }} />
          <input
            type="text"
            placeholder="Search scripts by keyword, emotion, or situation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 46 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`btn ${activeCategory === c.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: 13 }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Script Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24,
      }}>
        {filtered.map((s) => {
          const isUnlocked =
            !s.requiredProduct ||
            s.requiredProduct === 'trial' ||
            hasBundle ||
            ownedKeys.includes(s.requiredProduct as any)

          return (
            <div
              key={s.id}
              className="card-glass"
              style={{
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-blush" style={{ marginBottom: 8 }}>{s.category.replace('_', ' ')}</span>
                  <h3 style={{ fontSize: 20 }}>{s.title}</h3>
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => handleCopy(s.id, s.script)}
                    className="btn btn-ghost"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    {copiedId === s.id ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                    {copiedId === s.id ? 'Copied' : 'Copy Script'}
                  </button>
                ) : (
                  <span className="badge badge-gold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lock size={12} />
                    Locked
                  </span>
                )}
              </div>

              <p style={{ fontSize: 13, color: 'var(--gray)', fontStyle: 'italic' }}>
                When to use: {s.context}
              </p>

              <div style={{
                background: 'var(--pure-white)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                borderLeft: '4px solid var(--burgundy)',
                fontSize: 14.5,
                color: 'var(--charcoal)',
                lineHeight: 1.6,
              }}>
                "{s.script}"
              </div>

              <div style={{
                background: 'var(--cream)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontSize: 12,
                color: 'var(--charcoal-muted)',
                marginTop: 'auto',
              }}>
                <strong>Psychological Mechanism:</strong> {s.whyItWorks}
              </div>

              {!isUnlocked && s.productUrl && (
                <div style={{
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>Included in {s.productTitle}</span>
                  <a
                    href={s.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    <span>Unlock Guide</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
