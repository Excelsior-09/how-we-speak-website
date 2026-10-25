# TryHowWeSpeak — System Delivery & Deployment Architecture

**Product:** TryHowWeSpeak (Relationship Communication & Couples Workspace)  
**Version:** 1.0.0 Production  
**Status:** All Phases Implemented & Verified with 100% Passing Automated Tests

---

## 1. System Architecture Overview

```mermaid
graph TD
    Client["Client Browser (Desktop & Mobile)"] -->|Static Marketing & Ebooks| StaticSite["Marketing Pages (HTML/CSS/JS)"]
    Client -->|Web App SPA /app| ViteApp["React 19 + TypeScript SPA"]
    
    ViteApp -->|Client-side Auth & RLS Queries| SupabaseAuth["Supabase Auth & Database"]
    
    ViteApp -->|POST /api/ai/rehearsal| RehearsalAPI["/api/ai/rehearsal (Node Serverless)"]
    ViteApp -->|POST /api/ai/followup| FollowupAPI["/api/ai/followup (Node Serverless)"]
    ViteApp -->|POST /api/ai/joint-summary| JointSummaryAPI["/api/ai/joint-summary (Node Serverless)"]
    ViteApp -->|GET /api/auth/me| AuthMeAPI["/api/auth/me (Node Serverless)"]
    
    Gumroad["Gumroad Checkout Edge"] -->|Sale Webhook POST| GumroadWebhook["/api/webhooks/gumroad"]
    
    RehearsalAPI -->|Non-Diagnostic Prompt| GeminiAI["Google Gemini AI API"]
    JointSummaryAPI -->|EFT Synthesis Prompt| GeminiAI
    
    RehearsalAPI -->|Audit Usage (service_role)| SupabaseDB[(PostgreSQL Database + RLS)]
    GumroadWebhook -->|Provision Entitlement (service_role)| SupabaseDB
    SupabaseAuth --> SupabaseDB
```

### 1.1 Architecture Components
1. **Marketing & Conversion Layer (`/`):**
   - High-converting vanilla HTML5/CSS3 landing page (`index.html`), quiz (`quiz.html`), blog guides, and policy pages.
   - Design tokens: Burgundy (`#C41E3A`), Cream (`#F5F3F0`), Gold (`#D4AF37`), Blush (`#E8CCC8`).
   - Permanent 308 redirects in `vercel.json` direct retired product paths (`/men-edition`, `/women-edition`, `/bundle`) to verified Gumroad checkout destinations.
   - Preserves complete SEO structure (`sitemap.xml`, `robots.txt`, Open Graph metadata).
2. **Web Application SPA (`/app`):**
   - Single-page application built with React 19, TypeScript, and Vite.
   - Packaged with `base: '/app/'`, building assets into `app/`.
   - Vercel URL rewrites route `/app` and `/app/:path*` to `/app/index.html`.
   - Reactive modules:
     - **Individual Rehearsal Studio:** Situation description, goal & tone selector, live AI softened startups, polyvagal threat breakdown, interactive follow-up practice simulator, and private plan vault.
     - **Couples Workspace:** Cryptographic pairing, isolated private reflections, selective sharing toggle, and neutral joint AI cycle summaries.
     - **Script Bank:** Gottman-derived communication scripts with dynamic Gumroad entitlement checks.
3. **Serverless AI & Access Control Endpoints (`api/`):**
   - `/api/ai/rehearsal`: Server-side Gemini API client, rate limiting (3 free trial rehearsals), clinical prompt constraints, and somatic co-regulation coaching.
   - `/api/ai/followup`: Counter-script generator for partner withdrawal, stonewalling, or defensiveness.
   - `/api/ai/joint-summary`: Privacy-gated synthesis that verifies both partners have set `is_shared = true` before reading and synthesizing reflections into a balanced loop breakdown.
   - `/api/webhooks/gumroad`: Secret-verified purchase webhook provisioning digital entitlements.
   - `/api/auth/me`: Profile, space, and entitlement quota checker.
4. **PostgreSQL Database & Row Level Security:**
   - 8 normalized tables with comprehensive RLS policies preventing cross-account leakage.

---

## 2. SQL Migration & Schema Reference

Version-controlled migration: [`supabase/migrations/20261025000000_create_core_schema.sql`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/supabase/migrations/20261025000000_create_core_schema.sql)

### Summary of Tables & RLS Policies:

