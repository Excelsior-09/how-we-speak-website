// HOW WE SPEAK: COMMUNICATIONS ARCHETYPE QUIZ LOGIC

const QUESTIONS = [
    {
        category: "CONFLICT",
        text: "When a disagreement starts heating up, what usually happens?",
        options: [
            { id: "q1a", text: "One of us goes quiet and the conversation stops", weights: { AVOIDER: 2 } },
            { id: "q1b", text: "We keep going in circles without getting anywhere", weights: { PURSUER: 2 } },
            { id: "q1c", text: "One of us jumps straight to solving it", weights: { FIXER: 2 } },
            { id: "q1d", text: "We talk it through and usually land somewhere", weights: { TRANSLATOR: 2 } }
        ]
    },
    {
        category: "CONFLICT",
        text: "After a difficult conversation, how long before things feel normal again?",
        options: [
            { id: "q2a", text: "A few minutes — we recover fast", weights: { TRANSLATOR: 2 } },
            { id: "q2b", text: "A few hours", weights: { FIXER: 1, TRANSLATOR: 1 } },
            { id: "q2c", text: "A day or two", weights: { PURSUER: 2 } },
            { id: "q2d", text: "Longer than that, sometimes much longer", weights: { AVOIDER: 2, DRIFTER: 1 } }
        ]
    },
    {
        category: "PATTERNS",
        text: "Do you find yourselves having the same argument more than once?",
        options: [
            { id: "q3a", text: "Constantly — same fight, different topic", weights: { PURSUER: 2, AVOIDER: 1 } },
            { id: "q3b", text: "Sometimes, a couple of recurring ones", weights: { FIXER: 2 } },
            { id: "q3c", text: "Rarely — we usually resolve things properly", weights: { TRANSLATOR: 2 } },
            { id: "q3d", text: "We don't really argue anymore", weights: { DRIFTER: 3 } }
        ]
    },
    {
        category: "EMOTIONAL SAFETY",
        text: "When something's bothering you, how easy is it to bring it up?",
        options: [
            { id: "q4a", text: "Very hard — I usually just let it go", weights: { AVOIDER: 3 } },
            { id: "q4b", text: "I bring it up but often at the wrong moment", weights: { PURSUER: 2 } },
            { id: "q4c", text: "I raise it, but I lead with a solution", weights: { FIXER: 2 } },
            { id: "q4d", text: "Reasonably easy, most of the time", weights: { TRANSLATOR: 2 } }
        ]
    },
    {
        category: "BEING HEARD",
        text: "When you're upset, what do you actually want from your partner?",
        options: [
            { id: "q5a", text: "To just listen without trying to fix it", weights: { PURSUER: 2 } },
            { id: "q5b", text: "To help me figure out what to do", weights: { FIXER: 2 } },
            { id: "q5c", text: "To give me space until I'm ready", weights: { AVOIDER: 2 } },
            { id: "q5d", text: "Depends on the situation, and I usually say which", weights: { TRANSLATOR: 2 } }
        ]
    },
    {
        category: "BEING HEARD",
        text: "When your partner is upset, what's your instinct?",
        options: [
            { id: "q6a", text: "Try to solve the problem", weights: { FIXER: 3 } },
            { id: "q6b", text: "Ask questions and listen", weights: { TRANSLATOR: 2 } },
            { id: "q6c", text: "Give them space", weights: { AVOIDER: 2 } },
            { id: "q6d", text: "Get defensive if I think I'm being blamed", weights: { PURSUER: 2 } }
        ]
    },
    {
        category: "THE PAST",
        text: "Do old issues come back up in current arguments?",
        options: [
            { id: "q7a", text: "Often — things from months or years ago", weights: { PURSUER: 2, AVOIDER: 1 } },
            { id: "q7b", text: "Occasionally", weights: { FIXER: 1 } },
            { id: "q7c", text: "Rarely — we tend to close things properly", weights: { TRANSLATOR: 2 } },
            { id: "q7d", text: "We avoid the past entirely", weights: { AVOIDER: 2, DRIFTER: 2 } }
        ]
    },
    {
        category: "CONNECTION",
        text: "When was your last real conversation — not logistics, not the kids, not the week ahead?",
        options: [
            { id: "q8a", text: "This week", weights: { TRANSLATOR: 2 } },
            { id: "q8b", text: "Sometime this month", weights: { FIXER: 1, TRANSLATOR: 1 } },
            { id: "q8c", text: "I honestly can't remember", weights: { DRIFTER: 3 } },
            { id: "q8d", text: "We talk but it stays on the surface", weights: { DRIFTER: 2 } }
        ]
    },
    {
        category: "SILENCE",
        text: "What does silence usually mean in your relationship?",
        options: [
            { id: "q9a", text: "Someone's upset and won't say so", weights: { AVOIDER: 2 } },
            { id: "q9b", text: "We're comfortable, it's fine", weights: { TRANSLATOR: 2 } },
            { id: "q9c", text: "Distance that's been building", weights: { DRIFTER: 3 } },
            { id: "q9d", text: "One of us is processing before talking", weights: { FIXER: 1, TRANSLATOR: 1 } }
        ]
    },
    {
        category: "INTIMACY",
        text: "How comfortable are you talking about physical intimacy together?",
        options: [
            { id: "q10a", text: "We don't really talk about it", weights: { AVOIDER: 2, DRIFTER: 1 } },
            { id: "q10b", text: "We try but it gets awkward", weights: { PURSUER: 1, AVOIDER: 1 } },
            { id: "q10c", text: "One of us brings it up, the other deflects", weights: { PURSUER: 2 } },
            { id: "q10d", text: "We can talk about it openly", weights: { TRANSLATOR: 2 } }
        ]
    },
    {
        category: "EFFORT",
        text: "Which of these sounds most like you right now?",
        options: [
            { id: "q11a", text: "I feel like I'm the only one trying", weights: { PURSUER: 3 } },
            { id: "q11b", text: "I try but nothing I say seems right", weights: { FIXER: 2 } },
            { id: "q11c", text: "I've stopped bringing things up", weights: { AVOIDER: 3 } },
            { id: "q11d", text: "We're both trying, we just get stuck sometimes", weights: { TRANSLATOR: 2 } }
        ]
    },
    {
        category: "INTENT",
        text: "What would you most want to change?",
        options: [
            { id: "q12a", text: "Stop having the same argument", weights: { PURSUER: 2 } },
            { id: "q12b", text: "Get them to actually open up", weights: { AVOIDER: 2 } },
            { id: "q12c", text: "Know what to say in hard moments", weights: { FIXER: 2 } },
            { id: "q12d", text: "Feel close again", weights: { DRIFTER: 3 } }
        ]
    }
];

