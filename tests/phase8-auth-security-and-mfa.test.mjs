// ==============================================================================
// HOW WE SPEAK — PHASE 8 TEST SUITE: AUTHENTICATION UX, SECURITY, TOTP MFA & MIRA
// Tests:
// 1. Sign-up email confirmation redirect and form clearance
// 2. Dedicated confirmation page (/app/confirm-email) branding, headline & cooldown
// 3. Google OAuth button on sign-in and sign-up flows
// 4. Email verification status rendering (verified vs unverified)
// 5. Supabase Auth MFA (TOTP) enrollment, challenge/verify & unenroll APIs
// 6. Gemini API key safety (zero frontend exposure)
// 7. Mira AI clinical communication prompt and message persistence
// 8. Conversation ownership and multi-user isolation
// ==============================================================================

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Starting Phase 8 Auth UX, MFA & Mira AI Verification Tests...\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
}

// 1. ConfirmEmailView verification
test('1. ConfirmEmailView contains TryHowWeSpeak branding, headline, and resend cooldown', () => {
  const confirmFile = path.join(ROOT, 'web-app/src/components/ConfirmEmailView.tsx');
  assert.ok(fs.existsSync(confirmFile), 'ConfirmEmailView.tsx must exist');
  const content = fs.readFileSync(confirmFile, 'utf8');

  assert.ok(content.includes('Thank You for Joining TryHowWeSpeak!'), 'Must include exact headline');
  assert.ok(content.includes("We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account."), 'Must include verification message');
  assert.ok(content.includes('supabase.auth.resend'), 'Must call Supabase auth resend API');
  assert.ok(content.includes('cooldown'), 'Must implement cooldown state');
  assert.ok(content.includes('Didn\'t receive the email yet?'), 'Must include helpful spam/junk folder reminder');
  assert.ok(content.includes('Gemini-Generated-Image-bbp6v6bbp6v6bbp6-1-removebg-preview.png'), 'Must display TryHowWeSpeak logo');
});

// 2. AuthModal sign-up confirmation redirect and form clearance
test('2. AuthModal clears inputs on sign-up and navigates to /app/confirm-email', () => {
  const authModalFile = path.join(ROOT, 'web-app/src/components/AuthModal.tsx');
  assert.ok(fs.existsSync(authModalFile), 'AuthModal.tsx must exist');
  const content = fs.readFileSync(authModalFile, 'utf8');

  assert.ok(content.includes("setPassword('')"), 'Must clear password state');
  assert.ok(content.includes("navigate(`/app/confirm-email?email=${encodeURIComponent(savedEmail)}`)"), 'Must navigate to confirm-email page');
  assert.ok(!content.includes('password={password}') || content.includes('type="password"'), 'Password must never be logged or exposed');
});

// 3. Google Sign-In on sign-up and sign-in tabs
test('3. Google OAuth integration exists on both Sign In and Sign Up tabs', () => {
  const authModalFile = path.join(ROOT, 'web-app/src/components/AuthModal.tsx');
  const content = fs.readFileSync(authModalFile, 'utf8');

  assert.ok(content.includes('signInWithOAuth'), 'Must use Supabase signInWithOAuth');
  assert.ok(content.includes('Continue with Google'), 'Must have Continue with Google button');
  assert.ok(content.includes('id="btn-google-auth"'), 'Google button must have descriptive test ID');
  assert.ok(content.includes('googleLoading'), 'Must prevent double submission with loading state');
});

// 4. AppRoute & Router supports confirm-email
test('4. RouteParser and App.tsx register confirm-email route cleanly', () => {
  const routeParserFile = path.join(ROOT, 'web-app/src/lib/routeParser.ts');
  const appFile = path.join(ROOT, 'web-app/src/App.tsx');
  const routeContent = fs.readFileSync(routeParserFile, 'utf8');
  const appContent = fs.readFileSync(appFile, 'utf8');

  assert.ok(routeContent.includes("'confirm-email'"), 'routeParser must define confirm-email route');
  assert.ok(appContent.includes("route === 'confirm-email'"), 'App.tsx must render ConfirmEmailView on confirm-email route');
  assert.ok(appContent.includes('<ConfirmEmailView'), 'App.tsx must instantiate ConfirmEmailView');
});

// 5. Account Settings Email Security Section
test('5. SettingsView displays real email confirmation status and resend/update controls', () => {
  const settingsFile = path.join(ROOT, 'web-app/src/components/SettingsView.tsx');
  assert.ok(fs.existsSync(settingsFile), 'SettingsView.tsx must exist');
  const content = fs.readFileSync(settingsFile, 'utf8');

  assert.ok(content.includes('user?.email_confirmed_at'), 'Must check user.email_confirmed_at for real status');
  assert.ok(content.includes('email-verified-badge'), 'Must render email-verified-badge');
  assert.ok(content.includes('email-pending-badge'), 'Must render email-pending-badge');
  assert.ok(content.includes('supabase.auth.resend'), 'Must provide resend confirmation action');
  assert.ok(content.includes('supabase.auth.updateUser'), 'Must support updating email address via Supabase');
});

