# How We Speak — URL Diagnostics, Gumroad Redirect & Sitemap Repair Report

**Website:** [https://tryhowwespeak.com/](https://tryhowwespeak.com/)  
**Canonical Production Hostname:** `https://www.tryhowwespeak.com/`  
**Hosting Platform:** Vercel (Static + Serverless Edge)  
**Report Date:** 2026-10-18  
**Author:** Senior Full-Stack Engineer & Technical SEO Specialist (Antigravity Agent)  
**Deliverable Status:** Implementation Complete (Local & Verification Ready — Pending Production Deployment Approval)  
**Companion Verification Data:** [`seo-url-gumroad-redirect-verification.csv`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/seo-url-gumroad-redirect-verification.csv)

---

## 1. Executive Summary & Problem Resolution Matrix

An independent verification was performed on the production deployment following the URLDiagnostics sitemap health check at `https://www.tryhowwespeak.com/sitemap.xml`. Every reported problem was confirmed on live production, diagnosed to its architectural root cause, and resolved via targeted configuration and sitemap updates.

| Source URL | URLDiagnostics Issue | Live HTTP Status (Observed) | Root Cause | Implemented Solution | Final Status |
|---|---|---|---|---|---|
| **`https://tryhowwespeak.com/`** | Redirect | `308 Permanent Redirect` -> `https://www.tryhowwespeak.com/` | `sitemap.xml` listed the non-www domain (`https://tryhowwespeak.com/`), which Vercel edge configuration permanently redirects to `www.tryhowwespeak.com`. | Updated `sitemap.xml` to use canonical `https://www.tryhowwespeak.com/`. | **Resolved** |
| **`https://tryhowwespeak.com/men-edition`** | 404 Not Found | `404 Not Found` (on both apex and www) | Missing `vercel.json` routing rules to map retired product route to external Gumroad checkout. | Implemented server-side 308 redirect in `vercel.json` to `https://themindly.gumroad.com/l/How-We-Speak-Men-Edition`. Removed from sitemap. | **Resolved** |
| **`https://tryhowwespeak.com/women-edition`** | 404 Not Found | `404 Not Found` (on both apex and www) | No static `women-edition.html` exists in the repository; no redirect rule was defined in Vercel. | Implemented server-side 308 redirect in `vercel.json` to `https://themindly.gumroad.com/l/howwespeak-women`. Removed from sitemap. | **Resolved** |
| **`https://tryhowwespeak.com/bundle`** | 404 Not Found | `404 Not Found` (on both apex and www) | No static `bundle.html` exists in the repository; no redirect rule was defined in Vercel. | Verified intended product as the $97 Complete Bundle (4-book collection). Implemented server-side 308 redirect in `vercel.json` to `https://themindly.gumroad.com/l/howwespeak-bundle`. Removed from sitemap. | **Resolved** |
| **`https://tryhowwespeak.com/quiz`** | 404 Not Found | `404 Not Found` on `/quiz`; `200 OK` on `/quiz.html` | Vercel was serving static files without `cleanUrls: true`. The physical file `quiz.html` exists, but extensionless `/quiz` failed to resolve. | Configured `"cleanUrls": true` in `vercel.json`. Retained canonical `/quiz` in `sitemap.xml`. Preserved Jotform embed, Facebook Pixel lead event, and GA4 telemetry. | **Resolved** |

---

## 2. Root Cause Analysis of Confirmed Issues

### Issue 1: Homepage Redirect Chain (`https://tryhowwespeak.com/`)
- **Live Evidence:**
  ```http
  HTTP/1.1 308 Permanent Redirect
  Location: https://www.tryhowwespeak.com/
  Server: Vercel
  ```
- **Mechanism:** In the Vercel dashboard domain management settings, `www.tryhowwespeak.com` is configured as the primary production domain. All incoming traffic to the apex domain `tryhowwespeak.com` is automatically 308-redirected by Vercel's edge network to `www.tryhowwespeak.com`.
- **Why URLDiagnostics Flagged It:** `sitemap.xml` declared `<loc>https://tryhowwespeak.com/</loc>`. When the diagnostic bot audited the sitemap, it requested the apex URL, encountered the 308 redirect, and flagged an unnecessary redirect chain. Search engine best practices strictly require sitemaps to list the final canonical destination URL that returns `200 OK`.

### Issue 2: Ebook Product Routes Returning 404 (`/men-edition`, `/women-edition`, `/bundle`)
- **Live Evidence:** Requesting `https://www.tryhowwespeak.com/men-edition`, `/women-edition`, or `/bundle` returned `404 Not Found` with `X-Vercel-Error: NOT_FOUND`.
- **Mechanism:**
  1. The repository had no `vercel.json` file defining server-side redirects or rewrites.
  2. While `men-edition.html` existed as a physical file, Vercel was not configured with `cleanUrls: true`, preventing `/men-edition` from matching `men-edition.html`.
  3. Neither `women-edition.html` nor `bundle.html` exist in the repository (they were originally referenced in `sitemap.xml` and in-body links across 8 pages as virtual product routes).
  4. Without edge redirect rules, requests for these routes hit a dead-end 404 on Vercel edge nodes.
  5. Simultaneously, `sitemap.xml` declared all three URLs, causing search crawlers to attempt indexing broken routes.

### Issue 3: The Quiz Route Returning 404 (`/quiz`)
- **Live Evidence:**
  - `curl.exe -I https://www.tryhowwespeak.com/quiz` -> `404 Not Found`
  - `curl.exe -I https://www.tryhowwespeak.com/quiz.html` -> `200 OK`
- **Mechanism:** The quiz was never removed or deleted. It lives at `quiz.html` and contains the full Jotform embed (`https://form.jotform.com/jsform/262838678818074`), Facebook Pixel Lead tracking (`fbq('track', 'Lead')`), Google Analytics tag (`G-XLZVVY5J2T`), and navigation components. Because Vercel lacked `cleanUrls: true`, Vercel looked for a directory or file named `quiz` on the filesystem, found none, and threw a 404 error.

---

## 3. Product Route Mapping & Gumroad Destination Verification

The repository was searched for all existing Gumroad product URLs, checkout links, and product IDs across `assets/js/components.js`, `assets/js/quiz.js`, `index.html`, `contact.html`, and all published guides.

### Verified Route Mapping:

| Source Route | Product Identity | Verified Gumroad Destination | Live Destination HTTP Status | Selection Evidence from Codebase |
|---|---|---|---|---|
| **`/men-edition`** | Men Edition Ebook (for women) | **`https://themindly.gumroad.com/l/How-We-Speak-Men-Edition`** | **`200 OK`** | Linked across `index.html` (lines 799, 1022, 1678), `assets/js/components.js` (line 120), `assets/js/quiz.js` (line 171), and all article callouts. Price: $37. |
| **`/women-edition`** | Women Edition Ebook (for men) | **`https://themindly.gumroad.com/l/howwespeak-women`** | **`200 OK`** | Linked across `index.html` (lines 834, 1025, 1680), `assets/js/components.js` (line 121), and `assets/js/quiz.js` (line 194). Price: $37. |
| **`/bundle`** | The Complete Bundle (All 4 Guides) | **`https://themindly.gumroad.com/l/howwespeak-bundle`** | **`200 OK`** | In `index.html` lines 942-1036 and 1135-1156, the "#bundle" section explicitly defines the $97 Complete Bundle (all 4 books: Men Edition, Women Edition, Script Collection, and Sex Talk). CTA buttons link directly to `howwespeak-bundle`. Distinct from the $27 standalone "Complete Script Collection" (`howwespeak-scripts`). |

*Note on query parameters:* Clean canonical Gumroad URLs (without `?wanted=true`) were selected as the permanent redirect destinations. When Gumroad receives `?wanted=true`, it issues an additional 302 redirect to its checkout modal. Directing to the clean product URL avoids unnecessary redirect chains while ensuring immediate 200 OK delivery.

---

## 4. Final Intended Behavior of the Quiz (`/quiz`)

The quiz is an essential top-of-funnel acquisition, diagnostic, and lead-generation experience. It must **NOT** be redirected to Gumroad.

1. **Route Restoration:** By enabling `"cleanUrls": true` in `vercel.json`, requests to `/quiz` are routed directly to `quiz.html` by Vercel edge servers and return `200 OK`.
2. **Preserved Integrations:**
   - **Jotform Embed:** Form `262838678818074` loads cleanly inside `.jotform-quiz-wrapper`.
   - **Analytics & Tracking:** Google tag `G-XLZVVY5J2T` and Facebook Pixel `4165467567112797` (with `fbq('track', 'Lead')`) execute without interruption.
   - **Serverless API Route:** `api/quiz-submit.js` remains active and safe; previous tests confirm it cleanly responds with `{ ok: true, message: 'Telegram notifications have been disabled.' }`.
3. **Sitemap Inclusion:** The clean canonical URL `https://www.tryhowwespeak.com/quiz` is retained in `sitemap.xml` with priority `0.8`.

---

## 5. Architectural Changes Implemented

### 1. New Vercel Configuration File: [`vercel.json`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/vercel.json)
Created in the repository root to establish edge routing rules, clean URLs, and permanent redirects:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "redirects": [
    {
      "source": "/men-edition",
      "destination": "https://themindly.gumroad.com/l/How-We-Speak-Men-Edition",
      "permanent": true
    },
    {
      "source": "/men-edition/",
      "destination": "https://themindly.gumroad.com/l/How-We-Speak-Men-Edition",
      "permanent": true
    },
    {
      "source": "/men-edition.html",
      "destination": "https://themindly.gumroad.com/l/How-We-Speak-Men-Edition",
      "permanent": true
    },
    {
      "source": "/women-edition",
      "destination": "https://themindly.gumroad.com/l/howwespeak-women",
      "permanent": true
    },
    {
      "source": "/women-edition/",
      "destination": "https://themindly.gumroad.com/l/howwespeak-women",
      "permanent": true
    },
    {
      "source": "/women-edition.html",
      "destination": "https://themindly.gumroad.com/l/howwespeak-women",
      "permanent": true
    },
    {
      "source": "/bundle",
      "destination": "https://themindly.gumroad.com/l/howwespeak-bundle",
      "permanent": true
    },
    {
      "source": "/bundle/",
      "destination": "https://themindly.gumroad.com/l/howwespeak-bundle",
      "permanent": true
    },
    {
      "source": "/bundle.html",
      "destination": "https://themindly.gumroad.com/l/howwespeak-bundle",
      "permanent": true
    }
  ]
}
```
*Technical Details:*
- `"cleanUrls": true`: Resolves `/quiz`, `/articles`, and all article slugs without `.html` extension, and issues a 308 redirect from `.html` extensions to clean URLs.
- `"trailingSlash": false`: Strips trailing slashes to enforce URL normalization.
- `"redirects"`: Implements 9 explicit rules covering non-trailing-slash, trailing-slash, and `.html` variants for the 3 retired product routes to ensure zero redirect hops regardless of how users or bots request the URL.

### 2. Sitemap Overhaul: [`sitemap.xml`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/sitemap.xml)
- **Unified Canonical Hostname:** Converted all `<loc>` entries from apex `https://tryhowwespeak.com` to canonical `https://www.tryhowwespeak.com`.
- **Removed Retired Redirecting Routes:** Purged `/men-edition`, `/women-edition`, and `/bundle`.
- **Preserved Core Pages:** Retained `/` (priority 1.0), `/articles` (priority 0.8), and `/quiz` (priority 0.8).
- **Added Published Spoke Articles:** Added `/what-to-say-when-partner-shuts-down`, `/why-men-go-silent-during-arguments`, `/why-you-shut-down-during-arguments`, `/how-to-stop-spiraling-when-your-partner-needs-space` (priority 0.7), and `/contact` (priority 0.5).
- **Updated Timestamps:** Set `<lastmod>` to `2026-10-18`.

