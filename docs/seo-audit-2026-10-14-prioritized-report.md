# SEO Audit – Prioritized Report
**Site:** https://tryhowwespeak.com  
**Audit Date:** 2026-10-14  
**Auditor:** Antigravity SEO Agent  
**Branch / Commit:** `main` / `f3e3169` (working tree: clean)

---

## 1. Executive Summary

The How We Speak website is a static HTML site (~15 pages) served on Vercel. All pages are technically indexable and all have canonical tags. The most consequential issues identified are:

1. **Three pages share identical body content, H1, and title** (`men-edition.html`, `free-scripts.html`, `article-template.html`) — a confirmed duplicate-content risk.
2. **Two sitemap-declared product URLs (`/women-edition`, `/bundle`) have no corresponding HTML file** in the repository — likely redirects or external hosting; live HTTP status not verified.
3. **`/quiz-stats`** — an internal analytics dashboard—is publicly indexable and has no `noindex` directive.
4. **`/article-template`** — a placeholder page — is publicly indexable, linked from the articles hub, and contains live canonical markup pointing to the live domain.
5. **Sitemap is incomplete**: 4 published article pages are missing (`why-you-shut-down-during-arguments`, `why-men-go-silent-during-arguments`, `how-to-stop-spiraling-when-your-partner-needs-space`, `free-scripts`).
6. **Five article pages share the exact same generic meta description**.
7. **Quiz content is entirely JS-rendered** (Jotform embed) — not crawlable without JavaScript execution.

No Google Search Console or Analytics data was available. All findings are source-code verified or labeled as inferred risks.

---

## 2. Scope, Audit Date, and Sources Accessed

| Item | Detail |
|---|---|
| Audit date | 2026-10-14 |
| Repository | `c:\Users\Excelsior\Desktop\how-we-speak-website` |
| Git remote | https://github.com/Excelsior-09/how-we-speak-website |
| Branch | `main` |
| HEAD commit | `f3e3169` |
| Framework | Static HTML + JavaScript (no SSR/SSG framework) |
| Deployment | Vercel (inferred from README and repo structure) |
| Sources accessed | Local file system (all 15 HTML files), sitemap.xml, robots.txt, package.json |
| Sources NOT accessed | Google Search Console, Google Analytics, Vercel dashboard, live HTTP responses, Google SERP |

---

## 3. Access Limitations and Unverified Data

- **HTTP status codes**: Not verified. All URL statuses (200, 301, 404) for `/women-edition`, `/bundle`, and live pages are labeled "not verified."
- **Google indexing status**: Not checked — no Search Console access.
- **Organic traffic, rankings, CTR**: Not available — no Analytics or Search Console export.
- **Rendering**: Quiz page uses a third-party JS embed; crawler behavior not simulated.
- **Live crawl**: Not performed. All findings are derived from source code.

---

## 4. Repository and Git Checkpoint

- **Directory:** `c:\Users\Excelsior\Desktop\how-we-speak-website`
- **Branch:** `main`
- **HEAD:** `f3e3169` — "Fix broken links and remove missing ebook refence quiz styles"
- **Working tree status at audit start:** Clean (nothing to commit)

---

## 5. URL Inventory Summary by Page Type

| Page Type | Count | Notes |
|---|---|---|
| Homepage | 1 | index.html |
| Product / lead articles | 1 | men-edition.html |
| Articles (published) | 4 | why-you-shut-down, why-men-go-silent, what-to-say-when-partner-shuts-down, how-to-stop-spiraling |
| Article hub | 1 | articles.html |
| Free resource / lead magnet | 1 | free-scripts.html |
| Quiz | 1 | quiz.html |
| Internal dashboard | 1 | quiz-stats.html |
| Policy pages | 3 | terms, refund-policy, privacy-policy |
| Contact | 1 | contact.html |
| Template (orphaned duplicate) | 1 | article-template.html |
| Product pages referenced but file missing | 2 | /women-edition, /bundle |
| **Total discoverable from source** | **17** | |

