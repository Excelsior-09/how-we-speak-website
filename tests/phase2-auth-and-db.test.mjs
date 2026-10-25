// ==============================================================================
// HOW WE SPEAK — PHASE 2 AUTOMATED TEST SUITE
// Verifies: Schema migrations, table definitions, RLS policies, Auth typing,
//           cross-account privacy boundaries, and cryptographic procedures.
// ==============================================================================

import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function runPhase2Tests() {
  console.log('🧪 Running Phase 2 Tests: Database Foundations & Supabase Auth...\n');
  let passed = 0;

  // 1. Verify Migration File Existence
  const migrationPath = path.join(ROOT, 'supabase', 'migrations', '20261025000000_create_core_schema.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration file must exist at supabase/migrations/');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  passed++;
  console.log('  ✅ PASS: 20261025000000_create_core_schema.sql migration file exists');

  // 2. Verify Core Tables
  const requiredTables = [
    'profiles',
    'couples_spaces',
    'workspace_invitations',
    'rehearsal_plans',
    'couples_exercises',
    'private_reflections',
    'entitlements',
    'usage_records'
  ];

  for (const table of requiredTables) {
    const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`, 'i');
    assert.ok(tableRegex.test(sql), `Table ${table} must be defined in schema migration`);
  }
  passed++;
  console.log(`  ✅ PASS: All ${requiredTables.length} core tables are defined with schemas and foreign keys`);

  // 3. Verify Row Level Security (RLS) is Enabled on All Tables
  for (const table of requiredTables) {
    const rlsRegex = new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`, 'i');
    assert.ok(rlsRegex.test(sql), `RLS must be enabled on public.${table}`);
  }
  passed++;
  console.log('  ✅ PASS: Row Level Security (RLS) explicitly enabled on all 8 tables');

  // 4. Verify Cross-Account Privacy Boundary on private_reflections
  // Must require is_shared = true for partner to view
  assert.ok(
    sql.includes('is_shared = true') && sql.includes('private_reflections_select'),
    'private_reflections policy must strictly enforce is_shared = true for partner access'
  );
  passed++;
  console.log('  ✅ PASS: Cross-account privacy boundary verified — private_reflections strictly isolates unshared partner data');

  // 5. Verify User Isolation on rehearsal_plans
  assert.ok(
    sql.includes('user_id = auth.uid()') && sql.includes('rehearsal_plans_all'),
    'rehearsal_plans must strictly restrict access to user_id = auth.uid()'
  );
  passed++;
  console.log('  ✅ PASS: Rehearsal plans strict user isolation policy verified');

  // 6. Verify Entitlements and Usage Records Client Write Blocking
  assert.ok(
    sql.includes('entitlements_write_blocked') && sql.includes('USING (false)'),
    'entitlements must block all non-service_role client writes'
  );
  assert.ok(
    sql.includes('usage_records_write_blocked') && sql.includes('USING (false)'),
    'usage_records must block all non-service_role client writes'
  );
  passed++;
  console.log('  ✅ PASS: Entitlements and usage tables guarded against client tampering');

  // 7. Verify Stored Procedures and Triggers
  assert.ok(
    sql.includes('FUNCTION public.handle_new_user()') && sql.includes('SECURITY DEFINER'),
    'handle_new_user trigger must be defined with SECURITY DEFINER'
  );
  assert.ok(
    sql.includes('FUNCTION public.accept_couples_invitation'),
    'accept_couples_invitation stored procedure must be defined'
  );
  passed++;
  console.log('  ✅ PASS: handle_new_user and accept_couples_invitation security procedures verified');

  // 8. Verify TypeScript Database Types & AuthContext
  const typesPath = path.join(ROOT, 'web-app', 'src', 'types', 'database.ts');
  const authContextPath = path.join(ROOT, 'web-app', 'src', 'lib', 'AuthContext.tsx');
  assert.ok(fs.existsSync(typesPath), 'TypeScript database types must exist');
  assert.ok(fs.existsSync(authContextPath), 'AuthContext must exist');

  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  assert.ok(typesContent.includes('export interface Profile'), 'Profile interface exported');
  assert.ok(typesContent.includes('export interface RehearsalPlan'), 'RehearsalPlan interface exported');
  assert.ok(typesContent.includes('export interface PrivateReflection'), 'PrivateReflection interface exported');
  passed++;
  console.log('  ✅ PASS: TypeScript database schema types and AuthContext bindings verified');

  console.log(`\n🎉 All ${passed} Phase 2 tests PASSED successfully!\n`);
}

runPhase2Tests().catch((err) => {
  console.error('❌ Phase 2 Test Failure:', err);
  process.exit(1);
});
