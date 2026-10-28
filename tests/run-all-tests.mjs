// ==============================================================================
// HOW WE SPEAK — UNIFIED TEST RUNNER
// Runs all automated test suites across all phases and aggregates real test results.
// ==============================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const testSuites = [
  'test-quiz-submit.test.mjs',
  'tests/phase2-auth-and-db.test.mjs',
  'tests/phase3-individual-rehearsal.test.mjs',
  'tests/phase4-couples-workspace.test.mjs',
  'tests/phase5-gumroad-and-entitlements.test.mjs',
  'tests/homepage-ai-enhancement.test.mjs',
  'tests/header-and-hero-fix.test.mjs',
  'tests/dashboard-ux-redesign.test.mjs',
  'tests/phase6-mira-and-scripts.test.mjs',
  'tests/phase7-supabase-integration.test.mjs',
  'tests/phase8-auth-security-and-mfa.test.mjs',
  'tests/phase9-gemini-integration.test.mjs',
  'tests/phase10-production-auth.test.mjs',
  'tests/phase11-auth-mfa-and-logout.test.mjs',
  'tests/phase12-password-reset-and-mira-fix.test.mjs',
  'tests/phase13-recaptcha-security.test.mjs',
];

async function runCommand(file) {
  return new Promise((resolve) => {
    const fullPath = path.join(ROOT, file);
    console.log(`\n======================================================================`);
    console.log(`▶ Executing: ${file}`);
    console.log(`======================================================================`);

    const proc = spawn('node', [fullPath], { stdio: 'inherit', cwd: ROOT });
    proc.on('close', (code) => {
      resolve({ file, code });
    });
  });
}

async function runAll() {
  console.log('🚀 Starting How We Speak Full Verification Test Suite...\n');
  const results = [];

  for (const suite of testSuites) {
    const res = await runCommand(suite);
    results.push(res);
    if (res.code !== 0) {
      console.error(`\n❌ Test suite failed: ${suite}`);
      process.exit(res.code);
    }
  }

  console.log('\n======================================================================');
  console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('======================================================================');
  results.forEach((r) => {
    console.log(`  ✅ ${r.file}: Passed (Exit Code 0)`);
  });
  console.log(`\n🎉 All ${results.length} test suites executed with 100% pass rate!\n`);
}

runAll();