---

## 6. Technical SEO Findings Ranked by Priority

### P1 — High

**F-01: Confirmed duplicate content — 3 pages, identical H1, title, body**
- **Affected:** `/men-edition`, `/free-scripts`, `/article-template`
- **Evidence:** Source code verified — identical `<title>`, `<h1>`, and body content across all three files.
- **Impact:** Google may filter duplicate pages, splitting link equity and potentially deindexing weaker copies.
- **Action:** Either differentiate content on each page, or apply `noindex` + remove from internal navigation on `free-scripts.html` and `article-template.html` if they serve no distinct purpose.
- **Confidence:** High (source verified)

**F-02: /article-template is publicly indexable and linked from the article hub**
- **Affected:** `article-template.html` → `https://tryhowwespeak.com/article-template`
- **Evidence:** Linked from `articles.html`; canonical points to live domain; no noindex.
- **Impact:** Confusing to searchers; cannibalizes men-edition content; wasted crawl budget.
- **Action:** Add `<meta name="robots" content="noindex">` and remove internal link from `articles.html`.
- **Confidence:** High (source verified)

**F-03: /quiz-stats is publicly indexable with no noindex**
- **Affected:** `quiz-stats.html` → `https://tryhowwespeak.com/quiz-stats`
- **Evidence:** Source code — no robots meta tag, no noindex; canonical present pointing to live domain.
- **Impact:** Internal admin dashboard exposed to search engines; possible data leakage; wastes crawl budget.
- **Action:** Add `<meta name="robots" content="noindex, nofollow">` immediately.
- **Confidence:** High (source verified)

---

### P2 — Medium

**F-04: Sitemap missing 4 published article pages**
- **Affected:** sitemap.xml missing entries for:
  - `why-you-shut-down-during-arguments`
  - `why-men-go-silent-during-arguments`
  - `how-to-stop-spiraling-when-your-partner-needs-space`
  - `free-scripts`
- **Evidence:** Verified by comparing all HTML canonical URLs against sitemap.xml entries.
- **Impact:** Search engines may take longer to discover and recrawl these pages.
- **Action:** Add all four URLs to sitemap.xml with accurate `<lastmod>` dates.
- **Confidence:** High (source verified)

**F-05: Generic meta descriptions shared across 5+ pages**
- **Affected:** `men-edition.html`, `free-scripts.html`, `article-template.html`, `articles.html`, `quiz.html`, `what-to-say-when-partner-shuts-down.html`
- **Shared text:** "Psychology-backed communication guides for couples. Learn clinical de-escalation scripts to handle conflict with clarity, confidence, and connection."
- **Evidence:** Source code verified.
- **Impact:** Google may rewrite descriptions or show them incorrectly in SERPs; reduces click-through differentiation.
- **Action:** Write unique, page-specific meta descriptions for each affected page.
- **Confidence:** High (source verified)

**F-06: /women-edition and /bundle declared in sitemap but no HTML file in repo**
- **Affected:** `sitemap.xml` entries for `/women-edition` and `/bundle`
- **Evidence:** No `women-edition.html` or `bundle.html` file exists in the repository.
- **Impact:** If these are 404s or redirect to Gumroad, sitemap entries may be flagged in Search Console. Additionally, 8+ internal contextual links point to `/bundle` and 2+ to `/women-edition`.
- **Action:** Day 2 — verify live HTTP status with curl. If 404: remove from sitemap, fix internal links to point to Gumroad URLs or create redirect rules.
- **Confidence:** Inferred risk — live HTTP status not verified

**F-07: Meta descriptions over 160 chars on 2 article pages**
- **Affected:** `why-men-go-silent-during-arguments.html` (174 chars), `why-you-shut-down-during-arguments.html` (158 chars)
- **Evidence:** Source code character count.
- **Action:** Trim to ≤155 chars.
- **Confidence:** High (source verified)

