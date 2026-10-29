// ==============================================================================
// HOW WE SPEAK — CENTRALIZED PRICING & PRODUCT CATALOG
// Source of truth for products, bundles, memberships, and checkout routing.
// ==============================================================================

(function (window) {
  'use strict';

  var HWS_CATALOG = {
    currency: 'USD',
    currencySymbol: '$',

    // Verified individual products & resources
    products: [
      {
        id: 'bundle',
        slug: 'howwespeak-bundle',
        title: 'The Complete Bundle',
        tag: 'Complete Collection',
        badge: 'Best Value',
        category: 'bundles',
        categoryLabel: 'Digital Bundle',
        format: 'All 4 eBooks + Web App Access',
        price: 97,
        wasPrice: 128,
        savings: 31,
        savingsPercent: 24,
        description: 'All 4 Guides + Practice workspace access. Comprehensive blueprint for understanding each other and ending destructive cycles.',
        outcomes: [
          'All 4 complete guides in digital PDF format',
          '75+ actionable conversation scripts',
          'Full access to practice workspace with unlimited AI rehearsals',
          'Immediate, lifetime download access on all personal devices'
        ],
        covers: {
          front: 'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png',
          back: 'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png'
        },
        provider: 'gumroad',
        checkoutUrl: 'https://themindly.gumroad.com/l/howwespeak-bundle',
        displayOrder: 1,
        featured: true
      },
      {
        id: 'men-edition',
        slug: 'how-we-speak-men-edition',
        title: 'Understanding How Men Think',
        tag: 'Men Edition',
        badge: 'For Women',
        category: 'ebooks',
        categoryLabel: 'Relationship Guide',
        format: 'Digital PDF + 30-Day Action Plan',
        price: 37,
        wasPrice: null,
        description: 'Written for women. Explains why men go silent during conflict, how they process emotional overwhelm, and what they need to open up.',
        outcomes: [
          'Why he withdraws during arguments and how to break the freeze cycle',
          'How to ask for support he will actually give without resentment',
          'Word-for-word phrases that open him up vs. shut him down'
        ],
        covers: {
          front: 'https://i.ibb.co/rffWKyGB/Chat-GPT-Image-Aug-5-2026-07-50-17-PM.png',
          back: 'https://i.ibb.co/1GK88Vnm/Chat-GPT-Image-Aug-5-2026-07-55-13-PM.png'
        },
        provider: 'gumroad',
        checkoutUrl: 'https://themindly.gumroad.com/l/How-We-Speak-Men-Edition?wanted=true',
        displayOrder: 2,
        featured: false
      },
      {
        id: 'women-edition',
        slug: 'howwespeak-women',
        title: 'Understanding How Women Think',
        tag: 'Women Edition',
        badge: 'For Men',
        category: 'ebooks',
        categoryLabel: 'Relationship Guide',
        format: 'Digital PDF + 30-Day Action Plan',
        price: 37,
        wasPrice: null,
        description: 'Written for men. Explains why old arguments resurface, what emotional support actually means to her, and what she needs to feel secure.',
        outcomes: [
          'Why unresolved arguments resurface and how to repair them',
          'What she hears vs. what you actually said in heated moments',
          'How to make her feel genuinely understood and emotionally held'
        ],
        covers: {
          front: 'https://i.ibb.co/j9fk1Qq0/Chat-GPT-Image-Aug-6-2026-10-23-22-AM.png',
          back: 'https://i.ibb.co/b51mxMRh/Chat-GPT-Image-Aug-7-2026-12-21-33-AM.png'
        },
        provider: 'gumroad',
        checkoutUrl: 'https://themindly.gumroad.com/l/howwespeak-women?wanted=true',
        displayOrder: 3,
        featured: false
      },
      {
        id: 'script-collection',
        slug: 'howwespeak-scripts',
        title: "The Words You've Been Searching For",
        tag: 'Script Collection',
        badge: '75+ Scripts',
        category: 'scripts',
        categoryLabel: 'Script Bank',
        format: 'Digital PDF + Quick Reference Bank',
        price: 27,
        wasPrice: null,
        description: '75+ ready-to-use conversation scripts for every sensitive moment — from delicate boundaries to meaningful reconnection.',
        outcomes: [
          'Starting difficult conversations without activating defensive walls',
          'Apologizing in a way that truly lands and rebuilds trust',
          'Expressing firm personal limits without pushing your partner away'
        ],
        covers: {
          front: 'https://i.ibb.co/KxgzQmtY/Chat-GPT-Image-Aug-6-2026-11-17-13-AM.png',
          back: 'https://i.ibb.co/My7dwTJH/Chat-GPT-Image-Aug-6-2026-11-26-29-AM.png'
        },
        provider: 'gumroad',
        checkoutUrl: 'https://themindly.gumroad.com/l/howwespeak-scripts?wanted=true',
        displayOrder: 4,
        featured: false
      },
      {
        id: 'sex-talk',
        slug: 'howwespeak-sextalk',
        title: 'Intimacy Starts With a Conversation',
        tag: 'Sex Talk Framework',
        badge: 'For Couples',
        category: 'ebooks',
        categoryLabel: 'Intimacy Guide',
        format: 'Digital PDF + Discussion Protocols',
        price: 27,
        wasPrice: null,
        description: 'A respectful, practical guide to communicating about physical and emotional intimacy without shame, awkwardness, or guesswork.',
        outcomes: [
          'Expressing intimate desires comfortably and without embarrassment',
          'Navigating mismatched desire or libido with genuine empathy',
          'Building the emotional safety that deepens physical connection'
        ],
        covers: {
          front: 'https://i.ibb.co/dJpxv1hb/Chat-GPT-Image-Aug-6-2026-11-36-39-AM.png',
          back: 'https://i.ibb.co/TqhrG4kK/Chat-GPT-Image-Aug-7-2026-12-26-10-AM.png'
        },
        provider: 'gumroad',
        checkoutUrl: 'https://themindly.gumroad.com/l/howwespeak-sextalk?wanted=true',
        displayOrder: 5,
        featured: false
      },
      {
        id: 'free-scripts',
        slug: 'howwespeak-free',
        title: '10 Free Essential Scripts',
        tag: 'Starter Guide',
        badge: 'Free Guide',
        category: 'scripts',
        categoryLabel: 'Starter PDF',
        format: 'Free Instant Digital Download',
        price: 0,
        wasPrice: null,
        description: 'A focused starter collection of 10 vital conversation phrases to de-escalate tension and prevent argument spirals.',
        outcomes: [
          'Immediate de-escalation phrases for intense moments',
          'How to ask for space without triggering abandonment fears',
          'Gentle reconnection check-ins after conflict'
        ],
        covers: {
          front: 'https://i.ibb.co/TBjpfwj1/Chat-GPT-Image-Aug-5-2026-08-04-08-PM.png',
          back: 'https://i.ibb.co/TBjpfwj1/Chat-GPT-Image-Aug-5-2026-08-04-08-PM.png'
        },
        provider: 'gumroad',
        checkoutUrl: 'https://themindly.gumroad.com/l/howwespeak-free?wanted=true',
        displayOrder: 6,
        featured: false
      }
    ],

    // Featured Bundle Data
    bundle: {
      id: 'bundle',
      name: 'The Complete Bundle',
      headline: 'Everything You Need, in One Collection.',
      subheadline: 'Explore curated resources designed to help you put better communication into practice.',
      forWho: 'Couples and partners wanting the entire communication framework with both perspectives, 75+ scripts, and practice app access.',
      individualItems: [
        { name: 'How We Speak: Men Edition', price: 37 },
        { name: 'How We Speak: Women Edition', price: 37 },
        { name: 'Complete Script Collection (75+ scripts)', price: 27 },
        { name: 'Sex Talk Framework (Intimacy communication)', price: 27 }
      ],
      totalIndividualPrice: 128,
      bundlePrice: 97,
      savingsAmount: 31,
      savingsPercentage: 24,
      cover: 'https://i.ibb.co/84LyRsYY/Chat-GPT-Image-Aug-7-2026-12-18-35-AM.png',
      checkoutUrl: 'https://themindly.gumroad.com/l/howwespeak-bundle',
      ctaText: 'Get The Complete Bundle ($97)'
    },

    // Verified Membership Plans
    memberships: [
      {
        id: 'starter',
        name: 'Free Starter',
        cadence: 'Forever Free',
        price: 0,
        priceDisplay: '$0',
        period: 'free forever',
        description: 'Explore the foundations of relational psychology and test the AI conversation rehearsal tool.',
        badge: null,
        isPopular: false,
        features: [
          'Full Communication Quiz & Attachment Archetype analysis',
          '3 Individual conversation rehearsals with clinical models',
          '1 Couples joint reflection exercise in Practice Workspace',
          '10 Free Essential Scripts PDF',
          '10 daily AI analysis interactions'
        ],
        ctaText: 'Start Free Practice',
        ctaUrl: '/app/rehearse',
        isExternal: false
      },
      {
        id: 'bundle_lifetime',
        name: 'Complete Bundle',
        cadence: 'One-Time Payment',
        price: 97,
        priceDisplay: '$97',
        period: 'one-time / lifetime access',
        description: 'Complete digital guide library plus unlimited rehearsal access in the interactive workspace.',
        badge: 'Best Value',
        isPopular: true,
        features: [
          'All 4 Digital Guides (Men Edition, Women Edition, Scripts, Sex Talk)',
          'Lifetime access and future guide updates included',
          'Practice Workspace with unlimited AI conversation rehearsals',
          'Elevated daily & monthly AI limits (20/day, 200/month)',
          'Private Partner Invitation pairing & shared reflections',
          '30-day no-friction money-back guarantee'
        ],
        ctaText: 'Get Complete Bundle ($97)',
        ctaUrl: 'https://themindly.gumroad.com/l/howwespeak-bundle',
        isExternal: true
      },
      {
        id: 'workspace_pro',
        name: 'Workspace Pro',
        cadence: 'Monthly Membership',
        price: 19,
        priceDisplay: '$19',
        period: 'per month, billed monthly',
        description: 'Ongoing interactive membership for couples dedicated to active communication mastery and Mira AI dialogue analysis.',
        badge: 'Interactive Pro',
        isPopular: false,
        features: [
          'Unlimited AI conversation rehearsals across all communication channels',
          'Mira AI: Continuous relationship analysis & personal coaching',
          'Couples Workspace: Real-time dual reflections & joint neutral syntheses',
          'Interactive in-app script library with situational search',
          'Monthly drops of targeted scripts and conflict frameworks',
          'Automatic renewal; cancel anytime in account settings with 1 click'
        ],
        ctaText: 'Join Workspace Pro ($19/mo)',
        ctaUrl: '/app?auth=signup&plan=pro',
        isExternal: false
      }
    ],

    // Real Blog Articles for Educational Bridge
    articles: [
      {
        title: 'Why You Shut Down During Arguments',
        tag: 'Conflict Resolution',
        readTime: '7 min read',
        image: '/assets/images/Understanding_emotional_shutdown…_2K_20260926163339.jpg',
        url: 'why-you-shut-down-during-arguments.html',
        snippet: 'Shutting down during arguments isn’t an attitude problem—it is an autonomic nervous system freeze. Learn why you go quiet and the exact scripts to unfreeze.',
        relatedProduct: 'men-edition',
        relatedProductLabel: 'Men Edition Guide'
      },
      {
        title: 'How to Stop Spiraling When Your Partner Needs Space',
        tag: 'Anxious Attachment',
        readTime: '4 min read',
        image: '/assets/images/Anxious_attachment.jpg',
        url: 'how-to-stop-spiraling-when-your-partner-needs-space.html',
        snippet: 'For anyone with an anxious attachment style, few phrases trigger panic faster than being asked for space. Learn grounding practices and scripts for reconnection.',
        relatedProduct: 'bundle',
        relatedProductLabel: 'The Complete Bundle'
      },
      {
        title: 'What to Say When Your Partner Shuts Down',
        tag: 'Conflict Resolution',
        readTime: '5 min read',
        image: '/assets/images/Article2.jpg',
        url: 'what-to-say-when-partner-shuts-down.html',
        snippet: 'When an argument spirals and your partner says "I don\'t want to talk about this", their nervous system is flooded. Learn the clinical de-escalation scripts.',
        relatedProduct: 'script-collection',
        relatedProductLabel: '75+ Script Collection'
      }
    ],

    // Verified FAQs
    faqs: [
      {
        id: 'faq-1',
        question: 'What is TryHowWeSpeak?',
        answer: 'TryHowWeSpeak is a psychology-grounded relationship communication platform. We combine practical eBooks, word-for-word scripts, and an AI-powered conversation rehearsal web app to help couples and individuals de-escalate conflict, understand each other’s unspoken needs, and replace defensiveness with genuine emotional connection.'
      },
      {
        id: 'faq-2',
        question: 'What is included when I purchase an eBook or Guide?',
        answer: 'Every guide purchase includes an immediate, DRM-free digital PDF download formatted for reading on any phone, tablet, computer, or e-reader. You also receive structured reflection exercises, concrete conversation starters, and a 30-day action plan for implementation.'
      },
      {
        id: 'faq-3',
        question: 'How do I receive my digital products?',
        answer: 'Immediately upon completing your purchase, your download link is delivered to the email address you provide at checkout. You can read online, download the PDF files permanently to your devices, and print copies for personal use.'
      },
      {
        id: 'faq-4',
        question: 'What is the difference between an eBook and a membership?',
        answer: 'Our eBooks (such as the Men Edition or Women Edition) are one-time purchase downloadable guides that you own permanently. The Complete Bundle provides all 4 guides for life, plus rehearsal practice access. The Workspace Pro membership provides ongoing, interactive access to our web application, including unlimited AI conversation rehearsals, Mira AI deep dialogue analysis, and live couples collaboration tools.'
      },
      {
        id: 'faq-5',
        question: 'What is included in the Workspace Pro membership?',
        answer: 'Workspace Pro includes unlimited AI conversation rehearsals with customized openings and follow-up de-escalation scripts, full access to Mira AI (our relational dialogue analysis companion), real-time couples pairing with neutral joint synthesis, and continuous new monthly script releases.'
      },
      {
        id: 'faq-6',
        question: 'Does the membership renew automatically, and how do I cancel?',
        answer: 'Yes, the Workspace Pro membership renews monthly to maintain continuous app and AI access. You can cancel anytime with a single click inside your account settings. When canceled, you will continue to have full access until the end of your current billing period, with no cancellation fees or lock-in.'
      },
      {
        id: 'faq-7',
        question: 'Can I request a refund?',
        answer: 'Yes. We provide a 30-day, full money-back guarantee on all digital guides and the Complete Bundle. If our resources do not help you communicate more effectively with your partner within 30 days, simply email admin@tryhowwespeak.com with your purchase email. We process refunds within 3–5 business days with no hassle.'
      },
      {
        id: 'faq-8',
        question: 'How does Mira AI work, and what can it help with?',
        answer: 'Mira AI is a specialized relationship communication companion built on clinical frameworks (including Gottman de-escalation and attachment theory). It helps you analyze conversations that upset you, discover what your partner may be feeling beneath their words, and rehearse constructive phrasing before bringing up difficult topics.'
      },
      {
        id: 'faq-9',
        question: 'Is TryHowWeSpeak a substitute for professional therapy or counseling?',
        answer: 'No. TryHowWeSpeak provides educational resources, communication frameworks, and rehearsal tools designed for self-improvement and relational communication. Our guides and AI tools are not medical devices, healthcare services, psychiatric evaluations, or substitutes for licensed individual or couples psychotherapy.'
      }
    ]
  };

  window.HWS_CATALOG = HWS_CATALOG;
})(window);

