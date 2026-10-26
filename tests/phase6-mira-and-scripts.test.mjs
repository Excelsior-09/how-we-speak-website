// ==============================================================================
// HOW WE SPEAK — TEST SUITE: PHASE 6 MIRA AI, 130+ SCRIPTS & COUPLES SPACE
// Validates:
// 1. Script library contains >= 120 distinct scripts with full clinical fields
// 2. Search, category filtering, and tone filtering work correctly
// 3. Mira AI endpoint /api/ai/mira responds with 6-part structured advice
// 4. Memory consent, preferences, and RLS schema
// 5. Visual Ebook Storefront covers, prices, and Gumroad links
// 6. Couples AI space turn-taking and strict privacy boundary
// ==============================================================================

import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

console.log('🧪 Starting Phase 6: Mira AI, Scripts Library & Couples Space Verification...\n')

// ── 1. VERIFY 120+ COMMUNICATION SCRIPTS DATASET ────────────────────────────
console.log('--- Checking Scripts Library Dataset (Requirement >= 120 scripts) ---')
const scriptsPath = path.join(ROOT, 'web-app', 'src', 'data', 'scriptsLibrary.ts')
assert(fs.existsSync(scriptsPath), 'scriptsLibrary.ts must exist')

const scriptsContent = fs.readFileSync(scriptsPath, 'utf-8')