**F-08: Title tag over 60 chars on 2 pages**
- **Affected:** `index.html` (71 chars), `why-you-shut-down-during-arguments.html` (74 chars)
- **Evidence:** Source code character count.
- **Action:** Revise titles to ≤60 chars while preserving target keywords.
- **Confidence:** High (source verified)

---

### P3 — Low

**F-09: og:type="website" on article pages (should be "article")**
- **Affected:** `men-edition.html`, `why-men-go-silent-during-arguments.html`, `what-to-say-when-partner-shuts-down.html`, `how-to-stop-spiraling-when-your-partner-needs-space.html`
- **Evidence:** Source code — these article pages use `og:type="website"` rather than `og:type="article"`.
- **Impact:** Reduced social/AI-crawler signal; potential missed rich-pin opportunities.
- **Action:** Change to `og:type="article"`.
- **Confidence:** High (source verified)

**F-10: og:image on why-you-shut-down uses a relative path**
- **Affected:** `why-you-shut-down-during-arguments.html` line 20: `"assets/images/..."` (relative)
- **Evidence:** Source code.
- **Impact:** Social crawlers may not resolve the image; structured data uses same relative path.
- **Action:** Use absolute URL: `https://tryhowwespeak.com/assets/images/...`
- **Confidence:** High (source verified)

**F-11: quiz.html has no H1**
- **Affected:** `quiz.html`
- **Evidence:** No `<h1>` tag found in source.
- **Impact:** Minor accessibility and SEO signal gap; quiz content is Jotform-embedded so a surrounding H1 would help anchor the page.
- **Action:** Add an H1 before the Jotform embed container.
- **Confidence:** High (source verified)

**F-12: llms.txt exists but content not verified for accuracy**
- **Affected:** `llms.txt`
- **Evidence:** File present; content not read in this audit.
- **Action:** Day 2 — verify llms.txt content accurately reflects site purpose and products without fabricating claims.
- **Confidence:** Not checked

---

## 7. Internal Linking Findings

**Internal link map (verified from source)**

| Source Page | Target | Raw href | File exists? |
|---|---|---|---|
| index.html | Men Edition Guide | `/men-edition` | Yes (men-edition.html) — inferred |
| index.html | Women Edition Guide | `/women-edition` | **No HTML file found** |
| index.html | Complete Script Bundle | `/bundle` | **No HTML file found** |
| index.html | Communication Style Assessment | `/quiz` | Yes (quiz.html) |
| index.html | Articles | `articles.html` | Yes |
| articles.html | article-template.html | `article-template.html` | Yes — but should be removed |
| articles.html | All 4 published articles | relative `.html` links | Yes |
| why-men-go-silent | Men Edition | `/men-edition` | Yes |
| why-men-go-silent | Quiz | `/quiz` | Yes |
| why-men-go-silent | Bundle | `/bundle` | No HTML file |
| what-to-say-when… | Men Edition | `/men-edition` | Yes |
| what-to-say-when… | Bundle | `/bundle` | No HTML file |
| how-to-stop-spiraling | Women Edition | `/women-edition` | No HTML file |
| how-to-stop-spiraling | Bundle | `/bundle` | No HTML file |
| men-edition.html | Self-link | `/men-edition` | Internal self-link — low risk |
| free-scripts.html | Men Edition | `/men-edition` | Yes |
| free-scripts.html | Bundle | `/bundle` | No HTML file |

**Pages with no detected internal inlinks from other HTML files:**
- `why-you-shut-down-during-arguments.html` — only reachable from `articles.html` grid
- `quiz-stats.html` — not linked from any page (potential orphan)
- `contact.html` — linked via footer (injected by components.js, not auditable from source)
- Policy pages — likely footer-only (components.js)

**Opportunities:**
- No article currently links directly to another article (no cross-article internal links).
- `free-scripts.html` could be consolidated into a distinct free-download page with its own title, H1, and description rather than duplicating men-edition content.

---

## 8. Missing, Duplicate, or Conflicting Metadata