### 3. Robots.txt Synchronization: [`robots.txt`](file:///c:/Users/Excelsior/Desktop/how-we-speak-website/robots.txt)
- Updated line 26: `Sitemap: https://www.tryhowwespeak.com/sitemap.xml`.
- Added `Disallow: /quiz-stats` to protect the unauthenticated metrics dashboard from crawler discovery.

---

## 6. Testing, Verification & Results Summary

### Tests Executed:
1. **Live Production HTTP Probing (`curl.exe -I`):**
   - Verified apex redirect: `https://tryhowwespeak.com/` -> `308` -> `https://www.tryhowwespeak.com/` (`200 OK`).
   - Verified sitemap redirect: `https://tryhowwespeak.com/sitemap.xml` -> `308` -> `https://www.tryhowwespeak.com/sitemap.xml` (`200 OK`).
   - Verified extension behavior: `/quiz.html` returns `200 OK`; extensionless `/quiz` returns `404` on live production (confirming the necessity of `cleanUrls: true`).
2. **Live Gumroad Edge Verification:**
   - `https://themindly.gumroad.com/l/How-We-Speak-Men-Edition` -> `200 OK`
   - `https://themindly.gumroad.com/l/howwespeak-women` -> `200 OK`
   - `https://themindly.gumroad.com/l/howwespeak-bundle` -> `200 OK`
