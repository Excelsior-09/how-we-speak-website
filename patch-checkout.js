const fs = require('fs');

let html = fs.readFileSync('checkout.html', 'utf8');

const paymentMethodRegex = /<!-- PAYMENT METHOD -->[\s\S]*?(?=<!-- EMAIL DELIVERY NOTE -->)/;
const replacementPayment = `<!-- ═══════════════════════════════════════════════
     STRIPE INTEGRATION POINT
     ─────────────────────────────────────────────
     Stripe secure checkout will be integrated here later.
     <div id="stripe-payment-element"></div>
     ═══════════════════════════════════════════════ -->

`;
html = html.replace(paymentMethodRegex, replacementPayment);

const submitButtonRegex = /<!-- SUBMIT BUTTON -->[\s\S]*?(?=<p class="submit-note">)/;
const replacementSubmit = `<!-- SUBMIT BUTTON -->
<!-- ═══════════════════════════════════════════════
     CONTINUE TO PAYMENT BUTTON
     ─────────────────────────────────────────────
     This button will later redirect to Stripe Checkout
     or mount Stripe element logic once the backend 
     is fully integrated.
     ═══════════════════════════════════════════════ -->
<button type="button" class="checkout-submit" id="submitBtn" onclick="handleSubmit()" aria-label="Proceed to payment">
  Continue to Payment
</button>
`;
html = html.replace(submitButtonRegex, replacementSubmit);

// Clean up some styles if needed, but not required yet.
fs.writeFileSync('checkout.html', html);
console.log('checkout.html fake UI removed successfully');