const RESULTS = {
    AVOIDER: {
        title: "The Avoider",
        icon: "🤐",
        subtitle: "You keep the peace by keeping things unsaid.",
        looksLike: [
            "Conversations that could get difficult usually don't happen. Not because you don't care — because somewhere along the line you learned that raising something costs more than carrying it. So you carry it. You've gotten very good at deciding something isn't worth mentioning.",
            "The problem is that unsaid things don't disappear. They accumulate. And eventually they come out sideways — as tone, as distance, as a reaction that seems disproportionate to whatever just happened.",
            "Your partner often doesn't know anything's wrong until it's already large."
        ],
        happening: [
            "Avoidance is almost always protective. Somewhere it became safer to stay quiet than to risk the conflict, the disappointment, or the response you were expecting. That instinct made sense once. It may not anymore.",
            "The gap isn't willingness. It's that starting the conversation feels harder than the conversation itself would actually be."
        ],
        tryItems: [
            { title: "1. Name one small thing", body: "Pick something minor — genuinely minor. Raise it. The point isn't the issue; it's proving to yourself the conversation is survivable." },
            { title: "2. Use a starter that lowers the stakes", body: "\"There's something small I want to mention, and it's not a big deal.\" Giving it a size in advance makes it easier for both of you." },
            { title: "3. Say the thing before you've rehearsed it perfectly", body: "You'll never find the perfect wording. Waiting for it is how six months pass." }
        ],
        product: {
            title: "Complete Script Collection",
            desc: "75+ ready-to-use conversation starters for when you don't know what to say.",
            url: "https://themindly.gumroad.com/l/howwespeak-scripts?wanted=true"
        }
    },
    PURSUER: {
        title: "The Pursuer",
        icon: "🔍",
        subtitle: "You reach out. It rarely lands the way you meant.",
        looksLike: [
            "You're the one who brings things up. You're the one who notices when something's off, who wants to talk it through, who can't let it sit. And you're often the one left feeling like you're doing all the emotional work.",
            "When you raise something, it frequently escalates rather than resolves. You end up saying it louder or more times, which makes them retreat further, which makes you push harder. Both of you are trying. The loop still tightens."
        ],
        happening: [
            "Pursuing and withdrawing are the same conversation from two sides. The more you press for connection, the more they feel the pressure and pull back — and the more they pull back, the more urgently you press. Neither of you is choosing this.",
            "The exit isn't caring less. It's changing the opening move."
        ],
        tryItems: [
            { title: "1. Lead with the feeling, not the evidence", body: "\"I felt alone last night\" opens a door. \"You always leave me alone\" closes one. Same truth, different response." },
            { title: "2. Ask before you push", body: "\"Is now okay, or do you need a bit first?\" Giving them timing removes half the resistance." },
            { title: "3. Let one silence sit", body: "When they go quiet, wait. Twenty minutes. It will feel wrong. Do it anyway once and watch what changes." }
        ],
        product: {
            title: "How We Speak: Men Edition",
            desc: "Understand exactly why men withdraw and how to foster genuine openness.",
            url: "https://themindly.gumroad.com/l/How-We-Speak-Men-Edition?wanted=true"
        }
    },
    FIXER: {
        title: "The Fixer",
        icon: "🛠️",
        subtitle: "You solve. They wanted to be heard.",
        looksLike: [
            "When your partner brings you a problem, your brain starts working on it immediately. You're not dismissing them — you're trying to help in the most concrete way you know how.",
            "But it keeps landing wrong. You offer a solution and somehow they're more upset than before. You've probably heard some version of \"I don't want you to fix it, I just want you to listen\" and found it genuinely confusing."
        ],
        happening: [
            "Solving is a form of care. It's also a way of ending discomfort quickly — theirs and yours. But when someone is still in the feeling, a solution skips past the part they needed: being understood before being helped.",
            "You're not doing too little. You're doing the right thing in the wrong order."
        ],
        tryItems: [
            { title: "1. Ask which one they want", body: "\"Do you want help with this, or do you want me to listen?\" Eight words. Removes all the guessing." },
            { title: "2. Reflect before you respond", body: "Say back what you heard before adding anything. \"So it sounded like you felt sidelined.\" Then wait." },
            { title: "3. Sit in it for sixty seconds", body: "Resist the fix for one full minute. Most of the time they'll get there themselves — and feel accompanied rather than managed." }
        ],
        product: {
            title: "How We Speak: Women Edition",
            desc: "Understand what emotional support actually means to her.",
            url: "https://themindly.gumroad.com/l/howwespeak-women?wanted=true"
        }
    },
    DRIFTER: {
        title: "The Drifter",
        icon: "🌊",
        subtitle: "Nothing's wrong. That's the part that worries you.",
        looksLike: [
            "You don't fight much. There's no crisis, no betrayal, nothing you could point to. But you've noticed that the conversations have gotten shorter, more functional. Logistics, schedules, the week ahead.",
            "You can't remember your last real conversation. And somewhere underneath, that's started to bother you more than an argument would."
        ],
        happening: [
            "Drift doesn't happen in one moment. It happens in the small ones — the comment you didn't look up for, the story that got a distracted \"mm,\" the hand on a shoulder that didn't get a response.",
            "Each one is nothing. After enough of them, one of you stops reaching, and neither of you can name when it started. It isn't a lack of love. It's a lack of noticing."
        ],
        tryItems: [
            { title: "1. Respond fully once a day", body: "When they say something small, put the phone down and answer properly. Once. That's the whole assignment." },
            { title: "2. Ask the monthly question", body: "\"Is there anything sitting between us we haven't talked about?\" Ask it when nothing's wrong. That's the point." },
            { title: "3. Go somewhere without a purpose", body: "No errand, no destination, no logistics to discuss. Conversation needs unstructured time to appear." }
        ],
        product: {
            title: "Complete Bundle",
            desc: "All four guides. The complete toolkit to rebuild deep connection.",
            url: "https://themindly.gumroad.com/l/howwespeak-bundle"
        }
    },
    TRANSLATOR: {
        title: "The Translator",
        icon: "🗣️",
        subtitle: "You communicate well. Here's where it still breaks.",
        looksLike: [
            "Most of the time, you two handle things. You talk, you land somewhere, you move on without three days of residue. That's genuinely uncommon and worth naming.",
            "But there are specific rooms you don't go into. Certain topics that get handled rather than discussed. And when something does go wrong, it tends to be the same something."
        ],
        happening: [
            "Couples who communicate well often plateau in the same place — they've built strong general skills and never developed language for the specific hard categories. Money. Intimacy. Resentment that's too old to raise cleanly. Fear about the future.",
            "The general skill doesn't automatically transfer. Those conversations need their own vocabulary."
        ],
        tryItems: [
            { title: "1. Name the room you avoid", body: "Both of you, separately, write down one topic you steer around. Compare. The overlap is the work." },
            { title: "2. Schedule the difficult one", body: "Pick a time. Say what it's about in advance. Removing the ambush makes hard topics dramatically easier." },
            { title: "3. Ask what they've been carrying", body: "\"What's something you've been thinking about that you haven't told me?\" Then stay quiet for ten seconds after they finish." }
        ],
        product: {
            title: "Sex Talk Framework",
            desc: "Language for the most common \"hard topic\" for good communicators.",
            url: "https://themindly.gumroad.com/l/howwespeak-sextalk?wanted=true"
        }
    }
};