| Issue | Affected Pages | Severity |
|---|---|---|
| Duplicate title + H1 + body | men-edition, free-scripts, article-template | P1 |
| Generic shared meta description (identical text) | articles, quiz, men-edition, free-scripts, article-template, what-to-say-when-partner-shuts-down | P2 |
| Title too long (>60 chars) | index, why-you-shut-down | P2 |
| Meta description too long (>160 chars) | why-men-go-silent, why-you-shut-down | P2 |
| Missing meta description | contact, privacy-policy, refund-policy, terms, quiz-stats | P3 |
| og:type should be "article" not "website" | men-edition, why-men-go-silent, what-to-say-when, how-to-stop-spiraling | P3 |
| Relative og:image path | why-you-shut-down | P3 |

---

## 9. Indexability and Sitemap Findings

**sitemap.xml declared URLs (7 total):**
1. `https://tryhowwespeak.com/` ✓
2. `https://tryhowwespeak.com/men-edition` ✓
3. `https://tryhowwespeak.com/women-edition` **⚠ No HTML file in repo**
4. `https://tryhowwespeak.com/bundle` **⚠ No HTML file in repo**
5. `https://tryhowwespeak.com/quiz` ✓
6. `https://tryhowwespeak.com/articles` ✓
7. `https://tryhowwespeak.com/what-to-say-when-partner-shuts-down` ✓

**Pages NOT in sitemap but should be:**
- `/why-you-shut-down-during-arguments`
- `/why-men-go-silent-during-arguments`
- `/how-to-stop-spiraling-when-your-partner-needs-space`
- `/free-scripts` (only after content differentiation from P1 fix)

**Pages that should NOT be in sitemap:**
- `/quiz-stats` (internal dashboard)
- `/article-template` (duplicate template)
- `/article-template` is currently linked from `articles.html` — high inlink visibility despite being a duplicate

**robots.txt assessment:**
- Allows all major search crawlers and AI agents (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Applebot-Extended).
- Correctly disallows `/api/`, `/checkout/`, `/cart/`.
- Sitemap declaration is correct.
- `quiz-stats.html` is not disallowed — gap confirmed.

---

## 10. Existing Keyword-Target Candidates

| Keyword Hypothesis | Best Matching Page | Title | H1 | Intent Served | Recommendation |
|---|---|---|---|---|---|
| communication scripts for couples | **No existing page** | — | — | Commercial / transactional | Gap — no page directly targets this phrase. Closest: `free-scripts.html` (if differentiated). |
| what to say during an argument with your partner | `what-to-say-when-partner-shuts-down.html` | "What to Say When Your Partner Shuts Down" | "What to Say When Your Partner Shuts Down: The Nervous System Script for De-Escalating Conflict" | Informational ✓ | Retain; optimize meta description; add missing sitemap entry |
| what to say after a fight with your partner | None found | — | — | Informational | Gap |
| how to express feelings without blaming your partner | None found | — | — | Informational | Gap |
| how to communicate when your partner shuts down | `what-to-say-when-partner-shuts-down.html` and `why-you-shut-down-during-arguments.html` | Partial overlap | — | Informational | Potential overlap; differentiate angle before creating new page |
| communication exercises for couples | None found | — | — | Informational | Gap |
| couples communication workbook | `men-edition.html` (partial) | — | — | Commercial | No direct targeting; opportunity in product page optimization |

---

## 11. Potential Keyword Cannibalization or Overlapping Search Intent

The following groups of pages have overlapping search topics and may cannibalize one another or confuse search engine intent assignment:

**Group A — Partner shutdown / male withdrawal:**
- `men-edition.html` (The 20-Minute Rule: Why He Goes Silent)
- `why-men-go-silent-during-arguments.html` (Why Men Go Silent During Arguments)
- `what-to-say-when-partner-shuts-down.html` (What to Say When Your Partner Shuts Down)
- `free-scripts.html` (exact duplicate of men-edition.html)
- Assessment: `why-men-go-silent` and `what-to-say-when-partner-shuts-down` are well-differentiated by angle (cause vs. response). `men-edition.html` and `free-scripts.html` are identical — this is confirmed cannibalization.

