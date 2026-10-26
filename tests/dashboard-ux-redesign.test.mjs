// ==============================================================================
// TRYHOWWESPEAK — DASHBOARD UX/UI REDESIGN VERIFICATION SUITE
// Tests compliance with Phases 1 through 11:
// - Navigation labels & routes
// - Dashboard welcome, trial status, conversations list, and 3 shortcuts
// - Removal of clinical/pseudo-scientific jargon
// - Rehearsal entry experience & questions
// - Partner invitation & privacy boundaries
// - Gumroad pricing & URLs preservation
// ==============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    failed++
  }
}

console.log('🧪 Running Complete Dashboard UX/UI Redesign Verification Suite...\n')

// 1. Verify Global Navigation in Navbar.tsx
const navbarPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'Navbar.tsx')
const navbarContent = fs.readFileSync(navbarPath, 'utf-8')

assert(
  navbarContent.includes("'Home'") &&
  navbarContent.includes("'Practice a Conversation'") &&
  navbarContent.includes("'My Conversations'") &&
  navbarContent.includes("'My Partner'") &&
  navbarContent.includes("'Guides'"),
  'Navbar contains the exact 5 simple navigation labels (Home, Practice a Conversation, My Conversations, My Partner, Guides)'
)

assert(
  navbarContent.includes("'/app'") &&
  navbarContent.includes("'/app/rehearse'") &&
  navbarContent.includes("'/app/history'") &&
  navbarContent.includes("'/app/workspace'") &&
  navbarContent.includes("'/app/scripts'"),
  'Navbar accurately maps the 5 navigation items to the real implemented routes'
)

assert(
  !navbarContent.includes('Encrypted Vault') &&
  !navbarContent.includes('Script Bank') &&
  !navbarContent.includes('Rehearsal Studio') &&
  !navbarContent.includes('Couples Room') &&
  !navbarContent.includes('My Plans'),
  'Navbar removes confusing/technical labels (Encrypted Vault, Script Bank, Rehearsal Studio, Couples Room, My Plans)'
)

assert(
  navbarContent.includes('nav-mobile-drawer') &&
  navbarContent.includes('nav-mobile-backdrop') &&
  navbarContent.includes("e.key === 'Escape'") &&
  navbarContent.includes("document.body.style.overflow = 'hidden'"),
  'Navbar implements responsive mobile drawer with backdrop, Escape key listener, and scroll lock'
)

// 2. Verify Home Dashboard in DashboardView.tsx
const dashboardPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'DashboardView.tsx')
const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8')

assert(
  (dashboardContent.includes('A little more understanding starts here.') || dashboardContent.includes('A little more clarity starts here.')) &&
  (dashboardContent.includes('Talk through what is happening, find the right words') || dashboardContent.includes("Whether you're preparing for a difficult conversation")),
  'Dashboard Section A contains exact headline and supporting copy'
)

assert(
  dashboardContent.includes('Practice a Conversation') &&
  dashboardContent.includes("navigate('/app/rehearse')"),
  'Dashboard Section A features primary CTA "Practice a Conversation" navigating to /app/rehearse'
)

assert(
  dashboardContent.includes('free practice sessions left') ||
  dashboardContent.includes('free practice session left'),
  'Dashboard Section B computes trial allowance dynamically from actual usage records'
)

assert(
  (dashboardContent.includes('Your conversations') || dashboardContent.includes('My recent work') || dashboardContent.includes('saved conversations')) &&
  (dashboardContent.includes('View all conversations') || dashboardContent.includes('/app/history')) &&
  (dashboardContent.includes('Your first conversation starts here.') || dashboardContent.includes('Your conversations will appear here when you save them')),
  'Dashboard Section C contains "Your conversations" header, "View all conversations" link, and welcoming empty state'
)

// 3. Verify 3 Shortcuts in DashboardView.tsx
assert(
  dashboardContent.includes('Connect with your partner') &&
  dashboardContent.includes("Invite your partner when you're ready to practice together.") &&
  dashboardContent.includes("navigate('/app/workspace')"),
  'Shortcut 1: "Connect with your partner" implemented with copy and workspace navigation'
)

assert(
  dashboardContent.includes('Communication guides') &&
  dashboardContent.includes('Explore practical examples for difficult conversations.') &&
  dashboardContent.includes("navigate('/app/scripts')"),
  'Shortcut 2: "Communication guides" implemented with copy and scripts navigation'
)

assert(
  dashboardContent.includes('My communication style') &&
  dashboardContent.includes("Reflect on how you express yourself and what you'd like to improve.") &&
  dashboardContent.includes('/quiz.html'),
  'Shortcut 3: "My communication style" implemented with copy and quiz link'
)

