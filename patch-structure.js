const fs = require('fs');

const mainHtml = `
  <main>
    <!-- SECTION 1: HERO -->
    <section class="section section--cream" style="padding-top: 140px; padding-bottom: 80px;">
      <div class="container">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items:center;">
          <div class="reveal">
            <h1 class="display-lg" style="margin-bottom:24px;">Stop Guessing.<br>Start Understanding.</h1>
            <p class="body-lg" style="color:var(--charcoal-mid); margin-bottom:40px;">Psychology-backed communication guides for couples. Learn how your partner actually thinks, processes emotions, and communicates.</p>
            <div style="display:flex; gap:16px;">
              <a href="#bundle" class="btn btn-primary btn-lg">Start Understanding</a>
              <a href="#guides" class="btn btn-secondary btn-lg" style="background:transparent; border-color:var(--border);">Read the Guides</a>
            </div>
          </div>
          <div class="reveal reveal-delay-2">
            <div class="img-placeholder" style="aspect-ratio:3/4; border-radius:12px; overflow:hidden; box-shadow:var(--shadow-lg);">
              <img src="{{hero-image}}" alt="How We Speak" style="width:100%; height:100%; object-fit:cover;">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: TRUST -->
    <section class="section section--white" style="padding: 60px 0; border-bottom: 1px solid var(--border);">
      <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:32px; text-align:center;">
          <div class="reveal" style="flex:1;">
            <div style="font-size:24px; margin-bottom:12px;">🛡️</div>
            <strong style="display:block; font-size:14px; color:var(--charcoal);">30-Day Money Back</strong>
          </div>
          <div class="reveal reveal-delay-1" style="flex:1;">
            <div style="font-size:24px; margin-bottom:12px;">⚡</div>
            <strong style="display:block; font-size:14px; color:var(--charcoal);">Instant Download</strong>
          </div>
          <div class="reveal reveal-delay-2" style="flex:1;">
            <div style="font-size:24px; margin-bottom:12px;">♾️</div>
            <strong style="display:block; font-size:14px; color:var(--charcoal);">Lifetime Access</strong>
          </div>
          <div class="reveal reveal-delay-3" style="flex:1;">
            <div style="font-size:24px; margin-bottom:12px;">❤️</div>
            <strong style="display:block; font-size:14px; color:var(--charcoal);">Thousands Helped</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: OUR STORY -->
    <section class="section section--cream">
      <div class="container">
        <div class="about__inner" style="display:grid; grid-template-columns: 1fr 1fr; gap:60px; align-items:center;">
          <div class="about__image-wrap reveal">
            <div class="img-placeholder" style="border-radius:12px; overflow:hidden; aspect-ratio:4/5;">
              <img src="{{anas-photo}}" alt="Anas" style="width:100%;height:100%;object-fit:cover;">
            </div>
          </div>
          <div class="about__content reveal reveal-delay-2">
            <p class="eyebrow" style="margin-bottom:16px;">Our Story</p>
            <h2 class="display-md" style="margin-bottom:24px;">How We Met.</h2>
            <div class="timeline" style="border-left: 2px solid var(--border); padding-left: 24px; margin-bottom:32px;">
              <div style="position:relative; margin-bottom:24px;">
                <div style="position:absolute; left:-33px; top:4px; width:14px; height:14px; background:var(--crimson); border-radius:50%;"></div>
                <h4 style="font-size:16px; font-weight:600; margin-bottom:8px;">The Beginning</h4>
                <p style="color:var(--charcoal-mid); font-size:15px; line-height:1.6;">Two incredibly stubborn people refusing to make the first move. Pride kept getting in the way.</p>
              </div>
              <div style="position:relative; margin-bottom:24px;">
                <div style="position:absolute; left:-33px; top:4px; width:14px; height:14px; background:var(--gold); border-radius:50%;"></div>
                <h4 style="font-size:16px; font-weight:600; margin-bottom:8px;">How Everything Changed</h4>
                <p style="color:var(--charcoal-mid); font-size:15px; line-height:1.6;">A quiet drive to the train station. Dropping the ego. Taking a leap of faith.</p>
              </div>
              <div style="position:relative;">
                <div style="position:absolute; left:-33px; top:4px; width:14px; height:14px; background:var(--charcoal); border-radius:50%;"></div>
                <h4 style="font-size:16px; font-weight:600; margin-bottom:8px;">Communication Fixed Everything</h4>
                <p style="color:var(--charcoal-mid); font-size:15px; line-height:1.6;">Love isn't enough. We learned that healthy communication isn't something most people are ever taught. So we built the manual we wished we had.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 4: THE FOUR GUIDES -->
    <section class="section section--white" id="guides">
      <div class="container">
        <div class="text-center reveal" style="margin-bottom: 56px;">
          <p class="eyebrow" style="margin-bottom:16px;">Our Frameworks</p>
          <h2 class="display-md">The Four Guides</h2>
        </div>
        <div class="grid-4" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:32px;">
          
          <!-- Guide 1 -->
          <div class="product-card reveal">
            <div style="position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:8px; margin-bottom:24px;" onmouseover="this.querySelector('.back-img').style.opacity='1'" onmouseout="this.querySelector('.back-img').style.opacity='0'">
              <img src="{{men-front}}" alt="Men Edition Front" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; transition:opacity 0.4s;">
              <img src="{{men-back}}" class="back-img" alt="Men Edition Back" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; opacity:0; transition:opacity 0.4s;">
            </div>
            <p class="product-card__tag">Men Edition</p>
            <h3 class="product-card__title">Understanding How Men Think</h3>
            <p class="product-card__desc" style="font-size:14px; margin-bottom:16px;">Explain why men go silent and how they process conflict.</p>
            <div style="margin-bottom:24px; color:var(--gray); font-size:13px; list-style:inside; line-height:1.6;">
              &bull; Why he withdraws<br>
              &bull; Phrasing that opens him up
            </div>
            <div class="product-card__footer" style="padding-top:16px; border-top:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-family:var(--font-display); font-size:20px; font-weight:600;">$37</span>
                <span class="guarantee-badge" style="font-size:11px; padding:4px 8px; background:var(--cream); border-radius:4px; font-weight:600;">30-Day Guarantee &#9733;&#9733;&#9733;&#9733;&#9733;</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" style="flex:1; padding:8px; font-size:12px;" onclick="Products.openModal('men-edition')">Read Now</button>
                <button class="btn btn-primary" style="flex:1; padding:8px; font-size:12px;" onclick="Cart.add('men-edition')">Add to Cart</button>
              </div>
            </div>
          </div>

          <!-- Guide 2 -->
          <div class="product-card reveal reveal-delay-1">
            <div style="position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:8px; margin-bottom:24px;" onmouseover="this.querySelector('.back-img').style.opacity='1'" onmouseout="this.querySelector('.back-img').style.opacity='0'">
              <img src="{{women-front}}" alt="Women Edition Front" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; transition:opacity 0.4s;">
              <img src="{{women-back}}" class="back-img" alt="Women Edition Back" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; opacity:0; transition:opacity 0.4s;">
            </div>
            <p class="product-card__tag">Women Edition</p>
            <h3 class="product-card__title">Understanding How Women Think</h3>
            <p class="product-card__desc" style="font-size:14px; margin-bottom:16px;">What emotional support actually means to her.</p>
            <div style="margin-bottom:24px; color:var(--gray); font-size:13px; list-style:inside; line-height:1.6;">
              &bull; Resolving old arguments<br>
              &bull; What she actually hears
            </div>
            <div class="product-card__footer" style="padding-top:16px; border-top:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-family:var(--font-display); font-size:20px; font-weight:600;">$37</span>
                <span class="guarantee-badge" style="font-size:11px; padding:4px 8px; background:var(--cream); border-radius:4px; font-weight:600;">30-Day Guarantee &#9733;&#9733;&#9733;&#9733;&#9733;</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" style="flex:1; padding:8px; font-size:12px;" onclick="Products.openModal('women-edition')">Read Now</button>
                <button class="btn btn-primary" style="flex:1; padding:8px; font-size:12px;" onclick="Cart.add('women-edition')">Add to Cart</button>
              </div>
            </div>
          </div>

          <!-- Guide 3 -->
          <div class="product-card reveal reveal-delay-2">
            <div style="position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:8px; margin-bottom:24px;" onmouseover="this.querySelector('.back-img').style.opacity='1'" onmouseout="this.querySelector('.back-img').style.opacity='0'">
              <img src="{{scripts-front}}" alt="Scripts Front" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; transition:opacity 0.4s;">
              <img src="{{scripts-back}}" class="back-img" alt="Scripts Back" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; opacity:0; transition:opacity 0.4s;">
            </div>
            <p class="product-card__tag">Script Collection</p>
            <h3 class="product-card__title">The Words You've Been Searching For</h3>
            <p class="product-card__desc" style="font-size:14px; margin-bottom:16px;">75+ ready-to-use relationship scripts.</p>
            <div style="margin-bottom:24px; color:var(--gray); font-size:13px; list-style:inside; line-height:1.6;">
              &bull; Starting hard talks safely<br>
              &bull; Apologizing effectively
            </div>
            <div class="product-card__footer" style="padding-top:16px; border-top:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-family:var(--font-display); font-size:20px; font-weight:600;">$27</span>
                <span class="guarantee-badge" style="font-size:11px; padding:4px 8px; background:var(--cream); border-radius:4px; font-weight:600;">30-Day Guarantee &#9733;&#9733;&#9733;&#9733;&#9733;</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" style="flex:1; padding:8px; font-size:12px;" onclick="Products.openModal('script-collection')">Read Now</button>
                <button class="btn btn-primary" style="flex:1; padding:8px; font-size:12px;" onclick="Cart.add('script-collection')">Add to Cart</button>
              </div>
            </div>
          </div>

          <!-- Guide 4 -->
          <div class="product-card reveal reveal-delay-3">
            <div style="position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:8px; margin-bottom:24px;" onmouseover="this.querySelector('.back-img').style.opacity='1'" onmouseout="this.querySelector('.back-img').style.opacity='0'">
              <img src="{{sex-front}}" alt="Sex Talk Front" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; transition:opacity 0.4s;">
              <img src="{{sex-back}}" class="back-img" alt="Sex Talk Back" style="width:100%;height:100%;object-fit:cover; position:absolute; inset:0; opacity:0; transition:opacity 0.4s;">
            </div>
            <p class="product-card__tag">Sex Talk Framework</p>
            <h3 class="product-card__title">Intimacy Starts With A Conversation</h3>
            <p class="product-card__desc" style="font-size:14px; margin-bottom:16px;">Communicating about physical & emotional intimacy.</p>
            <div style="margin-bottom:24px; color:var(--gray); font-size:13px; list-style:inside; line-height:1.6;">
              &bull; Expressing desires<br>
              &bull; Navigating libido mismatches
            </div>
            <div class="product-card__footer" style="padding-top:16px; border-top:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-family:var(--font-display); font-size:20px; font-weight:600;">$27</span>
                <span class="guarantee-badge" style="font-size:11px; padding:4px 8px; background:var(--cream); border-radius:4px; font-weight:600;">30-Day Guarantee &#9733;&#9733;&#9733;&#9733;&#9733;</span>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-secondary" style="flex:1; padding:8px; font-size:12px;" onclick="Products.openModal('sex-talk')">Read Now</button>
                <button class="btn btn-primary" style="flex:1; padding:8px; font-size:12px;" onclick="Cart.add('sex-talk')">Add to Cart</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- SECTION 5: BUNDLE OFFER -->
    <section class="section" id="bundle" style="background:var(--charcoal); color:#fff;">
      <div class="container">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:60px; align-items:center;">
          <div class="reveal">
            <h2 class="display-md" style="color:#fff; margin-bottom:24px;">Everything You Need To Transform Your Relationship</h2>
            <p style="color:var(--gray); margin-bottom:32px; font-size:18px;">Get all 4 communication guides instantly.</p>
            <div class="bundle__pricing" style="border-color:rgba(255,255,255,0.1); margin-bottom:32px;">
              <span class="bundle__price-current" style="color:#fff;">$97</span>
              <span class="bundle__price-was" style="color:rgba(255,255,255,0.4);">$128</span>
            </div>
            <!-- STRIPE PAYMENT LINK HERE -->
            <a href="#" class="btn btn-primary btn-lg" style="background:#fff; color:var(--charcoal);">Get Complete Bundle</a>
          </div>
          <div class="reveal reveal-delay-2">
            <div class="img-placeholder" style="aspect-ratio:1/1; border-radius:12px; overflow:hidden; background:rgba(255,255,255,0.05);">
              <img src="{{bundle-image}}" alt="Complete Bundle" style="width:100%;height:100%;object-fit:cover;">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 6: MEGA BUNDLE -->
    <section class="section" style="background:var(--crimson); color:#fff;">
      <div class="container">
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:60px; align-items:center;">
          <div class="reveal">
            <p class="eyebrow" style="color:var(--gold-light); margin-bottom:16px;">Relationship Transformation Package</p>
            <h2 class="display-md" style="color:#fff; margin-bottom:24px;">The Mega Bundle</h2>
            <ul style="list-style:none; padding:0; margin-bottom:32px; font-size:16px; line-height:2;">
              <li>✓ All Four Guides</li>
              <li>✓ Private Session</li>
            </ul>
            <div class="bundle__pricing" style="border-color:rgba(255,255,255,0.1); margin-bottom:32px;">
              <span class="bundle__price-current" style="color:#fff;">$580</span>
            </div>
            <!-- STRIPE PAYMENT LINK HERE -->
            <a href="#" class="btn btn-primary btn-lg" style="background:#fff; color:var(--crimson);">Book Mega Bundle</a>
          </div>
          <div class="reveal reveal-delay-2">
            <div class="img-placeholder" style="aspect-ratio:1/1; border-radius:12px; overflow:hidden; background:rgba(255,255,255,0.05);">
              <img src="{{bundle-image}}" alt="Mega Bundle" style="width:100%;height:100%;object-fit:cover; opacity:0.8;">
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 7: PRIVATE SESSION -->
    <section class="section section--cream">
      <div class="container text-center reveal">
        <p class="eyebrow" style="margin-bottom:16px;">1-on-1 Support</p>
        <h2 class="display-md" style="margin-bottom:24px;">Relationship Communication Session</h2>
        <p class="body-lg" style="max-width:600px; margin:0 auto 40px;">Private Relationship Communication Session with a licensed relationship psychologist. Get personalized guidance for your unique challenges.</p>
        <div style="display:inline-block; padding:32px 48px; background:var(--warm-white); border:1px solid var(--border); border-radius:12px; box-shadow:var(--shadow-lg);">
          <div style="font-family:var(--font-display); font-size:40px; margin-bottom:24px; color:var(--charcoal);">$500</div>
          <!-- STRIPE PAYMENT LINK HERE -->
          <a href="#" class="btn btn-primary btn-lg">Book Session</a>
        </div>
      </div>
    </section>

    <!-- SECTION 8: HOW IT WORKS -->
    <section class="section section--white">
      <div class="container text-center">
        <h2 class="display-md reveal" style="margin-bottom:48px;">How It Works</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:40px;">
          <div class="reveal">
            <div style="font-size:32px; font-family:var(--font-display); font-style:italic; margin-bottom:16px; color:var(--crimson);">1. Choose</div>
            <h3 style="font-size:18px; margin-bottom:8px;">Select your guide</h3>
            <p style="color:var(--charcoal-mid);">Pick the perspective or bundle you need.</p>
          </div>
          <div class="reveal reveal-delay-1">
            <div style="font-size:32px; font-family:var(--font-display); font-style:italic; margin-bottom:16px; color:var(--crimson);">2. Download</div>
            <h3 style="font-size:18px; margin-bottom:8px;">Instant Access</h3>
            <p style="color:var(--charcoal-mid);">Get the PDF immediately on any device.</p>
          </div>
          <div class="reveal reveal-delay-2">
            <div style="font-size:32px; font-family:var(--font-display); font-style:italic; margin-bottom:16px; color:var(--crimson);">3. Improve</div>
            <h3 style="font-size:18px; margin-bottom:8px;">Apply the scripts</h3>
            <p style="color:var(--charcoal-mid);">Start understanding each other today.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 9: TESTIMONIALS -->
    <section class="section section--cream">
      <div class="container">
        <h2 class="display-md text-center reveal" style="margin-bottom:48px;">Real Couples, Real Change.</h2>
        <div style="display:flex; gap:24px; overflow-x:auto; padding-bottom:24px;" class="reveal reveal-delay-1">
          <!-- Testimonial 1 -->
          <div style="min-width:320px; background:var(--warm-white); padding:32px; border-radius:12px; box-shadow:var(--shadow-md); border:1px solid var(--border);">
            <div style="color:var(--gold-dark); margin-bottom:16px;">★★★★★</div>
            <p style="font-style:italic; margin-bottom:24px; color:var(--charcoal);">"I never understood why my husband went silent. This explained everything in a way I could actually use."</p>
            <div style="font-weight:600;">Sarah M.</div>
          </div>
          <!-- Testimonial 2 -->
          <div style="min-width:320px; background:var(--warm-white); padding:32px; border-radius:12px; box-shadow:var(--shadow-md); border:1px solid var(--border);">
            <div style="color:var(--gold-dark); margin-bottom:16px;">★★★★★</div>
            <p style="font-style:italic; margin-bottom:24px; color:var(--charcoal);">"The scripts gave me the exact words for a conversation I was terrified of starting."</p>
            <div style="font-weight:600;">James T.</div>
          </div>
          <!-- Testimonial 3 -->
          <div style="min-width:320px; background:var(--warm-white); padding:32px; border-radius:12px; box-shadow:var(--shadow-md); border:1px solid var(--border);">
            <div style="color:var(--gold-dark); margin-bottom:16px;">★★★★★</div>
            <p style="font-style:italic; margin-bottom:24px; color:var(--charcoal);">"Instead of guessing, we finally understand our mismatch in intimacy. Very grateful."</p>
            <div style="font-weight:600;">Emily K.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 10: FAQ -->
    <section class="section section--white">
      <div class="container text-center reveal">
        <h2 class="display-md" style="margin-bottom:48px;">Frequently Asked Questions</h2>
        <div style="max-width:680px; margin:0 auto; text-align:left;">
          <div style="border-bottom:1px solid var(--border); padding-bottom:16px; margin-bottom:16px;">
            <strong style="display:block; margin-bottom:8px; font-size:16px;">Are these guides based on real research?</strong>
            <p style="color:var(--charcoal-mid); font-size:14px; line-height:1.6;">Every How We Speak guide draws from 20+ years of research in communication psychology and behavioral science.</p>
          </div>
          <div style="border-bottom:1px solid var(--border); padding-bottom:16px; margin-bottom:16px;">
            <strong style="display:block; margin-bottom:8px; font-size:16px;">Is this a replacement for therapy?</strong>
            <p style="color:var(--charcoal-mid); font-size:14px; line-height:1.6;">No. These guides are for couples wanting to communicate better proactively, not crisis intervention.</p>
          </div>
          <div style="border-bottom:1px solid var(--border); padding-bottom:16px; margin-bottom:16px;">
            <strong style="display:block; margin-bottom:8px; font-size:16px;">Do I get lifetime access?</strong>
            <p style="color:var(--charcoal-mid); font-size:14px; line-height:1.6;">Yes, including all future updates to the content securely delivered via PDF for all devices.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 11: RISK FREE GUARANTEE -->
    <section class="section section--cream">
      <div class="container">
        <div class="reveal" style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:48px; text-align:center; box-shadow:var(--shadow-lg);">
          <div style="font-size:40px; margin-bottom:24px;">🛡️</div>
          <h2 class="display-md" style="margin-bottom:16px;">30-Day Money Back Guarantee</h2>
          <p style="color:var(--charcoal-mid); max-width:500px; margin:0 auto 32px;">If you don't understand your partner better than you did on Day 1, email us and we'll refund you in full. No forms. No stress.</p>
        </div>
      </div>
    </section>

    <!-- SECTION 12: FINAL CTA -->
    <section class="section" style="background:var(--charcoal); color:#fff; text-align:center;">
      <div class="container reveal">
        <h2 class="display-md" style="color:#fff; margin-bottom:32px;">Ready to understand your partner?</h2>
        <div style="display:flex; justify-content:center; gap:24px;">
          <!-- STRIPE PAYMENT LINK HERE -->
          <a href="#" class="btn btn-primary btn-lg" style="background:var(--crimson); color:#fff; border:none;">Get Bundle</a>
          <!-- STRIPE PAYMENT LINK HERE -->
          <a href="#" class="btn btn-secondary btn-lg" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.4);">Book Session</a>
        </div>
      </div>
    </section>
  </main>
`;

let content = fs.readFileSync('index.html', 'utf8');

// Replace everything between <main> and </main>
content = content.replace(/<main>[\s\S]*?<\/main>/i, mainHtml);

fs.writeFileSync('index.html', content);
console.log('Index.html strictly rewritten into 13 defined sections successfully');