const TIE_BREAKER_PRIORITY = ["DRIFTER", "PURSUER", "AVOIDER", "FIXER", "TRANSLATOR"];

// STATE
let currentQuestionIndex = 0;
let answers = []; // stores selected option IDs
let resultArchetype = null;

// DOM Elements
let screens, btnStart, btnBack, btnSkip, btnShare;
let progressBar, progressText, qCategory, qText, optionsContainer;
let emailForm, firstNameInput, emailInput, emailError;

document.addEventListener("DOMContentLoaded", () => {
    screens = {
        intro: document.getElementById('screen-intro'),
        question: document.getElementById('screen-question'),
        email: document.getElementById('screen-email'),
        result: document.getElementById('screen-result')
    };

    btnStart = document.getElementById('btn-start');
    btnBack = document.getElementById('btn-back');
    btnSkip = document.getElementById('btn-skip');
    btnShare = document.getElementById('btn-share');

    progressBar = document.getElementById('progress-bar');
    progressText = document.getElementById('progress-text');
    qCategory = document.getElementById('q-category');
    qText = document.getElementById('q-text');
    optionsContainer = document.getElementById('options-container');

    emailForm = document.getElementById('email-form');
    firstNameInput = document.getElementById('first-name');
    emailInput = document.getElementById('email');
    emailError = document.getElementById('email-error');

    // Events
    btnStart.addEventListener('click', startQuiz);
    btnBack.addEventListener('click', goBack);
    btnSkip.addEventListener('click', () => showResult(false));
    btnShare.addEventListener('click', shareResult);
    emailForm.addEventListener('submit', handleEmailSubmit);

    // Keyboard navigation
    document.addEventListener('keydown', handleGlobalKeydown);

    // Analytics
    trackEvent("quiz_start_page_view");
});