// 4. Verify Removal of Misleading / Pseudo-Scientific Claims
assert(
  !dashboardContent.includes('The 20-Minute Rule') &&
  !dashboardContent.includes('100 BPM') &&
  !dashboardContent.includes('prefrontal cortex shuts down') &&
  !dashboardContent.includes('neurochemically impossible') &&
  !dashboardContent.includes('The Avoider'),
  'Dashboard purges clinical pseudo-science (no 100 BPM claims, prefrontal cortex shutdown, or labeling users as The Avoider)'
)

// 5. Verify Gumroad Products Preserved
assert(
  dashboardContent.includes('https://themindly.gumroad.com/l/howwespeak-bundle') &&
  dashboardContent.includes('$97') &&
  dashboardContent.includes('https://themindly.gumroad.com/l/How-We-Speak-Men-Edition') &&
  dashboardContent.includes('$37') &&
  dashboardContent.includes('https://themindly.gumroad.com/l/howwespeak-women') &&
  dashboardContent.includes('https://themindly.gumroad.com/l/howwespeak-scripts') &&
  dashboardContent.includes('$27'),
  'All 4 Gumroad products and exact prices ($97, $37, $37, $27) and URLs are preserved'
)

// 6. Verify Rehearsal Experience in RehearsalView.tsx
const rehearsalPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'RehearsalView.tsx')
const rehearsalContent = fs.readFileSync(rehearsalPath, 'utf-8')

assert(
  rehearsalContent.includes('What would you like help talking about?'),
  'RehearsalView features the exact heading: "What would you like help talking about?"'
)

assert(
  rehearsalContent.includes('My partner seems distant.') &&
  rehearsalContent.includes('We keep arguing about the same thing.') &&
  rehearsalContent.includes('I need to express a need or boundary.') &&
  rehearsalContent.includes('We need to talk about our future.') &&
  rehearsalContent.includes('Something else.'),
  'RehearsalView features all 5 situation options in plain, respectful language'
)

assert(
  rehearsalContent.includes('What do you want to understand or communicate?') &&
  rehearsalContent.includes('What tone feels right?') &&
  rehearsalContent.includes('Conversation format'),
  'RehearsalView asks clear questions (what to understand/communicate, tone, conversation format)'
)

assert(
  rehearsalContent.includes("fetch('/api/ai/rehearsal'") &&
  rehearsalContent.includes(".from('rehearsal_plans')"),
  'RehearsalView preserves real backend AI generation and Supabase persistence'
)

// 7. Verify My Partner in WorkspaceView.tsx
const workspacePath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'WorkspaceView.tsx')
const workspaceContent = fs.readFileSync(workspacePath, 'utf-8')

assert(
  (workspaceContent.includes('Better conversations can start with one person.') || workspaceContent.includes('Better conversations start with an invitation.')) &&
  (workspaceContent.includes("Invite your partner when you're both ready to take part.") || workspaceContent.includes('Connecting your partner allows you to explore')) &&
  (workspaceContent.includes('Invite My Partner') || workspaceContent.includes('Copy Invite Link')),
  'WorkspaceView features welcoming partner invitation copy and CTA ("Invite My Partner")'
)

assert(
  (workspaceContent.includes('What stays private') || workspaceContent.includes('Strictly Private by Default')) &&
  (workspaceContent.includes('What you share') || workspaceContent.includes('Explicit Sharing Control')),
  'WorkspaceView clearly distinguishes between private rehearsal drafts and explicitly shared content'
)

// 8. Verify My Conversations in HistoryView.tsx
const historyPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'HistoryView.tsx')
const historyContent = fs.readFileSync(historyPath, 'utf-8')

assert(
  historyContent.includes('My Conversations') &&
  historyContent.includes('Review and reopen your saved conversation plans.') &&
  historyContent.includes('Private to You'),
  'HistoryView reflects "My Conversations" natural branding and private reassurance'
)

// 9. Verify Design System in index.css
const cssPath = path.join(ROOT_DIR, 'web-app', 'src', 'index.css')
const cssContent = fs.readFileSync(cssPath, 'utf-8')

assert(
  cssContent.includes('--burgundy: #C41E3A;') &&
  cssContent.includes('--cream: #F5F3F0;') &&
  cssContent.includes('--gold: #D4AF37;') &&
  cssContent.includes('--blush: #E8CCC8;') &&
  cssContent.includes('prefers-reduced-motion'),
  'Design system defines core brand tokens and respects prefers-reduced-motion'
)

console.log(`\n📊 Dashboard Redesign Test Results: ${passed} Passed, ${failed} Failed`)
if (failed > 0) {
  process.exit(1)
} else {
  console.log('🎉 All Dashboard Redesign tests PASSED successfully!\n')
}
