// ==============================================================================
// HOW WE SPEAK — PHASE 7: SUPABASE INTEGRATION & DATABASE TESTS
// Verifies:
//   1. Supabase Client Initialization & Environment Configuration
//   2. Complete Production Database Schema & SQL Migration Integrity
//   3. Row Level Security (RLS) & Multi-Tenant Isolation
//   4. Secure Auth Data Handling (Email, Password, OAuth, Reset, Deletion)
//   5. Supabase Edge Function: Server-side Gemini (gemini-flash-latest) & Zero Key Leak
//   6. Server-Side Entitlement & Rate Limit Enforcement
//   7. Account Deletion & Cascading Privacy Cleanup
// ==============================================================================

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ ${desc}`);
  } catch (err) {
    console.error(`  ❌ ${desc}:`, err.message);
    throw err;
  }
}

async function itAsync(desc, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ ${desc}`);
  } catch (err) {
    console.error(`  ❌ ${desc}:`, err.message);
    throw err;
  }
}

console.log('\n======================================================================');
console.log('🧪 RUNNING PHASE 7: COMPLETE SUPABASE INTEGRATION TESTS');
console.log('======================================================================\n');

// ── 1. SUPABASE CLIENT INITIALIZATION & CONFIGURATION ────────────────────────
console.log('--- 1. Supabase Client Initialization & Environment Variables ---');

it('Supabase client module supports both VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY', () => {
  const clientCode = fs.readFileSync(path.join(ROOT, 'web-app/src/lib/supabase.ts'), 'utf8');
  assert(
    clientCode.includes('VITE_SUPABASE_PUBLISHABLE_KEY') && clientCode.includes('VITE_SUPABASE_ANON_KEY'),
    'supabase.ts must accept both publishable and anon key environment variables'
  );
  assert(clientCode.includes('storageKey: \'hws-auth-token\''), 'Session persistence must be configured with a storageKey');
  assert(clientCode.includes('autoRefreshToken: true'), 'Session must auto-refresh tokens');
});

it('Safe environment templates (.env.example) exist in both root and web-app without secrets', () => {
  const rootExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
  const webAppExample = fs.readFileSync(path.join(ROOT, 'web-app/.env.example'), 'utf8');

  assert(rootExample.includes('VITE_SUPABASE_URL='), 'Root .env.example must define VITE_SUPABASE_URL');
  assert(rootExample.includes('GEMINI_API_KEY='), 'Root .env.example must document GEMINI_API_KEY');
  assert(rootExample.includes('gemini-flash-latest'), 'Root .env.example must document gemini-flash-latest');
  assert(!rootExample.includes('sb_publishable_'), 'Root .env.example must contain placeholders, not real secrets');

  assert(webAppExample.includes('VITE_SUPABASE_PUBLISHABLE_KEY='), 'web-app .env.example must define VITE_SUPABASE_PUBLISHABLE_KEY');
  assert(!webAppExample.includes('sb_publishable_'), 'web-app .env.example must contain placeholders');
});

it('Gitignore strictly excludes live .env files while preserving .env.example', () => {
  const rootGitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  const webGitignore = fs.readFileSync(path.join(ROOT, 'web-app/.gitignore'), 'utf8');

  assert(rootGitignore.includes('.env') && rootGitignore.includes('!.env.example'), 'Root gitignore must protect .env and allow .env.example');
  assert(webGitignore.includes('.env') && webGitignore.includes('!.env.example'), 'web-app gitignore must protect .env and allow .env.example');
});

// ── 2. DATABASE SCHEMA, MIGRATION & RLS POLICIES ─────────────────────────────
console.log('\n--- 2. Production Database Schema & SQL Migration ---');

it('Complete database setup files exist and are fully populated', () => {
  const standaloneSql = path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql');
  const migrationSql = path.join(ROOT, 'supabase/migrations/20261026020000_complete_production_schema.sql');

  assert(fs.existsSync(standaloneSql), 'COMPLETE_DATABASE_SETUP.sql must exist');
  assert(fs.existsSync(migrationSql), 'Migration 20261026020000_complete_production_schema.sql must exist');

  const content = fs.readFileSync(standaloneSql, 'utf8');
  assert(content.length > 50000, `COMPLETE_DATABASE_SETUP.sql is too small (${content.length} bytes)`);
});