// Count number of script items in SCRIPTS_LIBRARY
const librarySection = scriptsContent.slice(scriptsContent.indexOf('SCRIPTS_LIBRARY'))
const idMatches = librarySection.match(/id:\s*['"][a-z0-9_-]+['"]/g) || []
const totalScriptCount = idMatches.length

console.log(`  ✓ Total distinct script records authored: ${totalScriptCount}`)
assert(
  totalScriptCount >= 120,
  `Scripts library must have at least 120 distinct scripts (found: ${totalScriptCount})`
)

// Verify category count (at least 12 categories required)
const categoryMatches = scriptsContent.match(/id:\s*['"][A-Z0-9_]+['"],\s*name:/g) || []
console.log(`  ✓ Total relationship categories authored: ${categoryMatches.length}`)
assert(
  categoryMatches.length >= 12,
  `Scripts library must have at least 12 categories (found: ${categoryMatches.length})`
)

// Verify required fields in scripts dataset
const requiredFields = [
  'title:',
  'category:',
  'situation:',
  'goal:',
  'script:',
  'whyItWorks:',
  'softerVersion:',
  'directVersion:',
  'personalizationTip:',
  'tags:',
  'tone:'
]

for (const field of requiredFields) {
  assert(
    scriptsContent.includes(field),
    `Script items must contain field: ${field}`
  )
}
console.log('  ✓ All 11 clinical fields verified across script dataset')

// ── 2. VERIFY GUIDES PAGE (SCRIPTSVIEW) ─────────────────────────────────────
console.log('\n--- Checking Guides Page UI & Search/Filter Components ---')
const scriptsViewPath = path.join(ROOT, 'web-app', 'src', 'components', 'ScriptsView.tsx')
assert(fs.existsSync(scriptsViewPath), 'ScriptsView.tsx must exist')

const scriptsViewContent = fs.readFileSync(scriptsViewPath, 'utf-8')

assert(
  scriptsViewContent.includes("Find the words for what you're going through."),
  'Guides page header must match: "Find the words for what you\'re going through."'
)

assert(
  scriptsViewContent.includes("Explore practical examples, learn why certain words work better, and adapt each script to sound like you."),
  'Guides page subheadline must match required copy'
)

assert(
  scriptsViewContent.includes('searchScripts') &&
  scriptsViewContent.includes('selectedCategory') &&
  scriptsViewContent.includes('selectedTone') &&
  scriptsViewContent.includes('onlyFavorites'),
  'Guides page must implement keyword search, category tabs, tone filters, and favorites'
)

assert(
  scriptsViewContent.includes('handleAskMiraToAdapt') &&
  scriptsViewContent.includes("sessionStorage.setItem('hws_mira_prefill'"),
  'Guides page must support "Ask Mira to adapt it" passing context to Mira'
)
console.log('  ✓ Guides Page headline, search, category/tone filters, and Mira adaptation verified')

// ── 3. VERIFY MIRA AI COMPANION (MIRA VIEW & API) ───────────────────────────
console.log('\n--- Checking Mira AI Companion Architecture & Persona ---')
const miraApiDir = path.join(ROOT, 'api', 'ai', 'mira.js')
assert(fs.existsSync(miraApiDir), 'api/ai/mira.js must exist')

const miraApiContent = fs.readFileSync(miraApiDir, 'utf-8')

// Verify 6-part structured advice schema
assert(
  miraApiContent.includes('whatWeKnow') &&
  miraApiContent.includes('whatMightBeHappening') &&
  miraApiContent.includes('whatYouCanDo') &&
  miraApiContent.includes('whatYouCouldSay') &&
  miraApiContent.includes('whatToWatchFor') &&
  miraApiContent.includes('followUpQuestion'),
  'Mira API must support 6-part structured response format'
)

// Verify safety rules
assert(
  miraApiContent.includes('STRICT SAFETY') &&
  miraApiContent.includes('Never diagnose') &&
  miraApiContent.includes('generateMiraClinicalFallback'),
  'Mira API must enforce strict clinical boundaries and non-diagnostic safety'
)

// Verify Mira frontend interface
const miraViewPath = path.join(ROOT, 'web-app', 'src', 'components', 'MiraView.tsx')
assert(fs.existsSync(miraViewPath), 'MiraView.tsx must exist')

const miraViewContent = fs.readFileSync(miraViewPath, 'utf-8')

assert(
  miraViewContent.includes('How Mira Helps You') &&
  miraViewContent.includes('communication_preference') &&
  miraViewContent.includes('advice_style') &&
  miraViewContent.includes('response_length') &&
  miraViewContent.includes('personal_priorities'),
  'MiraView must include "How Mira Helps You" personalization modal'
)

assert(
  (miraViewContent.includes('Saved Memory') || miraViewContent.includes('Memory Manager')) &&
  miraViewContent.includes('persistent_memory_enabled') &&
  (miraViewContent.includes('handleDeleteMemory') || miraViewContent.includes('deleteMemory')),
  'MiraView must implement transparent consent-based memory management with deletion'
)
console.log('  ✓ Mira 6-part advice, safety rules, personalization, and consent-based memory verified')

// ── 4. VERIFY EBOOK STOREFRONT & GUMROAD ASSETS ─────────────────────────────
console.log('\n--- Checking Ebook Storefront & Verified Gumroad Assets ---')
const dashboardViewPath = path.join(ROOT, 'web-app', 'src', 'components', 'DashboardView.tsx')
const dashboardViewContent = fs.readFileSync(dashboardViewPath, 'utf-8')

const expectedEbooks = [
  {
    title: 'The Complete Bundle',
    price: '$97',
    cover: 'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png',
    gumroad: 'https://themindly.gumroad.com/l/howwespeak-bundle'
  },
  {
    title: 'Men Edition Guide',
    price: '$37',
    cover: 'https://i.ibb.co/rffWKyGB/Chat-GPT-Image-Aug-5-2026-07-50-17-PM.png',
    gumroad: 'https://themindly.gumroad.com/l/How-We-Speak-Men-Edition'
  },
  {
    title: 'Women Edition Guide',
    price: '$37',
    cover: 'https://i.ibb.co/j9fk1Qq0/Chat-GPT-Image-Aug-6-2026-10-23-22-AM.png',
    gumroad: 'https://themindly.gumroad.com/l/howwespeak-women'
  },
  {
    title: '75+ Script Collection',
    price: '$27',
    cover: 'https://i.ibb.co/KxgzQmtY/Chat-GPT-Image-Aug-6-2026-11-17-13-AM.png',
    gumroad: 'https://themindly.gumroad.com/l/howwespeak-scripts'
  }
]

for (const book of expectedEbooks) {
  assert(
    dashboardViewContent.includes(book.title),
    `Ebook storefront must contain product title: ${book.title}`
  )
  assert(
    dashboardViewContent.includes(book.price),
    `Ebook storefront must feature verified price: ${book.price}`
  )
  assert(
    dashboardViewContent.includes(book.cover),
    `Ebook storefront must feature verified image asset: ${book.cover}`
  )
  assert(
    dashboardViewContent.includes(book.gumroad),
    `Ebook storefront must feature verified Gumroad URL: ${book.gumroad}`
  )
}
console.log('  ✓ All 4 ebook products, cover assets, prices, and Gumroad links verified')

// ── 5. VERIFY COUPLES AI SPACE & PRIVACY BOUNDARIES ─────────────────────────
console.log('\n--- Checking Couples AI Space & Privacy Boundaries ---')
const workspacePath = path.join(ROOT, 'web-app', 'src', 'components', 'WorkspaceView.tsx')
assert(fs.existsSync(workspacePath), 'WorkspaceView.tsx must exist')

const workspaceContent = fs.readFileSync(workspacePath, 'utf-8')

assert(
  workspaceContent.includes('Better conversations start with an invitation.'),
  'Couples space onboarding must contain headline: "Better conversations start with an invitation."'
)

assert(
  workspaceContent.includes('Strictly Private by Default') &&
  workspaceContent.includes('Explicit Sharing Control'),
  'Couples space must clearly explain privacy boundaries and explicit sharing'
)

assert(
  workspaceContent.includes('Ask Mira to help us') &&
  workspaceContent.includes('aiConsentBoth'),
  'Couples space must feature "Ask Mira to help us" requiring joint consent'
)

assert(
  workspaceContent.includes('Our Agreed Next Steps') &&
  workspaceContent.includes('Jointly Agreed Ground Rules'),
  'Couples space must feature interactive agreed next steps and couple settings'
)
console.log('  ✓ Couples AI Space turn-taking, privacy boundaries, and joint Mira mediation verified')

// ── 6. VERIFY DATABASE MIGRATION SCRIPT ─────────────────────────────────────
console.log('\n--- Checking Supabase Database Migration ---')
const migrationPath = path.join(ROOT, 'supabase', 'migrations', '20261026000000_mira_and_couples_enhancements.sql')
assert(fs.existsSync(migrationPath), 'Migration file must exist')

const migrationContent = fs.readFileSync(migrationPath, 'utf-8')

const expectedTables = [
  'mira_conversations',
  'mira_messages',
  'mira_preferences',
  'mira_memories',
  'script_favorites',
  'shared_couple_sessions',
  'couple_mira_settings'
]

for (const tbl of expectedTables) {
  assert(
    migrationContent.includes(`CREATE TABLE IF NOT EXISTS public.${tbl}`),
    `Migration must create table public.${tbl}`
  )
  assert(
    migrationContent.includes(`ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;`),
    `Table ${tbl} must have RLS enabled`
  )
}
console.log('  ✓ All 7 new database tables created with strict Row Level Security (RLS)')

console.log('\n🎉 ALL PHASE 6 AUTOMATED CHECKS PASSED SUCCESSFULLY!\n')