**Group B — Emotional shutdown (self):**
- `why-you-shut-down-during-arguments.html` — distinct angle (self-shutdown, not partner's shutdown)
- Well-differentiated from Group A; low overlap risk.

---

## 12. Search Console and Analytics Evidence

**Not available.** No Search Console export or Analytics data was provided or accessed. All query, click, impression, CTR, and position data is absent. The following cannot be determined without this data:
- Whether any of these pages currently rank for target queries.
- Which pages receive organic sessions.
- Whether Google has indexed all or some pages.

**Recommended Day 2 step:** Connect Search Console and pull an index coverage report + top queries per URL.

---

## 13. Recommended Next Actions in Order

1. **(Day 2 — Immediate)** Verify live HTTP status of `/women-edition` and `/bundle` using `curl -I`. If 404, remove from sitemap and update internal links.
2. **(Day 2 — Immediate)** Add `<meta name="robots" content="noindex, nofollow">` to `quiz-stats.html`.
3. **(Day 2 — Immediate)** Add `<meta name="robots" content="noindex">` to `article-template.html` and remove the link from `articles.html`.
4. **(Day 2 — High)** Differentiate `free-scripts.html` with its own unique title, H1, meta description, and body content (distinct from `men-edition.html`), or redirect it to the free Gumroad download.
5. **(Day 2 — High)** Write unique meta descriptions for all 6 pages currently sharing the generic description.
6. **(Day 3 — Medium)** Add the 4 missing article URLs to `sitemap.xml` with accurate `<lastmod>` dates.
7. **(Day 3 — Medium)** Correct `og:type` from `"website"` to `"article"` on all article pages.
8. **(Day 3 — Medium)** Fix the relative `og:image` path on `why-you-shut-down-during-arguments.html`.
9. **(Day 3 — Medium)** Add an `<h1>` to `quiz.html`.
10. **(Day 4 — Keyword)** Validate whether `/communication-scripts-for-couples` fills a real gap not served by existing pages before creating it. Evidence required: Search Console query data or confirmed search demand.

---

## 14. Questions That Must Be Answered Before Implementation

1. Do `/women-edition` and `/bundle` resolve to 200, 301, or 404 live? Where do they lead? (Must verify Day 2 before editing sitemap.)
2. Is `free-scripts.html` intended to be a distinct lead-magnet page or a duplicate of `men-edition.html`? (Determines whether to differentiate or redirect/remove.)
3. Is there a Vercel routing config (`vercel.json` or `_redirects`) that maps these root-relative paths? (Not found in repo root — must check Vercel dashboard.)
4. What is the intended purpose of `quiz-stats.html`? Should it be protected behind authentication rather than just hidden from crawlers?
5. Is `article-template.html` in active use or a scaffolding file? If scaffolding, it should be excluded from the repo's public directory or given a noindex directive.

---

## 15. Confirmation — No Application Code or Website Configuration Changed

✅ **No HTML, CSS, JavaScript, routing, metadata, sitemap, robots.txt, structured data, analytics, environment variables, or deployment settings were modified during this audit.**

✅ **No commits, pushes, merges, or deployments were performed.**

✅ **Git status after audit:** Working tree is clean. New files created: `docs/seo-audit-2026-10-14-url-inventory.csv` and `docs/seo-audit-2026-10-14-prioritized-report.md` (documentation only, not application files).

---

## Appendix A — Deliverable File Locations

| Deliverable | Path |
|---|---|
| URL Inventory (CSV) | `c:\Users\Excelsior\Desktop\how-we-speak-website\docs\seo-audit-2026-10-14-url-inventory.csv` |
| Prioritized Report (Markdown) | `c:\Users\Excelsior\Desktop\how-we-speak-website\docs\seo-audit-2026-10-14-prioritized-report.md` |