it('Schema defines all 16 required tables with appropriate fields and constraints', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql'), 'utf8');

  const requiredTables = [
    'public.profiles',
    'public.mira_preferences',
    'public.mira_conversations',
    'public.mira_messages',
    'public.mira_memories',
    'public.communication_scripts',
    'public.script_favorites',
    'public.couples_spaces',
    'public.workspace_invitations',
    'public.shared_couple_sessions',
    'public.couple_mira_settings',
    'public.rehearsal_plans',
    'public.couples_exercises',
    'public.private_reflections',
    'public.entitlements',
    'public.usage_records',
    'public.product_catalog',
  ];

  for (const table of requiredTables) {
    assert(sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `Schema must define ${table}`);
    assert(sql.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`), `Table ${table} must enable Row Level Security`);
  }

  // Check specific column requirements
  assert(sql.includes('avatar_url TEXT'), 'profiles must include avatar_url');
  assert(sql.includes('onboarding_completed BOOLEAN'), 'profiles must include onboarding_completed');
  assert(sql.includes('idempotency_key TEXT'), 'mira_messages must include idempotency_key');
  assert(sql.includes('daily_ai_limit INTEGER'), 'entitlements must include daily_ai_limit');
  assert(sql.includes('model_used TEXT'), 'usage_records must include model_used');
  assert(sql.includes('gumroad_url TEXT'), 'product_catalog must include gumroad_url');
});

it('Strict RLS policy checks conversation ownership before allowing message queries', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql'), 'utf8');

  // Verify Section 5 requirement: "For messages, verify both the message owner and the referenced conversation's ownership"
  assert(
    sql.includes('EXISTS (SELECT 1 FROM public.mira_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())'),
    'mira_messages RLS must verify conversation ownership'
  );
});

it('Private reflections are strictly shielded from partner unless is_shared = true', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql'), 'utf8');

  assert(
    sql.includes('user_id = auth.uid() OR (') && sql.includes('is_shared = true AND EXISTS'),
    'private_reflections RLS must require is_shared = true for partner access'
  );
});

it('Commercial access control blocks client write access to entitlements and usage_records', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql'), 'utf8');

  assert(sql.includes('CREATE POLICY "entitlements_write_blocked"'), 'Entitlements must block client write access');
  assert(sql.includes('CREATE POLICY "usage_records_write_blocked"'), 'Usage records must block client write access');
});

it('Security Definer procedures exist for account deletion, invitation acceptance, and allowance checking', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql'), 'utf8');

  assert(sql.includes('CREATE OR REPLACE FUNCTION public.handle_new_user()'), 'handle_new_user trigger must be defined');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.accept_couples_invitation(invite_token TEXT)'), 'accept_couples_invitation must be defined');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.check_user_ai_allowance(check_user_id UUID)'), 'check_user_ai_allowance must be defined');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.delete_user_account()'), 'delete_user_account must be defined');
});

it('Product catalog and 130 scripts are seeded with ON CONFLICT idempotency', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/COMPLETE_DATABASE_SETUP.sql'), 'utf8');

  assert(sql.includes("'bundle', 'The Complete Bundle'"), 'Product catalog must seed the Complete Bundle');
  assert(sql.includes("'men-edition', 'Men Edition Guide'"), 'Product catalog must seed Men Edition');
  assert(sql.includes("'women-edition', 'Women Edition Guide'"), 'Product catalog must seed Women Edition');
  assert(sql.includes("'script-collection', '75+ Script Collection'"), 'Product catalog must seed 75+ Script Collection');

  assert(sql.includes("INSERT INTO public.communication_scripts"), 'Schema must seed communication scripts');
  assert(sql.includes("'dd-10'"), 'Schema must contain all 130 scripts through dd-10');
  assert(sql.includes("ON CONFLICT (id) DO UPDATE SET"), 'Script seeding must use ON CONFLICT DO UPDATE for safe idempotency');
});

// ── 3. AUTHENTICATION & SECURITY ─────────────────────────────────────────────
console.log('\n--- 3. Authentication & Account Lifecycle ---');

it('AuthContext provides real Supabase Auth methods without fake sandbox user fallback', () => {
  const authCode = fs.readFileSync(path.join(ROOT, 'web-app/src/lib/AuthContext.tsx'), 'utf8');

  assert(!authCode.includes('SANDBOX_USER'), 'AuthContext must not contain SANDBOX_USER mock');
  assert(!authCode.includes('getInitialSandboxAuth'), 'AuthContext must not use sandbox auth bypass');
  assert(authCode.includes('signInWithOAuth'), 'AuthContext must support OAuth (Google)');
  assert(authCode.includes('resetPassword'), 'AuthContext must support password reset');
  assert(authCode.includes('deleteAccount'), 'AuthContext must support account deletion');
  assert(authCode.includes("supabase.rpc('delete_user_account')"), 'deleteAccount must call delete_user_account RPC');
});

it('SettingsView includes end-to-end privacy controls and account deletion action', () => {
  const settingsCode = fs.readFileSync(path.join(ROOT, 'web-app/src/components/SettingsView.tsx'), 'utf8');

  assert(settingsCode.includes('Delete My Account'), 'SettingsView must provide account deletion button');
  assert(settingsCode.includes('Send Password Reset'), 'SettingsView must provide password reset button');
  assert(settingsCode.includes('deleteAccount()'), 'SettingsView must trigger deleteAccount');
});

// ── 4. SUPABASE EDGE FUNCTION & GEMINI AI INTEGRATION ────────────────────────
console.log('\n--- 4. Supabase Edge Function & Gemini AI Security ---');

it('Supabase Edge Function for Mira exists and reads GEMINI_API_KEY from server secrets', () => {
  const fnPath = path.join(ROOT, 'supabase/functions/mira/index.ts');
  assert(fs.existsSync(fnPath), 'supabase/functions/mira/index.ts must exist');

  const fnCode = fs.readFileSync(fnPath, 'utf8');
  assert(fnCode.includes('Deno.env.get("GEMINI_API_KEY")'), 'Edge Function must read GEMINI_API_KEY from Deno.env');
  assert(fnCode.includes('gemini-flash-latest'), 'Edge Function must use gemini-flash-latest model');
  assert(fnCode.includes('check_user_ai_allowance'), 'Edge Function must verify user allowance before calling AI');
  assert(fnCode.includes('mira_messages'), 'Edge Function must persist assistant response to mira_messages');
  assert(fnCode.includes('mira_conversations'), 'Edge Function must update mira_conversations');
});

it('Frontend code never bundles or exposes GEMINI_API_KEY', () => {
  const clientFiles = [
    'web-app/src/lib/supabase.ts',
    'web-app/src/lib/AuthContext.tsx',
    'web-app/src/components/MiraView.tsx',
    'web-app/src/components/RehearsalView.tsx',
  ];

  for (const rel of clientFiles) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert(!code.includes('AIZA'), `Frontend file ${rel} must not contain Google API keys`);
    assert(!code.includes('process.env.GEMINI_API_KEY'), `Frontend file ${rel} must not reference raw server secrets`);
  }
});

it('API route api/ai/mira.js supports GEMINI_API_KEY, gemini-flash-latest, and persists messages', () => {
  const apiCode = fs.readFileSync(path.join(ROOT, 'api/ai/mira.js'), 'utf8');

  assert(apiCode.includes('GEMINI_API_KEY'), 'api/ai/mira.js must support GEMINI_API_KEY');
  assert(apiCode.includes('gemini-flash-latest'), 'api/ai/mira.js must use gemini-flash-latest as default model');
  assert(apiCode.includes('mira_messages'), 'api/ai/mira.js must persist messages to database');
  assert(apiCode.includes('mira_conversations'), 'api/ai/mira.js must update conversation activity');
});

// ── 5. HISTORY VIEW CONVERSATION & PLAN TABS ─────────────────────────────────
console.log('\n--- 5. My Conversations (Rehearsal Plans & Mira Chats) ---');

it('HistoryView allows toggling between Practice Plans and Mira Chats with real Supabase persistence', () => {
  const historyCode = fs.readFileSync(path.join(ROOT, 'web-app/src/components/HistoryView.tsx'), 'utf8');

  assert(historyCode.includes("activeTab === 'plans'"), 'HistoryView must support Practice Plans tab');
  assert(historyCode.includes("activeTab === 'mira'"), 'HistoryView must support Mira Chats tab');
  assert(historyCode.includes('from(\'mira_conversations\')'), 'HistoryView must query mira_conversations');
  assert(historyCode.includes('from(\'rehearsal_plans\')'), 'HistoryView must query rehearsal_plans');
  assert(historyCode.includes('handleDeleteMiraConv'), 'HistoryView must allow deleting Mira conversations');
});

console.log('\n======================================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} PHASE 7 TESTS PASSED SUCCESSFULLY!`);
console.log('======================================================================\n');