function showScreen(screenKey) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenKey].classList.add('active');
    window.scrollTo(0, 0);
}

function startQuiz() {
    trackEvent("quiz_start");
    currentQuestionIndex = 0;
    answers = new Array(QUESTIONS.length).fill(null);

    // Transition
    const content = screens.intro.querySelector('.intro-content');
    content.classList.add('slide-left-out');

    setTimeout(() => {
        showScreen('question');
        renderQuestion(0);
    }, 350);
}

function renderQuestion(index) {
    currentQuestionIndex = index;
    const q = QUESTIONS[index];

    // Progress
    const percent = Math.round((index / QUESTIONS.length) * 100);
    progressBar.style.width = percent + "%";
    progressBar.setAttribute('aria-valuenow', index + 1);
    progressText.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
    document.getElementById('progress-percent').textContent = percent + "%";

    // Content
    qCategory.textContent = q.category;
    qText.textContent = q.text;

    btnBack.style.visibility = index === 0 ? "hidden" : "visible";

    // Options
    optionsContainer.innerHTML = "";
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.setAttribute("aria-pressed", answers[index] === opt.id);
        btn.innerHTML = `<div class="option-circle"></div><span>${opt.text}</span>`;

        if (answers[index] === opt.id) btn.classList.add("selected");

        btn.addEventListener("click", () => selectOption(opt.id, btn));
        optionsContainer.appendChild(btn);
    });

    // Animation reset
    const qContent = screens.question.querySelector('.q-content');
    qContent.classList.remove('slide-left-out', 'slide-right-in');
    void qContent.offsetWidth;
    qContent.classList.add('slide-right-in');

    if (index === 0) {
        // Small hint for keyboard on first question
        const hint = document.createElement("div");
        hint.style.fontSize = "11px";
        hint.style.color = "var(--gray)";
        hint.style.textAlign = "center";
        hint.style.marginTop = "12px";
        hint.textContent = "Tip: You can use number keys 1-4";
        optionsContainer.appendChild(hint);
    }
}

