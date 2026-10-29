// ==============================================================================
// HOW WE SPEAK — PADDLE BILLING CLIENT CHECKOUT (MARKETING SITE)
// Production default: No Paddle.Environment.set('sandbox')
// ==============================================================================

(function (window) {
  'use strict';

  var PaddleCheckout = {
    initialized: false,
    clientToken: '', // Injected via env or window.HWS_PADDLE_TOKEN

    init: function (token, paddleCustomerId) {
      if (this.initialized || !window.Paddle) return;
      var activeToken = token || window.HWS_PADDLE_TOKEN || '';
      if (!activeToken) return;

      var config = {
        token: activeToken,
        checkout: {
          settings: {
            displayMode: 'overlay',
            theme: 'light'
          }
        }
      };

      // Paddle Retain support
      if (paddleCustomerId && paddleCustomerId.indexOf('ctm_') === 0) {
        config.pwCustomer = { id: paddleCustomerId };
      }

      window.Paddle.Initialize(config);
      this.initialized = true;
    },

    open: function (priceId, email) {
      if (!window.Paddle) {
        console.error('Paddle.js not loaded.');
        return;
      }
      if (!this.initialized) {
        this.init();
      }

      window.Paddle.Checkout.open({
        items: [{ priceId: priceId, quantity: 1 }],
        customer: email ? { email: email } : undefined
      });
    }
  };

  window.PaddleCheckout = PaddleCheckout;
})(window);

