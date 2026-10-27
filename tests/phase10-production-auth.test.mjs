// ==============================================================================
// HOW WE SPEAK — PHASE 10: PRODUCTION AUTHENTICATION & ZERO-SANDBOX VERIFICATION
// Tests:
// 1. Supabase client initialized with real TryHowWeSpeak production credentials
// 2. Total elimination of Sandbox Mode banners and mock login flows
// 3. Google OAuth redirection configuration and URL generation
// 4. Clear error handling for invalid credentials and unconfirmed accounts
// 5. Zero fake sandbox authentication persistence in localStorage
// ==============================================================================

import assert from 'node:assert/strict';
import { it, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

describe('Phase 10: Production Auth & Zero-Sandbox Verification', () => {
  it('1. web-app/src/lib/supabase.ts uses real project yzodegkrcbjevxurhanc as default configuration', () => {
    const supabaseFilePath = path.join(ROOT, 'web-app/src/lib/supabase.ts');
    assert.ok(fs.existsSync(supabaseFilePath), 'supabase.ts must exist');

    const content = fs.readFileSync(supabaseFilePath, 'utf8');
    assert.ok(content.includes('https://yzodegkrcbjevxurhanc.supabase.co'), 'Must configure real project URL');
    assert.ok(content.includes('sb_publishable_us6bwKSn7m3czRxMku--uw_Gli6d9oq'), 'Must configure real anon key');
    assert.ok(!content.includes("https://placeholder.supabase.co"), 'Must not default to placeholder.supabase.co');
    assert.ok(!content.includes("'placeholder-anon-key'"), 'Must not default to placeholder-anon-key');
  });

  it('2. AuthModal.tsx completely purges Sandbox Mode banner and mock notifications', () => {
    const authModalPath = path.join(ROOT, 'web-app/src/components/AuthModal.tsx');
    const content = fs.readFileSync(authModalPath, 'utf8');

    assert.ok(!content.includes('Sandbox Mode:'), 'Sandbox Mode banner must be removed');
    assert.ok(!content.includes('Enter any email/password to explore workspace features'), 'Mock helper text must be removed');
    assert.ok(!content.includes('Magic link simulated!'), 'Simulated magic link must be removed');
  });

  it('3. AuthModal maps invalid credentials and unconfirmed email to user-friendly messages', () => {
    const authModalPath = path.join(ROOT, 'web-app/src/components/AuthModal.tsx');
    const content = fs.readFileSync(authModalPath, 'utf8');

    assert.ok(content.includes('Invalid email or password'), 'Must provide clear credential error');
    assert.ok(content.includes('email not confirmed'), 'Must provide unconfirmed email guidance');
  });

  it('4. Google OAuth handler generates real redirect and handles errors without mock fallbacks', () => {
    const authModalPath = path.join(ROOT, 'web-app/src/components/AuthModal.tsx');
    const content = fs.readFileSync(authModalPath, 'utf8');

    assert.ok(content.includes('signInWithOAuth(\'google\')'), 'Must invoke Google OAuth');
    assert.ok(content.includes('window.location.href = res.data.url'), 'Must redirect browser to OAuth URL');
  });

  it('5. WorkspaceView.tsx and index.html completely remove hws_sandbox_auth mock storage', () => {
    const workspacePath = path.join(ROOT, 'web-app/src/components/WorkspaceView.tsx');
    const workspaceContent = fs.readFileSync(workspacePath, 'utf8');
    assert.ok(!workspaceContent.includes('sandbox_space_123'), 'Fake space ID must not exist');
    assert.ok(!workspaceContent.includes('hws_sandbox_auth'), 'Fake auth token must not exist in WorkspaceView');

    const indexPath = path.join(ROOT, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(!indexContent.includes('hws_sandbox_auth'), 'Fake auth token must not exist in index.html');
  });

  it('6. Production build bundle does not contain Sandbox Mode banner text', () => {
    const distAssetsDir = path.join(ROOT, 'app/assets');
    const files = fs.readdirSync(distAssetsDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    assert.ok(jsFiles.length > 0, 'Production bundle must exist');

    for (const jsFile of jsFiles) {
      const bundleCode = fs.readFileSync(path.join(distAssetsDir, jsFile), 'utf8');
      assert.ok(!bundleCode.includes('Sandbox Mode: Enter any email/password'), `Bundle ${jsFile} must not contain sandbox mode`);
    }
  });
});