function selectOption(optionId, btnEl) {
    // Visuals
    Array.from(optionsContainer.children).forEach(b => {
        b.classList.remove("selected");
        b.setAttribute("aria-pressed", "false");
    });
    if (btnEl) {
        btnEl.classList.add("selected");
        btnEl.setAttribute("aria-pressed", "true");
    }

    answers[currentQuestionIndex] = optionId;
    trackEvent("quiz_question_answered", { question: currentQuestionIndex + 1 });

    setTimeout(() => {
        if (currentQuestionIndex < QUESTIONS.length - 1) {
            // Go to next
            const qContent = screens.question.querySelector('.q-content');
            qContent.classList.remove('slide-right-in');
            qContent.classList.add('slide-left-out');
            setTimeout(() => {
                renderQuestion(currentQuestionIndex + 1);
            }, 350);
        } else {
            // Reached the end -> calculate and show Email screen
            progressBar.style.width = "100%";
            document.getElementById('progress-percent').textContent = "100%";
            calculateResult();
            trackEvent("quiz_email_shown");

            const qContent = screens.question.querySelector('.q-content');
            qContent.classList.add('slide-left-out');
            setTimeout(() => {
                showScreen('email');
            }, 350);
        }
    }, 400);
}

function goBack() {
    if (currentQuestionIndex > 0) {
        const qContent = screens.question.querySelector('.q-content');
        qContent.classList.remove('slide-right-in');
        qContent.classList.add('slide-left-out'); // A true 'back' animation could slide right, keeping this simple.
        setTimeout(() => {
            renderQuestion(currentQuestionIndex - 1);
        }, 350);
    }
}

function handleGlobalKeydown(e) {
    if (screens.question.classList.contains("active")) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
            const opts = optionsContainer.querySelectorAll(".option-btn");
            if (opts[num - 1]) opts[num - 1].click();
        }
        if (e.key === "Backspace" && currentQuestionIndex > 0) {
            goBack();
        }
    }
}

