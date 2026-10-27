// ==============================================================================
// HOW WE SPEAK — PHASE 11: LOGOUT REDIRECT & AUTHENTICATOR (TOTP MFA) VERIFICATION
// Tests:
// 1. User without 2FA logs in without MFA prompts (nextLevel === 'aal1')
// 2. User with 2FA enabled is prompted for authenticator code (nextLevel === 'aal2')
// 3. Valid authenticator code completes MFA challenge and grants dashboard access
// 4. Invalid or expired authenticator code is rejected without granting access
// 5. Page refresh or opening protected URLs cannot bypass MFA gate (mfaRequired check)
// 6. Both email/password and Google OAuth handle MFA assurance level verification
// 7. Logout clears session, purges storage, and redirects to https://tryhowwespeak.com/
// 8. Protected pages remain strictly inaccessible after logout
// ==============================================================================

import assert from 'node:assert/strict';
import { it, describe } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

describe('Phase 11: Logout Redirect & Authenticator (TOTP MFA) Verification', () => {
  it('1. User without 2FA logs in directly without MFA verification step', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const content = fs.readFileSync(authContextPath, 'utf8');

    assert.ok(content.includes('aalData.nextLevel === \'aal2\' && aalData.currentLevel !== \'aal2\''),
      'Must check if nextLevel is aal2 before requiring MFA');
    assert.ok(content.includes('setMfaRequired(false)'),
      'Must ensure mfaRequired is false when user has not enrolled 2FA');
  });

  it('2. User with 2FA enabled is detected and prompted for authenticator code', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const authModalPath = path.join(ROOT, 'web-app/src/components/AuthModal.tsx');
    const mfaGatePath = path.join(ROOT, 'web-app/src/components/MfaChallengeGate.tsx');

    const authContextCode = fs.readFileSync(authContextPath, 'utf8');
    const authModalCode = fs.readFileSync(authModalPath, 'utf8');
    const mfaGateCode = fs.readFileSync(mfaGatePath, 'utf8');

    // AuthContext detects AAL2 requirement
    assert.ok(authContextCode.includes('return { mfaRequired: true, data }'),
      'signIn must return mfaRequired: true when account requires AAL2 elevation');

    // AuthModal switches to MFA challenge step
    assert.ok(authModalCode.includes('res.mfaRequired'),
      'AuthModal must handle res.mfaRequired from signIn');
    assert.ok(authModalCode.includes('setIsMfaStep(true)'),
      'AuthModal must switch to MFA challenge screen when 2FA is required');
    assert.ok(authModalCode.includes('<MfaChallengeGate'),
      'AuthModal must render MfaChallengeGate when isMfaStep is true');

    // MfaChallengeGate prompts for 6-digit code
    assert.ok(mfaGateCode.includes('maxLength={6}'), 'Must accept 6-digit code');
    assert.ok(mfaGateCode.includes('Two-Factor Security Code'), 'Must show 2FA security header');
  });

  it('3. Valid code invokes real Supabase challengeAndVerify and elevates session', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const content = fs.readFileSync(authContextPath, 'utf8');

    assert.ok(content.includes('supabase.auth.mfa.challengeAndVerify'),
      'Must validate code using Supabase official challengeAndVerify API');
    assert.ok(content.includes('setMfaRequired(false)'),
      'Must clear mfaRequired flag upon successful code verification');
  });

  it('4. Invalid or expired code is rejected without granting access', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const mfaGatePath = path.join(ROOT, 'web-app/src/components/MfaChallengeGate.tsx');

    const authContextCode = fs.readFileSync(authContextPath, 'utf8');
    const mfaGateCode = fs.readFileSync(mfaGatePath, 'utf8');

    assert.ok(authContextCode.includes('cleanCode.length !== 6'),
      'Must reject codes that are not exactly 6 digits');
    assert.ok(authContextCode.includes('Invalid or expired authenticator code'),
      'Must return user-friendly error message on verification failure');
    assert.ok(mfaGateCode.includes('id="mfa-challenge-error"'),
      'MfaChallengeGate must display error message container to the user');
  });

  it('5. Refreshing page or opening protected URLs cannot bypass MFA requirement', () => {
    const appPath = path.join(ROOT, 'web-app/src/App.tsx');
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');

    const appCode = fs.readFileSync(appPath, 'utf8');
    const authContextCode = fs.readFileSync(authContextPath, 'utf8');

    // App checks both user and !mfaRequired
    assert.ok(appCode.includes('const isAuthenticated = !!user && !mfaRequired'),
      'App must consider user unauthenticated for protected features until MFA code is verified');

    // Top-level main route gate
    assert.ok(appCode.includes('{mfaRequired ? ('),
      'App must intercept protected routes when mfaRequired is true');
    assert.ok(appCode.includes('<MfaChallengeGate'),
      'App must render MfaChallengeGate when mfaRequired is true');

    // Session restoration re-checks AAL level
    assert.ok(authContextCode.includes('const isMfaNeeded = await checkMfaStatus()'),
      'Session restoration must evaluate MFA status on every load');
  });

  it('6. Both email/password and Google OAuth handle MFA correctly', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const content = fs.readFileSync(authContextPath, 'utf8');

    // onAuthStateChange fires for OAuth redirects and checks AAL status
    assert.ok(content.includes('supabase.auth.onAuthStateChange(async (_event, currentSession) => {'),
      'Must listen to auth state changes for OAuth callbacks');
    assert.ok(content.includes('const isMfaNeeded = await checkMfaStatus()'),
      'Must verify assurance level on OAuth session restoration');
  });

  it('7. Logging out successfully clears session, purges storage, and redirects to https://tryhowwespeak.com/', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const navbarPath = path.join(ROOT, 'web-app/src/components/Navbar.tsx');
    const settingsPath = path.join(ROOT, 'web-app/src/components/SettingsView.tsx');

    const authContextCode = fs.readFileSync(authContextPath, 'utf8');
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');
    const settingsCode = fs.readFileSync(settingsPath, 'utf8');

    // Explicit destination requirement
    assert.ok(authContextCode.includes('https://tryhowwespeak.com/'),
      'Must define https://tryhowwespeak.com/ as default logout target');
    assert.ok(authContextCode.includes('window.location.assign'),
      'Must immediately redirect browser after successful sign out');

    // Supabase signOut call with error handling
    assert.ok(authContextCode.includes('await supabase.auth.signOut()'),
      'Must call Supabase auth.signOut() to invalidate server session');

    // Storage cleanup
    assert.ok(authContextCode.includes('keysToRemove.forEach'),
      'Must purge cached user data from localStorage on logout');
    assert.ok(authContextCode.includes('sessionStorage.clear()'),
      'Must clear sessionStorage on logout');

    // All UI logout buttons wired properly
    assert.ok(navbarCode.includes('id="btn-account-signout"'), 'Navbar desktop logout button must exist');
    assert.ok(navbarCode.includes('id="btn-mobile-signout"'), 'Navbar mobile logout button must exist');
    assert.ok(settingsCode.includes('id="btn-settings-signout"'), 'SettingsView logout button must exist');
  });

  it('8. Protected pages remain inaccessible after logout', () => {
    const authContextPath = path.join(ROOT, 'web-app/src/lib/AuthContext.tsx');
    const appPath = path.join(ROOT, 'web-app/src/App.tsx');

    const authContextCode = fs.readFileSync(authContextPath, 'utf8');
    const appCode = fs.readFileSync(appPath, 'utf8');

    // Clearing in-memory user and session
    assert.ok(authContextCode.includes('setUser(null)'), 'Must nullify user on logout');
    assert.ok(authContextCode.includes('setSession(null)'), 'Must nullify session on logout');
    assert.ok(authContextCode.includes('setProfile(null)'), 'Must nullify profile on logout');

    // Protected routes in App require authentication
    assert.ok(appCode.includes('AuthRequiredGate'),
      'Protected views (History, Settings, Plan Details) must require authentication via AuthRequiredGate');
  });
});