| Table | Purpose | RLS Access Rule |
|---|---|---|
| `profiles` | User profiles extending Supabase `auth.users` | `auth.uid() = id` OR linked partner in `couples_spaces`. |
| `couples_spaces` | Relationship room connecting two users | `partner_1_id = auth.uid() OR partner_2_id = auth.uid()`. |
| `workspace_invitations` | Cryptographic 7-day single-use invite tokens | Inviter can view/edit; token lookup guarded by security definer procedure. |
| `rehearsal_plans` | Private individual conversation plans | `auth.uid() = user_id`. Strictly inaccessible to any other user. |
| `couples_exercises` | Conflict exercises and joint summaries | Accessible to both verified partners in the parent space. |
| `private_reflections` | Partner answers to conflict reflections | `user_id = auth.uid()` OR (`is_shared = true` AND reader is linked partner). |
| `entitlements` | Digital product & bundle entitlements | User can read own records; write access restricted strictly to `service_role`. |
| `usage_records` | AI rate-limiting and audit log | User can read own records; write access restricted strictly to `service_role`. |

### Key Stored Procedures:
- `handle_new_user()`: Triggered upon `auth.users` insert; automatically creates user profile and grants initial 3-rehearsal free trial entitlement.
- `accept_couples_invitation(invite_token)`: Security definer procedure validating token expiration, preventing self-pairing, linking Partner 2 to `couples_spaces`, and marking invitation as accepted.

---

## 3. Environment Variable Setup Guide

The template is documented in [`.env.example`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/.env.example). Copy to `.env` for local execution and add to Vercel Project Settings for production:

```env
# ── SUPABASE (Database, Auth & Row Level Security) ───────────────────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Server-side only (keep strictly confidential)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── AI BACKEND (Relationship Translator & De-escalation Engine) ──────────────
AI_API_KEY=your_google_gemini_api_key_here
AI_MODEL=gemini-1.5-pro

# ── GUMROAD INTEGRATION ──────────────────────────────────────────────────────
GUMROAD_WEBHOOK_SECRET=your_gumroad_webhook_secret_here

# ── APPLICATION CONFIGURATION ────────────────────────────────────────────────
APP_URL=https://tryhowwespeak.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Third-Party Integrations

### 4.1 Gumroad Integration
- **Product Mapping:**
  - `How-We-Speak-Men-Edition` ($37) ➔ `men-edition`
  - `howwespeak-women` ($37) ➔ `women-edition`
  - `howwespeak-scripts` ($27) ➔ `script-collection`
  - `howwespeak-bundle` ($97) ➔ `bundle` (Full guide access + unlimited AI rehearsals)
- **Webhook Endpoint:** `POST https://tryhowwespeak.com/api/webhooks/gumroad`
- **Configuring in Gumroad:**
  1. Open Gumroad Settings ➔ Advanced ➔ **Ping**.
  2. Set Endpoint URL to `https://tryhowwespeak.com/api/webhooks/gumroad`.
  3. Include secret parameter or header matching `GUMROAD_WEBHOOK_SECRET`.
  4. The webhook handles purchase provisioning, duplicate sale idempotency, and refund revocation automatically.

### 4.2 Google Gemini AI Engine
- Implemented with non-diagnostic system prompts based on Gottman Softened Startups, Polyvagal Theory, and Emotionally Focused Therapy (EFT).
- Server-side fallback rule engine ensures uninterrupted development and testing even when AI API keys or quotas are pending.

---

## 5. Verification Test Suite Results

All automated test suites execute via:
```bash
npm test
```