function calculateResult() {
    let scores = { AVOIDER: 0, PURSUER: 0, FIXER: 0, TRANSLATOR: 0, DRIFTER: 0 };

    answers.forEach((ansId, i) => {
        const q = QUESTIONS[i];
        const opt = q.options.find(o => o.id === ansId);
        if (opt && opt.weights) {
            Object.keys(opt.weights).forEach(archy => {
                scores[archy] += opt.weights[archy];
            });
        }
    });

    // Find max with tiebreaker
    let maxScore = -1;
    let topArchetype = null;

    Object.keys(scores).forEach(archy => {
        const s = scores[archy];
        if (s > maxScore) {
            maxScore = s;
            topArchetype = archy;
        } else if (s === maxScore) {
            // Tiebreaker
            const currentRank = TIE_BREAKER_PRIORITY.indexOf(topArchetype);
            const newRank = TIE_BREAKER_PRIORITY.indexOf(archy);
            if (newRank < currentRank) {
                topArchetype = archy;
            }
        }
    });

    resultArchetype = topArchetype;
}

async function handleEmailSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const name = firstNameInput.value.trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
        emailInput.classList.add('invalid');
        return;
    }
    emailInput.classList.remove('invalid');
    emailInput.classList.remove('invalid');

    trackEvent("quiz_email_submitted");

    const payload = {
        email,
        name,
        archetype: resultArchetype,
        answers: answers.map((id, i) => {
            return QUESTIONS[i].options.find(o => o.id === id)?.text || id;
        }),
        meta: {
            url: window.location.href,
            referrer: document.referrer,
            device: window.innerWidth < 640 ? "mobile" : "desktop"
        }
    };

    const btn = document.getElementById('btn-submit');
    btn.textContent = "Processing...";
    btn.style.opacity = "0.7";
    btn.disabled = true;

    try {
        const res = await fetch('/api/quiz-submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.ok === false) {
            console.error('[quiz] Telegram notification failed:', data?.reason || `HTTP ${res.status}`);
        } else {
            console.log('[quiz] Telegram notification sent.');
        }
    } catch (err) {
        console.error('[quiz] Telegram notification request failed:', err);
    }

    showResult(true, email);
}

function showResult(withPlan = false, email = "") {
    trackEvent("quiz_completed", { archetype: resultArchetype });
    if (!withPlan) trackEvent("quiz_email_skipped");

    const resData = RESULTS[resultArchetype];

    document.getElementById('archetype-badge').textContent = resData.icon;
    document.getElementById('res-title').textContent = resData.title;
    document.getElementById('res-subtitle').textContent = resData.subtitle;

    document.getElementById('res-looks-like').innerHTML = resData.looksLike.map(p => `<p>${p}</p>`).join('');
    document.getElementById('res-happening').innerHTML = resData.happening.map(p => `<p>${p}</p>`).join('');

    document.getElementById('res-try').innerHTML = resData.tryItems.map(item =>
        `<div class="res-card"><div class="res-card-title">${item.title}</div><div class="res-card-body">${item.body}</div></div>`
    ).join('');

    const productCard = document.getElementById('res-product');
    productCard.href = resData.product.url;
    productCard.innerHTML = `<div style="font-family:'Inter',sans-serif;font-weight:600;font-size:10px;text-transform:uppercase;color:var(--gold);letter-spacing:0.12em;">Recommended Reading</div><div class="res-product-title">${resData.product.title}</div><div class="res-product-desc">${resData.product.desc}</div><div style="font-family:'Inter',sans-serif;font-size:13px;color:var(--crimson);font-weight:500;margin-top:auto;">Learn More &rarr;</div>`;
    productCard.onclick = () => trackEvent("quiz_product_clicked", { product: resData.product.title });

    const conf = document.getElementById('result-confirm-block');
    if (withPlan && email) {
        document.getElementById('result-confirm-email').textContent = email;
        conf.style.display = "block";
    } else {
        conf.style.display = "none";
    }

    showScreen('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Analytics Helper
function trackEvent(eventName, params = {}) {
    // If gtag is present (GA4), push event
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
    console.log("Track:", eventName, params);
}

// Track Abandonment
window.addEventListener('beforeunload', () => {
    if (screens.question.classList.contains('active') && currentQuestionIndex > 0) {
        trackEvent("quiz_abandoned", { last_question: currentQuestionIndex + 1 });
    }
});
