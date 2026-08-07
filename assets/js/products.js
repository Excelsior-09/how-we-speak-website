const Products = {
  data: {
    'men-edition': {
      title: 'Understanding How Men Think',
      tag: 'Men Edition',
      price: 37,
      desc: 'Written for women. Explains why men go silent, how they process conflict, and what they need to feel safe but rarely ask for.',
      who: 'Women who want to stop guessing and start understanding the men in their lives.',
      learn: [
        'Why he withdraws during arguments',
        'How to ask for support he’ll actually give',
        'Phrases that open him up vs. shut him down',
        '30-day action plan for implementation'
      ],
      testimonial: '"I never understood why my husband went silent. This explained everything in a way I could actually use." — Sarah M.',
      images: [
        '{{men-front}}',
        '{{men-back}}',
        '{{men-hero}}',
        '{{men-desk}}'
      ]
    },
    'women-edition': {
      title: 'Understanding How Women Think',
      tag: 'Women Edition',
      price: 37,
      desc: 'Written for men. Explains why she brings up the past, what emotional support actually means to her, and what she needs to feel safe.',
      who: 'Men who want to provide genuine emotional support and understand their partner deeply.',
      learn: [
        'Why old arguments resurface & how to fix them',
        'What she hears vs. what you actually said',
        'How to make her feel genuinely understood'
      ],
      testimonial: '"My wife asked me to read this. After finishing, I finally understood things from years ago. A game changer." — James T.',
      images: [
        '{{women-front}}',
        '{{women-back}}',
        '{{women-hero}}',
        '{{women-desk}}'
      ]
    },
    'script-collection': {
      title: 'The Words You\'ve Been Searching For',
      tag: 'Script Collection',
      price: 27,
      desc: '75+ ready-to-use conversation scripts for every relationship moment — from difficult talks to deep connection.',
      who: 'Couples who know what they want to say, but struggle to find the right words without causing offense.',
      learn: [
        'Starting conversations without starting fights',
        'Apologizing in a way that truly lands',
        'Setting limits without pushing them away'
      ],
      testimonial: '"The scripts gave me the exact words for a conversation I was terrified of starting." — Aisha B.',
      images: [
        '{{scripts-front}}',
        '{{scripts-back}}',
        '{{scripts-hero}}',
        '{{scripts-desk}}'
      ]
    },
    'sex-talk': {
      title: 'Intimacy Starts With a Conversation',
      tag: 'Sex Talk Framework',
      price: 27,
      desc: 'A respectful, practical guide to communicating about physical and emotional intimacy — without shame, awkwardness, or guesswork.',
      who: 'Couples looking to deepen their physical connection and navigate intimacy comfortably.',
      learn: [
        'Express desires without embarrassment',
        'Navigate mismatched libido with empathy',
        'Build the trust that deepens physical connection'
      ],
      testimonial: '"Instead of guessing, we finally understand our mismatch in intimacy. Very grateful." — Emily K.',
      images: [
        '{{sex-front}}',
        '{{sex-back}}',
        '{{sex-hero}}',
        '{{sex-desk}}'
      ]
    }
  },

  activeImageIndex: 0,
  activeId: null,

  openModal(id) {
    const p = this.data[id];
    if (!p) return;
    this.activeId = id;
    this.activeImageIndex = 0;

    document.getElementById('modalTag').textContent = p.tag;
    document.getElementById('modalTitle').textContent = p.title;
    document.getElementById('modalDesc').textContent = p.desc;
    document.getElementById('modalWho').textContent = p.who;
    document.getElementById('modalTestimonial').textContent = p.testimonial;
    document.getElementById('modalPrice').textContent = '$' + p.price;

    document.getElementById('modalLearn').innerHTML = p.learn.map(inc => `<li>${inc}</li>`).join('');

    this.renderGallery();

    const addBtn = document.getElementById('modalAddBtn');
    addBtn.onclick = () => {
      Cart.add(id);
      this.closeModal();
    };

    document.getElementById('productModal').classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  renderGallery() {
    const p = this.data[this.activeId];
    if (!p) return;
    const mainImg = document.getElementById('modalImgMain');
    mainImg.innerHTML = `<img src="${p.images[this.activeImageIndex]}" alt="Gallery" style="width:100%;height:100%;object-fit:cover;border-radius:8px;animation: fade 0.3s ease;">`;

    const thumbs = document.getElementById('modalThumbs');
    thumbs.innerHTML = p.images.map((img, idx) => `
      <div onclick="Products.setGalleryIndex(${idx})" style="aspect-ratio:3/4; border-radius:4px; overflow:hidden; border: 2px solid ${idx === this.activeImageIndex ? 'var(--crimson)' : 'transparent'}; cursor:pointer; opacity: ${idx === this.activeImageIndex ? '1' : '0.6'}; transition: all 0.2s;">
        <img src="${img}" style="width:100%;height:100%;object-fit:cover;">
      </div>
    `).join('');
  },

  setGalleryIndex(idx) {
    this.activeImageIndex = idx;
    this.renderGallery();
  },

  closeModal() {
    document.getElementById('productModal').classList.remove('show');
    document.body.style.overflow = '';
    this.activeId = null;
  }
};

window.Products = Products;

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('modalCloseBtn');
  const overlay = document.getElementById('productModal');

  if (closeBtn) closeBtn.addEventListener('click', () => Products.closeModal());
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) Products.closeModal();
  });
});