### Verified Actual Results:
```
======================================================================
▶ Executing: test-quiz-submit.test.mjs
======================================================================
  ✅ PASS: Endpoint cleanly confirms Telegram notifications are disabled
📊 Test Summary: 1 Passed, 0 Failed

======================================================================
▶ Executing: tests/phase2-auth-and-db.test.mjs
======================================================================
  ✅ PASS: 20261025000000_create_core_schema.sql migration file exists
  ✅ PASS: All 8 core tables are defined with schemas and foreign keys
  ✅ PASS: Row Level Security (RLS) explicitly enabled on all 8 tables
  ✅ PASS: Cross-account privacy boundary verified — private_reflections strictly isolates unshared partner data
  ✅ PASS: Rehearsal plans strict user isolation policy verified
  ✅ PASS: Entitlements and usage tables guarded against client tampering
  ✅ PASS: handle_new_user and accept_couples_invitation security procedures verified
  ✅ PASS: TypeScript database schema types and AuthContext bindings verified
🎉 All 8 Phase 2 tests PASSED successfully!

======================================================================
▶ Executing: tests/phase3-individual-rehearsal.test.mjs
======================================================================
  ✅ PASS: Rehearsal endpoint rejects empty or sub-5 character situation input with 400
  ✅ PASS: Rehearsal engine returns 3 softened clinical scripts with amygdala insight and non-diagnostic compliance
  ✅ PASS: Follow-up endpoint rejects empty script input with 400
  ✅ PASS: Follow-up engine detects freeze/withdrawal state and returns grounded de-escalation counter-scripts
🎉 All 4 Phase 3 tests PASSED successfully!

======================================================================
▶ Executing: tests/phase4-couples-workspace.test.mjs
======================================================================
  ✅ PASS: Joint summary endpoint rejects requests missing exerciseId
  ✅ PASS: Joint summary strictly rejects if only one partner has submitted a reflection
  ✅ PASS: Cross-account privacy boundary verified — joint summary blocked when partner reflection is unshared (is_shared = false)
  ✅ PASS: Neutral joint synthesis successfully generated — balanced, non-diagnostic, and includes 3 concrete repair actions
🎉 All 4 Phase 4 tests PASSED successfully!

======================================================================
▶ Executing: tests/phase5-gumroad-and-entitlements.test.mjs
======================================================================
  ✅ PASS: Gumroad webhook rejects payload with missing email or product permalink (400)
  ✅ PASS: Gumroad sale provisions Men Edition entitlement with mapped productKey (men-edition)
  ✅ PASS: Complete Bundle sale provisions all-access bundle entitlement
  ✅ PASS: Gumroad refund event updates entitlement status to refunded
  ✅ PASS: /api/auth/me rejects unauthenticated requests with 401
  ✅ PASS: /api/auth/me returns active entitlements, rehearsal usage quotas, and Pro status
🎉 All 6 Phase 5 tests PASSED successfully!

======================================================================
📊 COMPREHENSIVE TEST RESULTS SUMMARY
======================================================================
  ✅ test-quiz-submit.test.mjs: Passed (Exit Code 0)
  ✅ tests/phase2-auth-and-db.test.mjs: Passed (Exit Code 0)
  ✅ tests/phase3-individual-rehearsal.test.mjs: Passed (Exit Code 0)
  ✅ tests/phase4-couples-workspace.test.mjs: Passed (Exit Code 0)
  ✅ tests/phase5-gumroad-and-entitlements.test.mjs: Passed (Exit Code 0)

🎉 All 5 test suites executed with 100% pass rate!
```

---

## 6. Production Deployment Checklist (Vercel & Supabase)

- [ ] **Step 1: Execute SQL Migration on Supabase**
  - In Supabase SQL Editor, run `supabase/migrations/20261025000000_create_core_schema.sql`.
  - Confirm all 8 tables appear under Table Editor and Row Level Security is active.
- [ ] **Step 2: Configure Supabase Auth**
  - Under Authentication ➔ URL Configuration, set:
    - Site URL: `https://tryhowwespeak.com/app/`
    - Redirect URLs: `https://tryhowwespeak.com/app/**`, `http://localhost:3000/app/**`.
- [ ] **Step 3: Set Vercel Production Environment Variables**
  - Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Add `AI_API_KEY`, `AI_MODEL`.
  - Add `GUMROAD_WEBHOOK_SECRET`.
  - Add `APP_URL=https://tryhowwespeak.com`.
  - Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- [ ] **Step 4: Build & Deploy**
  - Verify build script: `npm run build` (`npm --prefix web-app run build`).
  - Deploy via `git push origin main` or Vercel CLI.
- [ ] **Step 5: Configure Gumroad Ping Webhook**
  - Paste `https://tryhowwespeak.com/api/webhooks/gumroad` into Gumroad Advanced Ping Settings.

---

## 7. Known Limitations & Architectural Assumptions

1. **Email-Based Purchase Linking Assumption:**
   - When a customer purchases an ebook on Gumroad, Gumroad passes their purchase email. If the user registers on TryHowWeSpeak with the same email, the entitlement automatically links. If a user registers with an alternate email, manual claiming or admin email association is required.
2. **Third-Party Rate Limits:**
   - AI generation depends on Google Gemini API uptime and rate limits. The built-in clinical fallback engine guarantees that user requests never fail completely during upstream API hiccups.
3. **Audio / Speech-to-Text Input:**
   - In this release, rehearsal inputs are text-based. Somatic voice tone instructions are provided as text coaching; native Web Audio microphone pitch analysis is earmarked for a future release.
4. **Offline Capability:**
   - The web app operates gracefully in sandbox mode using `localStorage` for solo rehearsing when disconnected from Supabase, but couples synchronization requires network connectivity.