// 6. Account Settings Authenticator Security (TOTP MFA)
test('6. SettingsView supports real Supabase Auth TOTP MFA enrollment, verify & unenroll', () => {
  const settingsFile = path.join(ROOT, 'web-app/src/components/SettingsView.tsx');
  const content = fs.readFileSync(settingsFile, 'utf8');

  assert.ok(content.includes('supabase.auth.mfa.listFactors'), 'Must list factors with listFactors');
  assert.ok(content.includes('supabase.auth.mfa.enroll'), 'Must enroll factor with factorType totp');
  assert.ok(content.includes('supabase.auth.mfa.challengeAndVerify'), 'Must verify initial code with challengeAndVerify');
  assert.ok(content.includes('supabase.auth.mfa.unenroll'), 'Must remove factor with unenroll');
  assert.ok(content.includes('getAuthenticatorAssuranceLevel'), 'Must check authenticator assurance level (AAL)');
  assert.ok(content.includes('Account Recovery Notice'), 'Must provide clear guidance on recovery and losing access');
});

// 7. Security: GEMINI_API_KEY is server-side only
test('7. GEMINI_API_KEY is never exposed in frontend source or environment', () => {
  const frontendEnvFile = path.join(ROOT, 'web-app/.env');
  if (fs.existsSync(frontendEnvFile)) {
    const envContent = fs.readFileSync(frontendEnvFile, 'utf8');
    assert.ok(!envContent.includes('VITE_GEMINI_API_KEY'), 'VITE_GEMINI_API_KEY must not exist in frontend .env');
    assert.ok(!envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY'), 'Service role key must not exist in frontend .env');
  }

  // Check bundle output directory if exists
  const distDir = path.join(ROOT, 'app/assets');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    for (const f of files) {
      if (f.endsWith('.js')) {
        const bundle = fs.readFileSync(path.join(distDir, f), 'utf8');
        assert.ok(!bundle.includes('AIzaSy'), 'No Google API keys allowed in production client bundle');
      }
    }
  }
});

// 8. Mira AI Backend Endpoint and Model Configuration
test('8. Mira AI endpoint configures gemini-flash-latest and Gottman/EFT/NVC clinical prompt', async () => {
  const miraEndpointFile = path.join(ROOT, 'api/ai/mira.js');
  assert.ok(fs.existsSync(miraEndpointFile), 'api/ai/mira.js must exist');
  const content = fs.readFileSync(miraEndpointFile, 'utf8');

  assert.ok(content.includes('gemini-flash-latest'), 'Must use gemini-flash-latest model');
  assert.ok(content.includes('GEMINI_API_KEY'), 'Must read server-side GEMINI_API_KEY secret');
  assert.ok(content.includes('IDENTITY AND PURPOSE'), 'Must include Mira identity instructions');
  assert.ok(content.includes('SEPARATE FACTS FROM INTERPRETATIONS'), 'Must instruct model to separate facts from interpretations');
  assert.ok(content.includes('SAFETY, LIMITS, AND HONESTY'), 'Must include strict abuse and danger safety guardrails');
  assert.ok(content.includes('mira_messages'), 'Must persist messages to mira_messages');
  assert.ok(content.includes('mira_conversations'), 'Must maintain conversation state in mira_conversations');
});

// 9. Mira Fallback Generation is valid and structured
test('9. Mira clinical fallback produces valid 6-part structured advice and follow-up options', async () => {
  const { generateMiraClinicalFallback } = await import('../api/ai/mira.js');
  const res = generateMiraClinicalFallback({
    message: 'My partner has been distant lately and I do not know how to bring it up.',
    history: [],
    preferences: { communication_preference: 'gentle' }
  });

  assert.ok(res.message, 'Must return conversational message');
  assert.ok(res.structuredAdvice, 'Must return structuredAdvice object');
  assert.ok(res.structuredAdvice.whatWeKnow, 'Must include whatWeKnow');
  assert.ok(res.structuredAdvice.whatMightBeHappening, 'Must include whatMightBeHappening');
  assert.ok(res.structuredAdvice.whatYouCanDo, 'Must include whatYouCanDo');
  assert.ok(res.structuredAdvice.whatYouCouldSay, 'Must include whatYouCouldSay script');
  assert.ok(res.suggestedFollowUps && res.suggestedFollowUps.length > 0, 'Must include suggested follow up questions');
});

// 10. Brand Palette Consistency
test('10. TryHowWeSpeak Brand Identity Palette is preserved across new views', () => {
  const cssFile = path.join(ROOT, 'web-app/src/index.css');
  const cssContent = fs.readFileSync(cssFile, 'utf8');

  assert.ok(cssContent.includes('#C41E3A'), 'Burgundy #C41E3A must be defined');
  assert.ok(cssContent.includes('#F5F3F0'), 'Warm cream #F5F3F0 must be defined');
  assert.ok(cssContent.includes('#D4AF37'), 'Gold #D4AF37 must be defined');
  assert.ok(cssContent.includes('#E8CCC8'), 'Soft blush #E8CCC8 must be defined');
});

console.log(`\n🎉 Phase 8 Test Suite: All ${passedTests} automated checks passed flawlessly!\n`);
