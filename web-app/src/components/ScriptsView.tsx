// ==============================================================================
// HOW WE SPEAK — GUIDES & COMMUNICATION SCRIPTS LIBRARY
// Palette: Burgundy #C41E3A | Cream #F5F3F0 | Gold #D4AF37 | Blush #E8CCC8
// Features: 130+ structured scripts across 13 clinical categories,
//           search, category/tone filters, favorites persistence,
//           script detail view, inline personalization, and Ask Mira integration
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Copy,
  Check,
  Heart,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  BookOpen,
  X,
  Wand2,
  ChevronRight,
  Tag
} from 'lucide-react'
import {
  SCRIPTS_LIBRARY,
  SCRIPT_CATEGORIES,
  searchScripts,
  type ScriptItem
} from '../data/scriptsLibrary'
import { useAuth } from '../lib/useAuth'
import { useRouter } from '../lib/useRouter'
import { supabase } from '../lib/supabase'

export const ScriptsView: React.FC = () => {
  const { user, isConfigured } = useAuth()
  const { navigate } = useRouter()

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTone, setSelectedTone] = useState<string>('ALL')
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  // Pagination / Display limit
  const [displayCount, setDisplayCount] = useState(12)

  // Copy feedback & active detail modal
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeScript, setActiveScript] = useState<ScriptItem | null>(null)

  // Personalization drawer/editor state inside modal
  const [isPersonalizing, setIsPersonalizing] = useState(false)
  const [customDetail, setCustomDetail] = useState('')
  const [tailoredVersion, setTailoredVersion] = useState<string | null>(null)

  // Favorites state (persisted locally and synced with Supabase if authenticated)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hws_script_favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Load favorites from Supabase on mount
  useEffect(() => {
    async function loadFavorites() {
      if (user && isConfigured) {
        try {
          const { data } = await supabase
            .from('script_favorites')
            .select('script_id')
            .eq('user_id', user.id)

          if (data && data.length > 0) {
            const dbFavorites = data.map((d: any) => d.script_id)
            setFavoriteIds((prev) => Array.from(new Set([...prev, ...dbFavorites])))
          }
        } catch {
          // Keep local fallback
        }
      }
    }
    loadFavorites()
  }, [user, isConfigured])

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hws_script_favorites', JSON.stringify(favoriteIds))
    } catch {}
  }, [favoriteIds])

  // Toggle favorite
  const toggleFavorite = async (scriptId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const isFav = favoriteIds.includes(scriptId)
    const nextFavorites = isFav
      ? favoriteIds.filter((id) => id !== scriptId)
      : [...favoriteIds, scriptId]

    setFavoriteIds(nextFavorites)

    if (user && isConfigured) {
      try {
        if (isFav) {
          await supabase
            .from('script_favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('script_id', scriptId)
        } else {
          await supabase
            .from('script_favorites')
            .insert({ user_id: user.id, script_id: scriptId })
        }
      } catch {
        // Silently preserve local state
      }
    }
  }

  // Filtered scripts calculation
  const filteredScripts = useMemo(() => {
    let result = searchQuery.trim()
      ? searchScripts(searchQuery)
      : [...SCRIPTS_LIBRARY]

    if (selectedCategory !== 'ALL') {
      result = result.filter((s) => s.category === selectedCategory)
    }

    if (selectedTone !== 'ALL') {
      result = result.filter((s) => s.tone.toLowerCase() === selectedTone.toLowerCase())
    }

    if (onlyFavorites) {
      result = result.filter((s) => favoriteIds.includes(s.id))
    }

    return result
  }, [searchQuery, selectedCategory, selectedTone, onlyFavorites, favoriteIds])

  const visibleScripts = filteredScripts.slice(0, displayCount)

  const handleCopy = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleOpenDetail = (script: ScriptItem) => {
    setActiveScript(script)
    setIsPersonalizing(false)
    setCustomDetail('')
    setTailoredVersion(null)
  }

  const handleCloseDetail = () => {
    setActiveScript(null)
    setIsPersonalizing(false)
    setCustomDetail('')
    setTailoredVersion(null)
  }

  // Ask Mira to adapt script
  const handleAskMiraToAdapt = (script: ScriptItem) => {
    const prompt = `I want to adapt this communication script for my situation:\n\n"${script.script}"\n\nSituation: ${script.situation}\nMy goal: ${script.goal}${customDetail ? `\nMy context: ${customDetail}` : ''}\n\nCould you help me personalize this so it feels natural for my relationship?`
    sessionStorage.setItem('hws_mira_prefill', prompt)
    navigate('/app/mira')
  }

  // Generate quick inline tailored draft
  const handleGenerateTailored = () => {
    if (!activeScript) return
    const custom = customDetail.trim()
    let adapted = activeScript.script
    if (custom) {
      adapted = adapted.replace(/\[specific[^\]]*\]/gi, custom)
      if (!adapted.includes(custom)) {
        adapted = `${adapted} Specifically regarding ${custom}, I want us to feel good talking through this.`
      }
    }
    setTailoredVersion(adapted)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(196, 30, 58, 0.04) 0%, rgba(212, 175, 55, 0.04) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '36px 36px 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="badge badge-burgundy" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <BookOpen size={12} />
            Communication Library
          </span>
          <span className="badge badge-gold">
            {SCRIPTS_LIBRARY.length} Verified Scripts
          </span>
          <span className="badge badge-neutral">
            {SCRIPT_CATEGORIES.length} Categories
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(28px, 3.4vw, 42px)',
            fontWeight: 700,
            color: 'var(--charcoal)',
            letterSpacing: '-0.02em',
            marginBottom: 10,
            lineHeight: 1.2,
          }}
        >
          Find the words for what you're going through.
        </h1>

        <p
          style={{
            color: 'var(--gray)',
            fontSize: 16.5,
            maxWidth: 760,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Explore practical examples, learn why certain words work better, and adapt each script to sound like you.
        </p>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: 640 }}>
          <Search
            size={18}
            color="var(--gray)"
            style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search by situation, keyword, emotion, or goal (e.g. defensiveness, late notice, emotional distance)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setDisplayCount(12)
            }}
            className="input-field"
            style={{
              paddingLeft: 48,
              paddingRight: 40,
              height: 48,
              fontSize: 14.5,
              background: '#FFFFFF',
              boxShadow: 'var(--shadow-sm)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--gray)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER CONTROLS ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'thin',
          }}
        >
          <button
            onClick={() => {
              setSelectedCategory('ALL')
              setDisplayCount(12)
            }}
            className={`btn ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '7px 15px', fontSize: 13, flexShrink: 0 }}
          >
            All Categories ({SCRIPTS_LIBRARY.length})
          </button>
          {SCRIPT_CATEGORIES.map((cat) => {
            const count = SCRIPTS_LIBRARY.filter((s) => s.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id)
                  setDisplayCount(12)
                }}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '7px 14px', fontSize: 13, flexShrink: 0 }}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Tone and Favorites Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--surface-tint)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--gray)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <SlidersHorizontal size={13} />
              Tone:
            </span>
            {['ALL', 'Gentle', 'Balanced', 'Direct'].map((tone) => (
              <button
                key={tone}
                onClick={() => {
                  setSelectedTone(tone)
                  setDisplayCount(12)
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 12,
                  fontWeight: selectedTone === tone ? 600 : 500,
                  border: selectedTone === tone ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                  background: selectedTone === tone ? 'var(--blush-soft)' : '#FFFFFF',
                  color: selectedTone === tone ? 'var(--burgundy-dark)' : 'var(--charcoal)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {tone === 'ALL' ? 'All Tones' : tone}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 12.5,
                fontWeight: 600,
                border: onlyFavorites ? '1.5px solid var(--burgundy)' : '1px solid var(--border)',
                background: onlyFavorites ? 'var(--blush-soft)' : '#FFFFFF',
                color: onlyFavorites ? 'var(--burgundy)' : 'var(--charcoal)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <Heart size={13} fill={onlyFavorites ? 'var(--burgundy)' : 'none'} color={onlyFavorites ? 'var(--burgundy)' : 'var(--gray)'} />
              <span>Saved Favorites ({favoriteIds.length})</span>
            </button>

            <span style={{ fontSize: 12.5, color: 'var(--gray)' }}>
              Showing {Math.min(visibleScripts.length, filteredScripts.length)} of {filteredScripts.length} results
            </span>
          </div>
        </div>
      </div>

      {/* ── SCRIPT CARDS GRID ─────────────────────────────────────────────── */}
      {filteredScripts.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: 48,
            textAlign: 'center',
          }}
        >
          <BookOpen size={32} color="var(--gray)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 6 }}>
            No scripts found
          </h3>
          <p style={{ fontSize: 14, color: 'var(--gray)', maxWidth: 440, margin: '0 auto 16px' }}>
            Try broadening your search term, clearing your tone filters, or checking all categories.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('ALL')
              setSelectedTone('ALL')
              setOnlyFavorites(false)
            }}
            className="btn btn-secondary"
            style={{ fontSize: 13 }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 22,
          }}
        >
          {visibleScripts.map((item) => {
            const isFav = favoriteIds.includes(item.id)
            const catName = SCRIPT_CATEGORIES.find((c) => c.id === item.category)?.name || item.category

            return (
              <div
                key={item.id}
                onClick={() => handleOpenDetail(item)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(196, 30, 58, 0.35)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                {/* Card Top: Badges and Favorite Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-blush" style={{ fontSize: 11 }}>{catName}</span>
                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>{item.tone}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(item.id, e)}
                      aria-label="Save to favorites"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: '50%',
                        color: isFav ? 'var(--burgundy)' : 'var(--gray)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Heart size={16} fill={isFav ? 'var(--burgundy)' : 'none'} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.id, item.script, e)}
                      title="Copy script"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: '50%',
                        color: copiedId === item.id ? '#2ecc71' : 'var(--gray)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Script Title */}
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.35, marginBottom: 6 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <strong>Situation:</strong> {item.situation}
                  </p>
                </div>

                {/* Script Quote */}
                <div
                  style={{
                    background: 'var(--surface-tint)',
                    borderLeft: '3.5px solid var(--burgundy)',
                    padding: '12px 14px',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    fontSize: 14,
                    color: 'var(--charcoal)',
                    lineHeight: 1.55,
                    fontStyle: 'normal',
                  }}
                >
                  "{item.script}"
                </div>

                {/* Why It Works Mechanism */}
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--charcoal-muted)',
                    lineHeight: 1.5,
                    background: 'var(--cream)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginTop: 'auto',
                  }}
                >
                  <strong style={{ color: 'var(--burgundy)' }}>Why this works:</strong> {item.whyItWorks}
                </div>

                {/* Card Action Link */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--burgundy)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={13} />
                    Personalize or Adapt
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    Open Guide
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── PAGINATION / LOAD MORE ───────────────────────────────────────── */}
      {displayCount < filteredScripts.length && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={() => setDisplayCount((prev) => prev + 12)}
            className="btn btn-secondary"
            style={{ padding: '10px 28px', fontSize: 14 }}
          >
            Load More Scripts ({filteredScripts.length - displayCount} remaining)
          </button>
        </div>
      )}

      {/* ── SCRIPT DETAIL & PERSONALIZATION MODAL ─────────────────────────── */}
      {activeScript && (
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
          onClick={handleCloseDetail}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-card)',
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px 36px',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {/* Modal Top Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <span className="badge badge-blush">
                    {SCRIPT_CATEGORIES.find((c) => c.id === activeScript.category)?.name || activeScript.category}
                  </span>
                  <span className="badge badge-neutral">Tone: {activeScript.tone}</span>
                  <span className="badge badge-gold">ID: {activeScript.id}</span>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--charcoal)', lineHeight: 1.3 }}>
                  {activeScript.title}
                </h2>
              </div>

              <button
                onClick={handleCloseDetail}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--gray)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Situation & Goal */}
            <div
              style={{
                background: 'var(--surface-tint)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                border: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray)', marginBottom: 4 }}>
                  Situation
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.5 }}>
                  {activeScript.situation}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray)', marginBottom: 4 }}>
                  Intended Goal
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--charcoal)', lineHeight: 1.5 }}>
                  {activeScript.goal}
                </div>
              </div>
            </div>

            {/* Main Script Box */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid var(--burgundy)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 22px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--burgundy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Example Wording
                </span>
                <button
                  onClick={() => handleCopy(activeScript.id, activeScript.script)}
                  className="btn btn-secondary"
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  {copiedId === activeScript.id ? <Check size={14} color="#2ecc71" /> : <Copy size={14} />}
                  <span>{copiedId === activeScript.id ? 'Copied to Clipboard' : 'Copy Words'}</span>
                </button>
              </div>

              <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--charcoal)', fontWeight: 500 }}>
                "{activeScript.script}"
              </div>
            </div>

            {/* Why It Works Mechanism */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)', marginBottom: 6 }}>
                Why this wording may help
              </h4>
              <p style={{ fontSize: 13.5, color: 'var(--gray)', lineHeight: 1.6 }}>
                {activeScript.whyItWorks}
              </p>
            </div>

            {/* Alternative Variations: Softer & Direct */}
            {(activeScript.softerVersion || activeScript.directVersion) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {activeScript.softerVersion && (
                  <div
                    style={{
                      background: 'var(--cream)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)' }}>Softer Version</span>
                      <button
                        onClick={() => handleCopy(`${activeScript.id}-softer`, activeScript.softerVersion!)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: copiedId === `${activeScript.id}-softer` ? '#2ecc71' : 'var(--gray)' }}
                      >
                        {copiedId === `${activeScript.id}-softer` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{activeScript.softerVersion}"
                    </p>
                  </div>
                )}

                {activeScript.directVersion && (
                  <div
                    style={{
                      background: 'var(--cream)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)' }}>More Direct Version</span>
                      <button
                        onClick={() => handleCopy(`${activeScript.id}-direct`, activeScript.directVersion!)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, color: copiedId === `${activeScript.id}-direct` ? '#2ecc71' : 'var(--gray)' }}
                      >
                        {copiedId === `${activeScript.id}-direct` ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--charcoal)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{activeScript.directVersion}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Personalization Tip */}
            {activeScript.personalizationTip && (
              <div
                style={{
                  background: 'var(--surface-tint)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  color: 'var(--charcoal-muted)',
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: 'var(--burgundy)' }}>Personalization Tip: </strong>
                {activeScript.personalizationTip}
              </div>
            )}

            {/* Tags */}
            {activeScript.tags && activeScript.tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Tag size={13} color="var(--gray)" />
                {activeScript.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11.5,
                      color: 'var(--gray)',
                      background: 'var(--cream)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Interactive Inline Personalizer */}
            {isPersonalizing && (
              <div
                style={{
                  background: 'var(--cream)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  border: '1px solid rgba(196, 30, 58, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wand2 size={16} color="var(--burgundy)" />
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--burgundy-dark)' }}>
                    Personalize for your relationship
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--charcoal-muted)' }}>
                  Add specific details (e.g. what happened, what time you need, your partner's name) to tailor the phrasing:
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={customDetail}
                    onChange={(e) => setCustomDetail(e.target.value)}
                    placeholder="e.g. late dinner notifications, 30 minutes of quiet, weekend plans..."
                    className="input-field"
                    style={{ fontSize: 13, background: '#FFFFFF', flex: 1 }}
                  />
                  <button
                    onClick={handleGenerateTailored}
                    className="btn btn-secondary"
                    style={{ padding: '0 16px', fontSize: 13 }}
                  >
                    Tailor
                  </button>
                </div>

                {tailoredVersion && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: 'var(--charcoal)',
                      marginTop: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--burgundy)' }}>Your Tailored Draft</span>
                      <button
                        onClick={() => handleCopy('tailored', tailoredVersion)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--burgundy)', fontWeight: 600 }}
                      >
                        {copiedId === 'tailored' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    "{tailoredVersion}"
                  </div>
                )}
              </div>
            )}

            {/* Bottom Modal Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleFavorite(activeScript.id)}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  <Heart
                    size={14}
                    fill={favoriteIds.includes(activeScript.id) ? 'var(--burgundy)' : 'none'}
                    color={favoriteIds.includes(activeScript.id) ? 'var(--burgundy)' : 'var(--gray)'}
                  />
                  <span>{favoriteIds.includes(activeScript.id) ? 'Saved to Favorites' : 'Save Favorite'}</span>
                </button>

                <button
                  onClick={() => setIsPersonalizing(!isPersonalizing)}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  <Wand2 size={14} />
                  <span>{isPersonalizing ? 'Hide Editor' : 'Personalize This Script'}</span>
                </button>
              </div>

              <button
                onClick={() => handleAskMiraToAdapt(activeScript)}
                className="btn btn-primary"
                style={{ fontSize: 13.5 }}
              >
                <Sparkles size={14} />
                <span>Ask Mira to Adapt It</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
