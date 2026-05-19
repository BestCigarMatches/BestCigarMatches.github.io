/* notify-restock.js — Best Cigar Matches
 * Out-of-stock product pages render a .restock-notify form. On submit, POST to
 * the Flask /subscribe endpoint with channels=['restock-<SKU>'] and a source tag.
 * Replaces the form with a confirmation message on success.
 */
(function () {
  'use strict';

  var apiMeta = document.querySelector('meta[name="api-url"]');
  var API_URL = apiMeta ? apiMeta.content.replace(/\/$/, '') : '';

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains('restock-notify__form')) return;

    e.preventDefault();

    var container = form.closest('.restock-notify');
    if (!container) return;

    var sku    = container.getAttribute('data-product-sku');
    var input  = form.querySelector('.restock-notify__email');
    var button = form.querySelector('.restock-notify__submit');
    var status = container.querySelector('.restock-notify__status');
    var email  = (input.value || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus(status, 'Please enter a valid email address.', false);
      input.focus();
      return;
    }

    if (!API_URL) {
      showStatus(status, 'Something is misconfigured. Please try again later.', false);
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';

    fetch(API_URL + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    email,
        channels: ['restock-' + sku],
        source:   'restock-signup'
      })
    })
      .then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      })
      .then(function (result) {
        if (result.ok) {
          // Replace the form with a success message so the user knows they're done.
          form.style.display = 'none';
          showStatus(status,
            "You're on the list. We'll email you when it's back.",
            true);
        } else {
          showStatus(status,
            (result.body && result.body.error) || 'Something went wrong. Please try again.',
            false);
          button.disabled = false;
          button.textContent = 'Notify Me';
        }
      })
      .catch(function () {
        showStatus(status,
          'Network error. Please check your connection and try again.',
          false);
        button.disabled = false;
        button.textContent = 'Notify Me';
      });
  });

  function showStatus(el, msg, success) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.classList.toggle('restock-notify__status--success', !!success);
    el.classList.toggle('restock-notify__status--error', !success);
  }
})();
