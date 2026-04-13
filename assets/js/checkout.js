// checkout.js — Best Cigar Matches
// Handles the checkout modal: customer info, Stripe Payment Element, payment submission.
// Depends on cart.js being loaded first (window.BCM_cart must exist).

(function () {
  'use strict';

  // Read Stripe publishable key from meta tag written by head.html / _config.yml
  var stripeKey = (function () {
    var meta = document.querySelector('meta[name="stripe-key"]');
    return meta ? meta.getAttribute('content') : null;
  })();

  // API base URL — injected by Jekyll via a data attribute on the checkout modal,
  // or falls back to the window global set inline by the layout.
  // We read it from a meta tag written by _config.yml → head.html.
  var apiUrl = (function () {
    var meta = document.querySelector('meta[name="api-url"]');
    return meta ? meta.getAttribute('content') : 'https://admin.bestcigarmatches.com';
  })();

  var stripe = null;
  var elements = null;
  var paymentElement = null;

  // Customer info captured in Step 1 — used in Step 2 POST
  var customerInfo = {};

  // ─── Modal open/close ────────────────────────────────────────────────────

  function openCheckout(items, subtotal) {
    if (!stripeKey) {
      console.error('BCM: Stripe publishable key not found.');
      return;
    }

    var modal   = document.getElementById('checkout-modal');
    var overlay = document.getElementById('checkout-overlay');

    if (!modal) return;

    // Reset to Step 1
    showStep('info');
    clearErrors();

    modal.hidden   = false;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Pre-fill pay button amount
    var payAmountEl = document.getElementById('pay-btn-amount');
    if (payAmountEl) payAmountEl.textContent = formatMoney(subtotal);

    // Focus first field
    var firstInput = modal.querySelector('#co-name');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 50);
  }

  function closeCheckout() {
    var modal   = document.getElementById('checkout-modal');
    var overlay = document.getElementById('checkout-overlay');
    if (modal)   modal.hidden = true;
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = '';
    // Destroy payment element if mounted
    if (paymentElement) {
      paymentElement.destroy();
      paymentElement = null;
    }
    elements = null;
  }

  function showStep(step) {
    var infoStep    = document.getElementById('checkout-step-info');
    var paymentStep = document.getElementById('checkout-step-payment');
    if (step === 'info') {
      if (infoStep)    infoStep.hidden = false;
      if (paymentStep) paymentStep.hidden = true;
    } else {
      if (infoStep)    infoStep.hidden = true;
      if (paymentStep) paymentStep.hidden = false;
    }
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  function validateInfoStep() {
    var name     = document.getElementById('co-name');
    var email    = document.getElementById('co-email');
    var address1 = document.getElementById('co-address1');
    var city     = document.getElementById('co-city');
    var state    = document.getElementById('co-state');
    var zip      = document.getElementById('co-zip');

    if (!name.value.trim())     return 'Please enter your name.';
    if (!isValidEmail(email.value)) return 'Please enter a valid email address.';
    if (!address1.value.trim()) return 'Please enter your street address.';
    if (!city.value.trim())     return 'Please enter your city.';
    if (!state.value.trim() || state.value.trim().length !== 2)
                                return 'Please enter your 2-letter state abbreviation.';
    if (!zip.value.trim())      return 'Please enter your ZIP code.';
    return null;
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  // ─── Stripe payment intent ────────────────────────────────────────────────

  function createPaymentIntent(items, customerInfo, callback) {
    var payload = {
      items:        items,
      customer:     customerInfo
    };

    setLoading('info-continue-btn', true);

    fetch(apiUrl + '/create-checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) {
        return res.json().then(function (data) {
          throw new Error(data.error || 'Server error. Please try again.');
        });
      }
      return res.json();
    })
    .then(function (data) {
      setLoading('info-continue-btn', false);
      if (data.client_secret) {
        callback(null, data.client_secret);
      } else {
        callback(new Error('No client secret returned.'));
      }
    })
    .catch(function (err) {
      setLoading('info-continue-btn', false);
      callback(err);
    });
  }

  function mountPaymentElement(clientSecret) {
    if (!stripe) {
      stripe = Stripe(stripeKey);
    }

    elements = stripe.elements({
      clientSecret: clientSecret,
      appearance: {
        theme: 'flat',
        variables: {
          colorPrimary:       '#6B1E2A',
          colorBackground:    '#EDE0C4',
          colorText:          '#1C0F0A',
          colorDanger:        '#A0293A',
          fontFamily:         'Lora, Georgia, serif',
          spacingUnit:        '4px',
          borderRadius:       '6px',
          colorIconTab:       '#5C3D2E',
          colorIconTabSelected: '#6B1E2A'
        },
        rules: {
          '.Input': {
            border:          '1px solid rgba(107, 30, 42, 0.18)',
            backgroundColor: '#EDE0C4'
          },
          '.Input:focus': {
            border:    '1px solid #6B1E2A',
            boxShadow: '0 0 0 3px rgba(107, 30, 42, 0.12)'
          },
          '.Label': {
            fontFamily:    'DM Sans, Helvetica, sans-serif',
            fontSize:      '0.72rem',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color:         '#5C3D2E'
          }
        }
      }
    });

    paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');

    showStep('payment');

    var payAmountEl = document.getElementById('pay-btn-amount');
    if (payAmountEl && window.BCM_cart) {
      payAmountEl.textContent = formatMoney(window.BCM_cart.getSubtotal());
    }
  }

  // ─── Payment submission ───────────────────────────────────────────────────

  function submitPayment() {
    if (!stripe || !elements) return;

    setLoading('pay-btn', true);
    showError('payment-error', null);

    stripe.confirmPayment({
      elements: elements,
      confirmParams: {
        return_url: window.location.origin + '/order-confirmed/',
        payment_method_data: {
          billing_details: {
            name:    customerInfo.name,
            email:   customerInfo.email,
            address: {
              line1:       customerInfo.address1,
              line2:       customerInfo.address2 || '',
              city:        customerInfo.city,
              state:       customerInfo.state,
              postal_code: customerInfo.zip,
              country:     'US'
            }
          }
        }
      }
    })
    .then(function (result) {
      setLoading('pay-btn', false);
      if (result.error) {
        showError('payment-error', result.error.message);
      } else {
        // Payment succeeded — Stripe redirects to return_url
        // Clear cart optimistically before redirect
        if (window.BCM_cart) window.BCM_cart.clearCart();
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function formatMoney(amount) {
    return '$' + parseFloat(amount).toFixed(2);
  }

  function setLoading(btnId, loading) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.origText = btn.textContent;
      btn.textContent = 'Please wait…';
    } else {
      if (btn.dataset.origText) btn.textContent = btn.dataset.origText;
    }
  }

  function showError(elId, msg) {
    var el = document.getElementById(elId);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function clearErrors() {
    showError('info-error', null);
    showError('payment-error', null);
  }

  // ─── Event wiring ────────────────────────────────────────────────────────

  function init() {
    // Close button
    var closeBtn = document.getElementById('checkout-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCheckout);

    // Checkout overlay click closes modal
    var overlay = document.getElementById('checkout-overlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeCheckout();
      });
    }

    // Step 1 → Step 2: validate info, create Payment Intent, mount element
    var continueBtn = document.getElementById('info-continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', function () {
        var error = validateInfoStep();
        if (error) {
          showError('info-error', error);
          return;
        }

        // Capture customer info
        customerInfo = {
          name:     document.getElementById('co-name').value.trim(),
          email:    document.getElementById('co-email').value.trim(),
          address1: document.getElementById('co-address1').value.trim(),
          address2: document.getElementById('co-address2').value.trim(),
          city:     document.getElementById('co-city').value.trim(),
          state:    document.getElementById('co-state').value.trim().toUpperCase(),
          zip:      document.getElementById('co-zip').value.trim(),
          optin:    document.getElementById('co-optin')
                      ? document.getElementById('co-optin').checked
                      : false
        };

        var items = window.BCM_cart ? window.BCM_cart.getItems() : [];

        createPaymentIntent(items, customerInfo, function (err, clientSecret) {
          if (err) {
            showError('info-error', err.message || 'Could not start checkout. Please try again.');
            return;
          }
          mountPaymentElement(clientSecret);
        });
      });
    }

    // Step 2 → Back to Step 1
    var backBtn = document.getElementById('back-to-info-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (paymentElement) {
          paymentElement.destroy();
          paymentElement = null;
        }
        showStep('info');
      });
    }

    // Pay button
    var payBtn = document.getElementById('pay-btn');
    if (payBtn) payBtn.addEventListener('click', submitPayment);

    // Escape key closes checkout modal
    document.addEventListener('keydown', function (e) {
      var modal = document.getElementById('checkout-modal');
      if (e.key === 'Escape' && modal && !modal.hidden) closeCheckout();
    });
  }

  // Expose openCheckout for cart.js to call
  window.BCM_openCheckout = openCheckout;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
