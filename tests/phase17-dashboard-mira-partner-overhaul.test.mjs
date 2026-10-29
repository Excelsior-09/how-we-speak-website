// ==============================================================================
// TEST SUITE: Phase 17 — Dashboard, Mira AI, Partner Invitations & Responsive Overhaul
// Verifies:
// 1. Passwordless magic link removal from AuthModal.
// 2. "Regenerate openings" API support, clinical variation, and quota exemption.
// 3. Mira AI mandatory authentication enforcement (UI & Backend 401).
// 4. Partner invitation visible codes, copy buttons, and incoming preview card.
// 5. Responsive design tokens, CSS classes, and breakpoint overflow safeguards.
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper to mock express/serverless res/req
function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    send(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

test('Phase 17: Dashboard, Mira AI, Partner Invitations & Responsive Overhaul', async (t) => {

  await t.test('1. AuthModal: Passwordless Magic Link cleanly removed', () => {
    const authModalPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'AuthModal.tsx');
    assert.ok(fs.existsSync(authModalPath), 'AuthModal.tsx must exist');
    const authModalContent = fs.readFileSync(authModalPath, 'utf8');

    // Confirm magic link button and handler are absent
    assert.ok(!authModalContent.includes('Send Passwordless Magic Link'), 'Magic Link button text must be removed');
    assert.ok(!authModalContent.includes('handleMagicLink'), 'handleMagicLink handler must be removed');
    assert.ok(!authModalContent.includes('signInWithMagicLink'), 'signInWithMagicLink import/call must be removed');

    // Confirm standard password sign in, sign up, Google OAuth remain present
    assert.ok(authModalContent.includes('signIn('), 'Email/password sign-in must be retained');
    assert.ok(authModalContent.includes('signUp('), 'Account sign-up must be retained');
    assert.ok(authModalContent.includes('signInWithOAuth'), 'Google OAuth must be retained');
  });

  await t.test('2. Rehearsal Engine: "Regenerate Openings" API & UI Implementation', async () => {
    const rehearsalApiPath = path.join(ROOT_DIR, 'api', 'ai', 'rehearsal.js');
    assert.ok(fs.existsSync(rehearsalApiPath), 'api/ai/rehearsal.js must exist');
    const rehearsalCode = fs.readFileSync(rehearsalApiPath, 'utf8');

    // Confirm API supports regenerateOpenings parameter and exemption
    assert.ok(rehearsalCode.includes('regenerateOpenings'), 'rehearsal.js must support regenerateOpenings parameter');
    assert.ok(rehearsalCode.includes('previousOpenings'), 'rehearsal.js must accept previousOpenings');
    assert.ok(rehearsalCode.includes('ai_rehearsal_regen'), 'rehearsal.js must log ai_rehearsal_regen audit action');
    assert.ok(rehearsalCode.includes('generateClinicalStructuredFallback'), 'Clinical structured fallback must be supported');

    // Test rehearsal endpoint with regenerateOpenings
    const { default: rehearsalHandler } = await import('../api/ai/rehearsal.js');
    const mockReq = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        situation: 'I want to talk about how we divide parenting chores without getting defensive.',
        regenerateOpenings: true,
        previousOpenings: ['I need to talk to you about the chores.']
      }
    };
    const mockRes = createMockRes();
    await rehearsalHandler(mockReq, mockRes);

    assert.strictEqual(mockRes.statusCode, 200, 'Rehearsal API must succeed on regeneration');
    assert.strictEqual(mockRes.data.ok, true, 'Response must indicate ok: true');
    assert.ok(mockRes.data.data.openings, 'Response must have data.openings');
    assert.ok(mockRes.data.data.openings.gentle, 'Must provide gentle opening');
    assert.ok(mockRes.data.data.openings.direct, 'Must provide direct opening');
    assert.ok(mockRes.data.data.openings.firm, 'Must provide firm opening');

    // Check UI component implementation
    const rehearsalViewPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'RehearsalView.tsx');
    assert.ok(fs.existsSync(rehearsalViewPath), 'RehearsalView.tsx must exist');
    const rehearsalViewCode = fs.readFileSync(rehearsalViewPath, 'utf8');

    assert.ok(rehearsalViewCode.includes('isRegenerating'), 'RehearsalView must have isRegenerating state');
    assert.ok(rehearsalViewCode.includes('handleRegenerateOpenings'), 'RehearsalView must have handleRegenerateOpenings');
    assert.ok(rehearsalViewCode.includes('Regenerating Openings...'), 'RehearsalView must display regenerating feedback');
  });

  await t.test('3. Mira AI: Mandatory Authentication & Boundary Enforcement', async () => {
    const miraApiPath = path.join(ROOT_DIR, 'api', 'ai', 'mira.js');
    assert.ok(fs.existsSync(miraApiPath), 'api/ai/mira.js must exist');

    const { default: miraHandler } = await import('../api/ai/mira.js');

    // 3.1 Unauthenticated call MUST be rejected with 401
    const unauthReq = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        message: 'Hello Mira, can you help me?'
      }
    };
    const unauthRes = createMockRes();
    await miraHandler(unauthReq, unauthRes);

    assert.strictEqual(unauthRes.statusCode, 401, 'Unauthenticated call to /api/ai/mira must return 401');
    assert.strictEqual(unauthRes.data.code, 'AUTH_REQUIRED', 'Error code must be AUTH_REQUIRED');
    assert.ok(unauthRes.data.error.includes('Authentication required'), 'Must provide human message');

    // 3.2 UI Component has authentication gate
    const miraViewPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'MiraView.tsx');
    assert.ok(fs.existsSync(miraViewPath), 'MiraView.tsx must exist');
    const miraViewCode = fs.readFileSync(miraViewPath, 'utf8');

    assert.ok(miraViewCode.includes('onRequireAuth'), 'MiraView must accept onRequireAuth prop');
    assert.ok(miraViewCode.includes('Sign in to start your conversation with Mira'), 'Must show sign in luxury banner for guests');

    // 3.3 App Router maintains post-auth return destination
    const appPath = path.join(ROOT_DIR, 'web-app', 'src', 'App.tsx');
    const appCode = fs.readFileSync(appPath, 'utf8');
    assert.ok(appCode.includes("setReturnTo('/app/mira')"), 'App.tsx must set returnTo for seamless post-auth redirection');
  });

  await t.test('4. My Partner: Clear Invitation Code, Sharing & URL Connection Flow', () => {
    const workspaceViewPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'WorkspaceView.tsx');
    assert.ok(fs.existsSync(workspaceViewPath), 'WorkspaceView.tsx must exist');
    const workspaceCode = fs.readFileSync(workspaceViewPath, 'utf8');

    // 4.1 Invitation Code Display
    assert.ok(workspaceCode.includes('id="invitation-code-display"'), 'Must have distinct invitation code display element');
    assert.ok(workspaceCode.includes('id="btn-copy-invite-code"'), 'Must have dedicated Copy Code button');
    assert.ok(workspaceCode.includes('id="btn-copy-invite-link"'), 'Must have dedicated Copy Link button');

    // 4.2 Status, Expiration, and Instructions
    assert.ok(workspaceCode.includes('Pending Partner Connection'), 'Must display status badge');
    assert.ok(workspaceCode.includes('How your partner joins:'), 'Must provide clear 3-step instructions');
    assert.ok(workspaceCode.includes('id="incoming-partner-invitation-card"'), 'Must have incoming invitation review card');

    // 4.3 Partner Invite API
    const partnerInviteApiPath = path.join(ROOT_DIR, 'api', 'partner', 'invite.js');
    assert.ok(fs.existsSync(partnerInviteApiPath), 'api/partner/invite.js must exist');
    const partnerInviteCode = fs.readFileSync(partnerInviteApiPath, 'utf8');
    assert.ok(partnerInviteCode.includes('create'), 'Partner invite must handle create action');
    assert.ok(partnerInviteCode.includes('accept'), 'Partner invite must handle accept action');
    assert.ok(partnerInviteCode.includes('workspace_invitations'), 'Partner invite must query workspace_invitations table');
  });

  await t.test('5. Responsive Design: Breakpoints, Containers & No Mobile Layout Breakage', () => {
    const cssPath = path.join(ROOT_DIR, 'web-app', 'src', 'index.css');
    assert.ok(fs.existsSync(cssPath), 'index.css must exist');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Check responsive classes and media queries
    assert.ok(cssContent.includes('.main-app-container'), '.main-app-container class must exist');
    assert.ok(cssContent.includes('.dashboard-card-responsive'), '.dashboard-card-responsive class must exist');
    assert.ok(cssContent.includes('.mira-grid-layout'), '.mira-grid-layout class must exist');
    assert.ok(cssContent.includes('.workspace-dialogue-grid'), '.workspace-dialogue-grid class must exist');

    assert.ok(cssContent.includes('@media (max-width: 900px)'), 'Breakpoints for tablet/mobile (<=900px) must exist');
    assert.ok(cssContent.includes('@media (max-width: 640px)'), 'Breakpoints for mobile (<=640px) must exist');

    // Check that views do not have unyielding minmax thresholds > 320px
    const historyViewPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'HistoryView.tsx');
    const historyViewContent = fs.readFileSync(historyViewPath, 'utf8');
    assert.ok(!historyViewContent.includes('minmax(360px'), 'HistoryView must not have rigid minmax(360px) grid columns');

    const planDetailViewPath = path.join(ROOT_DIR, 'web-app', 'src', 'components', 'PlanDetailView.tsx');
    const planDetailContent = fs.readFileSync(planDetailViewPath, 'utf8');
    assert.ok(!planDetailContent.includes('minmax(340px'), 'PlanDetailView must not have rigid minmax(340px) grid columns');
  });

});
