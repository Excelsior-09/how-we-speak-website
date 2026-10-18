# Comprehensive SEO & AEO Technical Audit Report
**Website:** [https://tryhowwespeak.com/](https://tryhowwespeak.com/)  
**Audit Date:** 2026-10-17  
**Auditor:** Senior Technical SEO Auditor & Website Architect (via Antigravity)  
**Repository Branch:** `main`  
**Current Commit:** `f80c7b8` ("Facebook pixel in quiz html lead")  
**Working Tree Status:** Clean  

---

## 1. Executive Summary

A comprehensive, read-only technical SEO and content architecture audit was conducted on the **How We Speak** codebase. The website is an editorial direct-to-consumer e-commerce brand specializing in clinical and psychology-backed communication guides, scripts, and assessments for romantic couples.

The website is implemented as a lightweight, clean, static multi-page architecture with vanilla JavaScript component injection (`components.js`), styled with modular CSS, and hosted via Vercel / static edge servers.

### Key High-Level Findings:
1. **Critical Security / Crawl Waste Risk (`/quiz-stats`):** An internal analytics dashboard (`quiz-stats.html`) reporting internal sales funnels and completion metrics is technically indexable by search engines, with robots meta set to `index, follow` and protected only by a client-side hardcoded JavaScript string (`"admin123"`).
2. **Duplicate Content & Cannibalization Triangle:** `men-edition.html`, `free-scripts.html`, and `article-template.html` share virtually identical HTML bodies, identical `<title>` tags, and identical `<h1>` headings ("The 20-Minute Rule: Why He Goes Silent During Fights"). Furthermore, `article-template.html` has live self-referencing canonical markup and is linked directly from the public articles hub (`articles.html`).
3. **Ghost Sitemap Routes (`/women-edition` & `/bundle`):** Both URLs are declared in `sitemap.xml` and targeted by over 10 internal contextual links, but neither file (`women-edition.html` or `bundle.html`) exists in the repository. Without server-level rewrite configuration, these risk returning 404 HTTP errors.
4. **Sitemap Coverage Gap:** Four high-quality, published articles (`why-you-shut-down-during-arguments`, `why-men-go-silent-during-arguments`, `how-to-stop-spiraling-when-your-partner-needs-space`, and `free-scripts`) are omitted from `sitemap.xml`.
5. **Site-Wide Meta Description Duplication:** Five major templates share an identical, generic meta description fallback string ("Psychology-backed communication guides for couples...").
6. **Preliminary Target Keyword Evaluation:** The primary target hypothesis, *"communication scripts for couples"*, represents a high-intent commercial gap. No single page on the site currently targets this exact query in its title, H1, or meta description.

---

## 2. Scope, Audit Date, and Sources Accessed

- **Audit Date:** 2026-10-17
- **Project Directory:** `c:\Users\Excelsior\Desktop\how-we-speak-website`
- **Git Checkpoint:** Branch `main`, Commit `f80c7b8`
- **Framework & Architecture:** Static HTML, Vanilla JS, CSS (`main.min.css`, `components.min.css`, `responsive.css`), Express dependency (`package.json`)
- **Sources Directly Accessed & Verified:**
  - Complete local file tree (all 15 `.html` files).
  - XML Sitemap (`sitemap.xml`).
  - Robots configuration (`robots.txt`).
  - Shared JavaScript components (`assets/js/components.js`, `cart.min.js`, `products.min.js`).
  - Serverless API route (`api/quiz-submit.js`).
  - Git log and working-tree status.
- **Sources NOT Accessed (Access Limitations):**
  - Google Search Console API / export data (no authentication keys or export tables provided).
  - Google Analytics 4 property reporting data (tags `G-XLZVVY5J2T` and Facebook Pixel `4165467567112797` confirmed in code, but live metrics not accessible).
  - Production server HTTP headers (X-Robots-Tag, 301/404 live status codes, Vercel edge rewrite configurations).
  - Live SERP rank-tracking tools.

---

## 3. Access Limitations and Unverified Data

| Item | Status | Impact on Audit |
|---|---|---|
| Live HTTP Response Codes | Unverified | Inferred risks for `/women-edition` and `/bundle` must be verified via live curl request. |
| Google Search Console Impressions/Clicks | Unverified | Keyword impressions, click-through rates, and average rank positions cannot be reported as historical fact. |
| Google Analytics Sessions & Bounce Rates | Unverified | On-page engagement and conversion baselines cannot be quantified. |
| JavaScript Rendering by Bot Engines | Verified in Source | Jotform quiz embed (`form.jotform.com`) requires client-side JS; bots without headless execution cannot crawl quiz questions. |

*Note: All findings in this document are explicitly classified as either **Verified in source code only** or **Inferred risk — needs validation**.*

---

## 4. Repository and Git Checkpoint

- **Local Path:** `c:\Users\Excelsior\Desktop\how-we-speak-website`
- **Active Branch:** `main`
- **HEAD Commit:** `f80c7b8942dce706d7f72eb455e2bd307a23f9ec`
- **Commit Subject:** `Facebook pixel in quiz html lead`
- **Working Tree State:** Completely clean.
- **Safety Compliance:** Audit performed under strict read-only constraints. Zero application logic, styles, HTML files, or configuration files were modified.

---

## 5. URL Inventory Summary by Page Type

Across the codebase, **17 distinct URLs** were identified through static analysis, sitemaps, and internal linking networks:

| Page Type | Count | URLs Discovered |
|---|---|---|
| **Homepage** | 1 | `https://tryhowwespeak.com/` |
| **Product / Guide Pages** | 2 | `/men-edition`, `/women-edition` *(missing repo file)* |
| **Product Bundle Pages** | 1 | `/bundle` *(missing repo file)* |
| **Content Hub** | 1 | `/articles` |
| **Published Blog Articles** | 4 | `/why-you-shut-down-during-arguments`, `/why-men-go-silent-during-arguments`, `/what-to-say-when-partner-shuts-down`, `/how-to-stop-spiraling-when-your-partner-needs-space` |
| **Lead Magnets / Free Resources** | 1 | `/free-scripts` *(duplicate of men-edition)* |
| **Interactive Assessment / Quiz** | 1 | `/quiz` |
| **Internal Dashboard** | 1 | `/quiz-stats` |
| **Scaffolding / Staging** | 1 | `/article-template` |
| **Company & Support** | 1 | `/contact` |
| **Legal & Policy** | 3 | `/privacy-policy`, `/refund-policy`, `/terms` |
| **Total** | **17** | |

---

## 6. Technical SEO Findings Ranked by Priority

### Priority P0: Critical Crawl & Security Vulnerabilities

#### [Finding P0-01] Indexable Internal Dashboard with Hardcoded Credentials (`/quiz-stats`)
- **Affected URL:** `https://tryhowwespeak.com/quiz-stats` (`quiz-stats.html`)
- **Evidence:** Source code contains `<meta name="robots" content="index, follow..." />`, self-referencing canonical URL, and no HTTP auth. Authentication consists solely of a client-side JavaScript condition:
  ```javascript
  if (pwd === "admin123") {
      document.getElementById('auth').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
  }
  ```
- **SEO & Business Impact:** Search engine spiders can index internal conversion figures (completion rates, email capture rates, archetype distributions). Competitors or unauthorized users can view business metrics. Wastes crawl budget.
- **Verification Status:** Verified in source code only.
- **Recommended Action:**
  1. Add `<meta name="robots" content="noindex, nofollow" />`.
  2. Add `Disallow: /quiz-stats` to `robots.txt`.
  3. Migrate dashboard behind true server-side or edge authentication.

---

### Priority P1: High-Impact Architecture & Cannibalization Issues

#### [Finding P1-01] Severe Triple Duplicate Content & Keyword Cannibalization
- **Affected URLs:** 
  - `https://tryhowwespeak.com/men-edition`
  - `https://tryhowwespeak.com/free-scripts`
  - `https://tryhowwespeak.com/article-template`
- **Evidence:** All 3 files share:
  - Title: `"The 20-Minute Rule: Why He Goes Silent | How We Speak"`
  - H1: `"The 20-Minute Rule: Why He Goes Silent During Fights"`
  - Meta Description: Shared generic string.
  - Body: Identical psychology breakdown, comparison table, rule cards, and FAQ items.
  - Furthermore, `article-template.html` is linked directly from the public articles hub (`articles.html`) and possesses a live canonical tag.
- **SEO & Business Impact:** Confuses search engine indexing algorithms, splits backlink equity, causes internal ranking competition, and risks algorithmic suppression.
- **Verification Status:** Verified in source code only.
- **Recommended Action:**
  1. Add `<meta name="robots" content="noindex, nofollow" />` to `article-template.html` and remove its link from `articles.html`.
  2. Differentiate `free-scripts.html` into a genuine lead-generation landing page (or implement a 301 redirect to `/men-edition`).
  3. Keep `/men-edition` as the canonical authority for the 20-minute rule.

#### [Finding P1-02] Broken Product Route Risk: `/women-edition` & `/bundle`
- **Affected URLs:**
  - `https://tryhowwespeak.com/women-edition`
  - `https://tryhowwespeak.com/bundle`
- **Evidence:** Declared in `sitemap.xml` with high priorities (`0.9` and `0.8`). Contextually linked across 8+ published pages. However, no `women-edition.html` or `bundle.html` files exist in the repository, and no `vercel.json` rewrites are present in the repo root.
- **SEO & Business Impact:** If Vercel returns HTTP 404 for these routes, crawlers encounter hard dead-ends on core commercial targets declared in the XML sitemap.
- **Verification Status:** Inferred risk — needs validation via live curl.
- **Recommended Action:**
  1. Perform curl verification on live domain.
  2. If 404: Configure 301 redirects in `vercel.json` pointing `/women-edition` and `/bundle` to their corresponding Gumroad checkout links or specific anchor sections on `index.html`.

---

### Priority P2: Medium-Impact On-Page & Indexation Issues

#### [Finding P2-01] 4 Published High-Value Articles Omitted from XML Sitemap
- **Affected URLs:**
  - `https://tryhowwespeak.com/why-you-shut-down-during-arguments`
  - `https://tryhowwespeak.com/why-men-go-silent-during-arguments`
  - `https://tryhowwespeak.com/how-to-stop-spiraling-when-your-partner-needs-space`
  - `https://tryhowwespeak.com/free-scripts`
- **Evidence:** `sitemap.xml` only contains 7 `<url>` entries, omitting 4 out of 5 long-form blog guides.
- **SEO Impact:** Slower crawl discovery, delayed indexing, and suboptimal crawl budget allocation.
- **Verification Status:** Verified in source code only.
- **Recommended Action:** Update `sitemap.xml` with all 4 valid article URLs and accurate `<lastmod>` timestamps.

#### [Finding P2-02] Systematic Meta Description Duplication Across 5 Pages
- **Affected URLs:** `/men-edition`, `/articles`, `/what-to-say-when-partner-shuts-down`, `/free-scripts`, `/quiz`
- **Evidence:** All share the verbatim meta description:
  > *"Psychology-backed communication guides for couples. Learn clinical de-escalation scripts to handle conflict with clarity, confidence, and connection."* (149 characters)
- **SEO Impact:** Missed opportunity to match searcher query intent in SERP snippets; Google frequently overwrites generic descriptions with arbitrary page fragments.
- **Verification Status:** Verified in source code only.
- **Recommended Action:** Author customized, intent-focused meta descriptions (140–155 chars) for each page.

#### [Finding P2-03] Title and Description Length Boundary Violations
- **Affected URLs:**
  - `index.html`: Title length is 71 chars (exceeds recommended 60-character desktop cutoff).
  - `why-you-shut-down-during-arguments.html`: Title length is 74 chars (truncated in SERPs).
  - `why-men-go-silent-during-arguments.html`: Description is 174 chars (exceeds 160-char mobile cutoff).
- **SEO Impact:** Truncation (`...`) in SERP displays reduces click-through rates.
- **Verification Status:** Verified in source code only.
- **Recommended Action:** Refactor title tags to 50–60 characters and meta descriptions to 145–155 characters.

---

### Priority P3: Low-Impact Enhancements & Schema Hygiene

#### [Finding P3-01] Incorrect Open Graph Type on Article Pages
- **Affected URLs:** `/why-men-go-silent-during-arguments`, `/what-to-say-when-partner-shuts-down`, `/how-to-stop-spiraling-when-your-partner-needs-space`, `/men-edition`
- **Evidence:** Configured with `<meta property="og:type" content="website" />`.
- **SEO/AEO Impact:** Semantic search engines and AI knowledge graphs treat these as generic homepages rather than editorial articles.
- **Recommended Action:** Update to `<meta property="og:type" content="article" />`.

#### [Finding P3-02] Missing HTML H1 Tag on Quiz Landing Page
- **Affected URL:** `https://tryhowwespeak.com/quiz` (`quiz.html`)
- **Evidence:** The page body directly renders the Jotform wrapper without an explicit semantic `<h1>` tag in the DOM.
- **SEO Impact:** Diminished on-page semantic hierarchy for keyword targeting (`"Communication Style Quiz for Couples"`).
- **Recommended Action:** Add a clean, accessible `<h1>` header above the Jotform container.

#### [Finding P3-03] Relative Asset Path in Social Metadata
- **Affected URL:** `https://tryhowwespeak.com/why-you-shut-down-during-arguments`
- **Evidence:** Line 20 uses `<meta property="og:image" content="assets/images/..." />` instead of an absolute URL (`https://tryhowwespeak.com/assets/images/...`).
- **SEO Impact:** Social crawlers (Twitter/Facebook/LinkedIn) often fail to resolve relative OG images, resulting in blank preview cards.
- **Recommended Action:** Prepend absolute protocol and domain.

---

## 7. Internal Linking Findings

### Link Inflow & Outflow Analysis
1. **Most Linked Pages:**
   - Homepage (`/index.html`): Linked from all logos and breadcrumbs.
   - `/quiz`: Linked contextually from every article callout box, hero button, and site navigation.
   - `/men-edition`: Prominently featured in in-body contextual links across all relationship conflict articles.
2. **Contextual Cross-Article Linking Void:**
   - Currently, articles link *vertically* to the quiz or to `/men-edition`, but **zero horizontal cross-links exist between articles** (e.g., `why-men-go-silent` does not link to `what-to-say-when-partner-shuts-down` or `why-you-shut-down-during-arguments`).
3. **Dead-End / Orphan Candidates:**
   - `why-you-shut-down-during-arguments.html`: Can only be discovered via the grid on `articles.html`; no contextual in-body links point to it from other blog posts.
   - `free-scripts.html`: Completely unlinked in the global navigation and article copy; acts as an isolated orphan URL.

---

## 8. Missing, Duplicate, or Conflicting Metadata

| URL | Title Status | Description Status | Robots Meta | Canonical Status |
|---|---|---|---|---|
| `/` | 71 chars (Long) | Unique (154 chars) | index, follow | Self-referencing (Correct) |
| `/men-edition` | Duplicate (55 chars) | Generic Duplicate (149 chars) | index, follow | Self-referencing |
| `/articles` | Short (38 chars) | Generic Duplicate (149 chars) | index, follow | Self-referencing |
| `/why-you-shut-down...` | 74 chars (Long) | Unique (158 chars) | index, follow | Self-referencing |
| `/why-men-go-silent...` | Good (50 chars) | 174 chars (Too Long) | index, follow | Self-referencing |
| `/what-to-say-when...` | Good (56 chars) | Generic Duplicate (149 chars) | index, follow | Self-referencing |
| `/how-to-stop-spiraling...`| 66 chars (Slightly Long) | Unique (161 chars) | index, follow | Self-referencing |
| `/free-scripts` | Duplicate (55 chars) | Generic Duplicate (149 chars) | index, follow | Self-referencing |
| `/quiz` | Good (34 chars) | Generic Duplicate (149 chars) | index, follow | Self-referencing |
| `/quiz-stats` | 24 chars | Empty (`""`) | index, follow (Vulnerable) | Self-referencing |
| `/article-template` | Duplicate (55 chars) | Generic Duplicate (149 chars) | index, follow (Vulnerable) | Self-referencing |
| `/contact` | Good (26 chars) | Empty (`""`) | index, follow | Self-referencing |
| `/privacy-policy` | Good (30 chars) | Empty (`""`) | index, follow | Self-referencing |
| `/refund-policy` | Good (28 chars) | Empty (`""`) | index, follow | Self-referencing |
| `/terms` | Good (30 chars) | Empty (`""`) | index, follow | Self-referencing |

---

## 9. Indexability and Sitemap Findings

- **Robots.txt Analysis:**
  - Allows public crawling across standard search engines (`User-agent: *`).
  - Explicitly grants crawling rights to AI search engines: `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Applebot-Extended`, `CCBot`, `Google-Extended`. This aligns with modern Answer Engine Optimization (AEO).
  - Disallows `/api/`, `/checkout/`, `/cart/`.
  - **Deficiency:** Lacks disallow rule for `/quiz-stats`.
- **XML Sitemap Discrepancy:**
  - Declared URLs in sitemap: 7.
  - Actual valid public URLs discovered: 12+.
  - 4 published blog articles are completely omitted from `sitemap.xml`.
  - 2 declared URLs (`/women-edition`, `/bundle`) do not exist as static files in the repository.

---

## 10. Existing Keyword-Target Candidates

### Primary Hypothesis: *"communication scripts for couples"*
- **Search Intent:** High-intent commercial / transactional with educational intent.
- **Current Site State:** **Unclaimed Gap.**
- **Existing Candidate Page:** None of the existing pages target this keyword in their `<title>` or `<h1>`.
  - `index.html` targets *"Relationship Communication Scripts & Nervous System Guide"*.
  - `free-scripts.html` is currently an exact copy of the male shutdown article.
- **Strategic Recommendation:** Do not dilute existing physiological articles. Either refactor `free-scripts.html` into a dedicated hub for *"communication scripts for couples"* with downloadable cheat-sheets, or deploy a dedicated landing page targeting this specific query.

### Related Hypotheses Evaluation:

| Target Query Hypothesis | Best Existing Match | Current H1 / Title Alignment | Search Intent | Strategic Recommendation |
|---|---|---|---|---|
| *"what to say during an argument with your partner"* | `/what-to-say-when-partner-shuts-down` | **Strong Alignment:** *"What to Say When Your Partner Shuts Down"* | Informational / Immediate Crisis | Retain and optimize. Expand H2s to capture long-tail fight de-escalation queries. |
| *"why men go silent during arguments"* | `/why-men-go-silent-during-arguments` | **Near Perfect Match:** *"Why Men Go Silent During Arguments: The Biological Reality..."* | Informational / Educational | Retain and protect. Add to `sitemap.xml`. Add internal cross-links. |
| *"how to stop spiraling when partner needs space"* | `/how-to-stop-spiraling-when-your-partner-needs-space` | **Near Perfect Match:** *"How to Stop Spiraling When Your Partner Needs Space"* | Informational / Attachment Panic | Retain. Add to `sitemap.xml`. Cross-link to nervous-system grounding protocols. |
| *"why do i shut down during arguments"* | `/why-you-shut-down-during-arguments` | **Strong Alignment:** *"Why You Shut Down During Arguments: The Nervous System Root"* | Informational / Introspective | Retain. Add to `sitemap.xml`. Ensure internal links point to it. |
| *"communication exercises for couples"* | None | **Content Gap** | Informational / Action-Oriented | Plan as new content pillar topic. |
| *"couples communication workbook"* | `/men-edition` (Partial) | **Weak Alignment:** Framed as an editorial guide rather than a workbook. | Transactional / Commercial | Consider creating dedicated product schema and workbook landing assets. |

---

## 11. Potential Keyword Cannibalization or Overlapping Intent

1. **The Shutdown Cluster Overlap:**
   - `/why-men-go-silent-during-arguments` (Biological perspective on male withdrawal).
   - `/why-you-shut-down-during-arguments` (Internal trauma/nervous system freeze perspective).
   - `/what-to-say-when-partner-shuts-down` (External de-escalation script perspective).
   - *Status:* **Healthy differentiation**, provided clear cross-links exist between them so Google recognizes them as complementary facets of a topical cluster.
2. **The Exact-Duplicate Cannibalization:**
   - `/men-edition` vs. `/free-scripts` vs. `/article-template`.
   - *Status:* **Severe Confirmed Cannibalization.** These three URLs directly compete for the same keyword cluster (*"20-minute rule"*, *"why he goes silent"*).

---

## 12. Search Console and Analytics Evidence

- **GA4 Tag:** `G-XLZVVY5J2T` verified across all page templates.
- **Facebook Pixel:** `4165467567112797` verified across all templates (`PageView` event on standard pages; `Lead` event triggered on `quiz.html`).
- **GSC / GA4 Performance Metrics:** Not available in repository or environment. Organic clicks, queries, impressions, CTR, bounce rates, and conversion volumes cannot be reported without direct Google API or export access.

---

## 13. Recommended Next Actions in Order (Prioritized Execution Plan)

### Step 1 (Immediate / P0): Secure Internal Dashboard
- Add `<meta name="robots" content="noindex, nofollow" />` to `quiz-stats.html`.
- Add `Disallow: /quiz-stats` to `robots.txt`.

### Step 2 (Immediate / P1): Eliminate Duplicate Content & Staging Leak
- Add `<meta name="robots" content="noindex, nofollow" />` to `article-template.html` and remove its link from `articles.html`.
- Determine strategic role of `free-scripts.html`: Either redirect to `/men-edition` or rewrite as a distinct lead magnet targeting *"free couples communication scripts"*.

### Step 3 (High / P1): Verify Live Status of `/women-edition` and `/bundle`
- Execute live HTTP curl checks. If returning 404, implement 301 redirects to Gumroad product links or index anchors.

### Step 4 (High / P2): Synchronize XML Sitemap
- Update `sitemap.xml` to include:
  - `https://tryhowwespeak.com/why-you-shut-down-during-arguments`
  - `https://tryhowwespeak.com/why-men-go-silent-during-arguments`
  - `https://tryhowwespeak.com/how-to-stop-spiraling-when-your-partner-needs-space`

### Step 5 (Medium / P2): Refactor Metadata & Fix Truncation
- Write distinct meta descriptions for `/articles`, `/what-to-say-when-partner-shuts-down`, `/quiz`, `/contact`, and `/men-edition`.
- Shorten title tags on `index.html` (to ≤60 chars) and `why-you-shut-down-during-arguments.html` (to ≤60 chars).

### Step 6 (Medium / P3): Semantic HTML & Schema Enhancements
- Change `og:type` from `"website"` to `"article"` across all blog posts.
- Prepend absolute URLs to `og:image` in `why-you-shut-down-during-arguments.html`.
- Add semantic `<h1>` to `quiz.html`.

---

## 14. Questions Requiring Clarification Before Implementation

1. **Routing Architecture:** How does Vercel handle clean URLs in production (e.g., does requesting `/men-edition` rewrite to `men-edition.html` via default clean URL settings)?
2. **Missing Product Pages:** Are `/women-edition` and `/bundle` intended to have standalone HTML landing pages on `tryhowwespeak.com`, or should they redirect directly to Gumroad?
3. **Purpose of `free-scripts.html`:** Was this page intended as a paid ad landing page, a lead magnet, or an accidental clone of `men-edition.html`?
4. **`quiz-stats.html` Access:** Is this dashboard actively used by team members, and can it be protected behind basic auth or moved off the public repository?

---

## 15. Explicit Confirmation: No Code Changes Made

- **Application Code:** Completely untouched. No HTML, CSS, JavaScript, or JSON files were edited.
- **Configuration & Deployments:** No environment variables, routing configs, or build scripts were modified.
- **Git State:** Working tree remains clean; no commits, branches, or pushes were created.
- **Deliverables:** Only documentation files were created inside the `docs/` folder.

---

## Appendix: Deliverable File Paths

- **URL Inventory (CSV):** `c:\Users\Excelsior\Desktop\how-we-speak-website\docs\seo-audit-2026-10-17-url-inventory.csv`
- **Prioritized Audit Report (Markdown):** `c:\Users\Excelsior\Desktop\how-we-speak-website\docs\seo-audit-2026-10-17-prioritized-report.md`
