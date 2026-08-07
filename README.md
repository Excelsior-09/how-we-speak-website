# How We Speak

A premium digital education platform focused on helping couples improve communication and build healthier relationships.

**Live domain:** [tryhowwespeak.com](https://tryhowwespeak.com)  
**Contact:** admin@tryhowwespeak.com

---

## Features

- **Premium Landing Page** — Full-conversion homepage with hero, testimonials, FAQ, and story section
- **Individual Product Pages** — Dedicated pages for all 4 guides with image gallery, quantity selector, add-to-cart, and buy-now flows
- **Bundle Page** — High-converting bundle page with comparison table, testimonials, Couple Session add-on, and guarantee section
- **Cart System** — Full cart with quantity controls, promo codes, smart bundle upsell, and sticky bar
- **Checkout Page** — Stripe-ready checkout with email collection, promo codes, and order summary
- **Responsive Design** — Mobile-first, tested across all device sizes
- **SEO Optimized** — Semantic HTML5, meta tags, canonical URLs, Open Graph, structured data
- **Premium Animations** — Scroll reveal, counter animation, ticker, gallery thumbs
- **Apple-Inspired UI** — Cormorant Garamond + Inter, crimson/gold/cream palette
- **Policy Pages** — Full Refund Policy, Privacy Policy, and Terms of Service

---

## Tech Stack

- **HTML5** — Semantic, accessible markup with ARIA attributes
- **CSS3** — Custom design system via CSS variables; zero frameworks
- **JavaScript** — Vanilla ES6+; zero dependencies
- **Responsive Design** — CSS Grid, Flexbox, `clamp()` typography
- **Modular Components** — Shared nav/footer via `components.js` injection

---

## Project Structure

```
how-we-speak-website/
├── index.html                  # Main landing page
├── men-edition.html            # Men Edition product page
├── women-edition.html          # Women Edition product page
├── script-collection.html      # Script Collection product page
├── sex-talk.html               # Sex Talk Framework product page
├── bundle.html                 # Complete Bundle page (highest-converting)
├── cart.html                   # Shopping cart with promo codes
├── checkout.html               # Secure checkout (Stripe-ready)
├── refund-policy.html          # 30-day refund policy
├── privacy-policy.html         # Privacy policy (GDPR-compatible)
├── terms.html                  # Terms of service
├── assets/
│   ├── css/
│   │   └── global.css          # Complete design system — all tokens, components
│   └── js/
│       ├── main.js             # Cart engine, nav, reveal, FAQ, counters, gallery
│       └── components.js       # Shared nav + footer HTML injection
├── .gitignore
├── LICENSE                     # MIT
└── README.md
```

---

## Products & Pricing

| Product | Price | Target Audience |
|---|---|---|
| Men Edition | $37 | Women who want to understand men |
| Women Edition | $37 | Men who want to understand women |
| Complete Script Collection | $27 | Both partners — 75+ scripts |
| Sex Talk Framework | $27 | Both partners — intimacy communication |
| **Complete Bundle** | **$97** | **All 4 guides (saves $31)** |
| Couple Session (add-on) | $297 | Live 45-min session with founders |

---

## Cart & Promo System

Cart state stored in `sessionStorage` under key `hws_cart_v1`.

**Active promo codes:**
- `LAUNCH30` — 30% off
- `WELCOME10` — 10% off
- `COUPLE20` — 20% off
- `HOWWESPEAK` — 15% off

**Smart upsell:** When cart contains 2+ individual guides (subtotal < $97), a bundle upgrade prompt appears automatically.

---

## Future Integrations

### Stripe Integration
See `checkout.html` for full integration instructions. Key points:
1. Replace `.stripe-placeholder` div with `<div id="stripe-payment-element"></div>`
2. Add `<script src="https://js.stripe.com/v3/"></script>`
3. Create Payment Intent server-side and pass `clientSecret` to `stripe.elements()`
4. Replace `handleSubmit()` body with `stripe.confirmPayment()`
5. Set `return_url` to `checkout-success.html`

### Email Automation
After Stripe webhook fires, POST to your preferred platform:
- **Kit (ConvertKit):** Tag subscriber with product ID
- **MailerLite:** Add to group + trigger delivery automation
- **Brevo:** Trigger transactional email with PDF download link
- **ActiveCampaign:** Add contact + enter automation sequence

### Analytics
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>

<!-- Meta Pixel -->
<script>fbq('init', 'YOUR_PIXEL_ID');</script>
```

### CRM
Add customer data to your CRM on successful checkout via Stripe webhook or Zapier.

### Affiliate System
Integrate with Rewardful, Tapfiliate, or FirstPromoter — add tracking pixel to `checkout-success.html`.

---

## Installation

```bash
# Clone the repository
git clone https://github.com/USERNAME/how-we-speak-website.git
cd how-we-speak-website

# Open in browser — no build step required
open index.html

# Or serve locally with any static server
npx serve .
# or
python3 -m http.server 8080
```

No npm, no webpack, no build process. Open `index.html` and it works.

---

## Deployment

This is a static HTML/CSS/JS site. Deploy to any static host:

- **Netlify:** Drag & drop the folder to [netlify.com/drop](https://netlify.com/drop)
- **Vercel:** `vercel --prod`
- **GitHub Pages:** Enable in Settings → Pages → main branch
- **Cloudflare Pages:** Connect repo, deploy on push

After deploy, point `tryhowwespeak.com` DNS to your hosting provider.

---

## Brand Assets

| Asset | URL |
|---|---|
| Logo | `https://i.ibb.co/hR2KXFd4/...` |
| Hero photo | `https://i.ibb.co/fdbkn9P9/...` |
| Men Edition cover | `https://i.ibb.co/rffWKyGB/...` |
| Women Edition cover | `https://i.ibb.co/j9fk1Qq0/...` |
| Script Collection cover | `https://i.ibb.co/KxgzQmtY/...` |
| Sex Talk Framework cover | `https://i.ibb.co/dJpxv1hb/...` |
| Bundle mockup | `https://i.ibb.co/84LyRsYY/...` |

Full image registry in `assets/js/main.js` → `HWS.IMAGES`.

---

## Design Tokens

```css
--crimson:    #C41E3A  /* primary */
--gold:       #C9A84C  /* accent  */
--cream:      #F5F3F0  /* section bg */
--warm-white: #FAFAF8  /* page bg */
--charcoal:   #1A1A1A  /* dark text / footer */
--gray:       #6B6B6B  /* secondary text */
```

Typography: `Cormorant Garamond` (headings) + `Inter` (body)

---

## Developer Notes

- All internal links use relative paths (`index.html`, `bundle.html`) — works with or without a web server
- Cart JS (`Cart` object) is defined in `main.js` and aliased globally as `window.Cart`
- Product registry is `window.HWS.PRODUCTS` — update prices here to propagate everywhere
- Nav and footer are injected by `components.js` via `<div id="hws-nav">` and `<div id="hws-footer">` slots
- Scroll reveal uses `IntersectionObserver` on `.reveal` elements — add class to any element to animate in
- FAQ accordion uses `aria-expanded` + `aria-controls` for accessibility

---

*Built by Anas Ziraoui & Ilayda Demir · How We Speak · 2026*