3. **Automated Project Validation Script (`scratch/verify-fixes.mjs`):**
   - Validated `vercel.json` JSON syntax, `cleanUrls: true`, `trailingSlash: false`, and 9 redirect definitions.
   - Validated `sitemap.xml` XML syntax and confirmed all 8 declared URLs map to existing physical source files.
   - Validated `robots.txt` canonical sitemap reference.
   - **Result: 0 errors detected.**
4. **Backend Serverless Test Suite (`npm test`):**
   - Executed `node test-quiz-submit.test.mjs`.
   - **Result: 1 Passed, 0 Failed.**

---

## 7. Deployment Status & Action Items

### Current Deployment Status:
- **Local Environment:** 100% complete and validated. All files are staged and verified.
- **Preview / Production:** **Pending deployment.** In strict compliance with safety rules, zero commits, git pushes, or production deployments were performed without explicit user approval.
- **Live Production Current State:** Still serving the pre-fix state (returning 404 for extensionless clean URLs and redirecting sitemap apex).

### What You Must Do Next to Make Fixes Live:
To deploy these fixes to your live Vercel production website, execute or approve the following:
1. Stage the modified files:
   ```bash
   git add vercel.json sitemap.xml robots.txt
   ```
2. Commit the changes:
   ```bash
   git commit -m "fix(seo): configure cleanUrls, Gumroad product redirects, and canonical sitemap"
   ```
3. Push to GitHub (`main` branch):
   ```bash
   git push origin main
   ```
4. Vercel will automatically trigger a production deployment. Once deployed:
   - `/quiz` will immediately return `200 OK`.
   - `/men-edition`, `/women-edition`, and `/bundle` will 308-redirect to Gumroad.
   - `https://www.tryhowwespeak.com/sitemap.xml` will serve clean, canonical URLs with 0 errors on URLDiagnostics.
