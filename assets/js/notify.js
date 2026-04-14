/* notify.js — coming soon page email capture
   Subscribes to new-products channel via Flask /subscribe endpoint.
   No dependencies. Vanilla JS. */

(function () {
  'use strict';

  var ENDPOINT = 'https://admin.bestcigarmatches.com/subscribe';

  var emailInput = document.getElementById('cs-email');
  var submitBtn  = document.getElementById('cs-submit');
  var statusEl   = document.getElementById('cs-status');

  if (!emailInput || !submitBtn || !statusEl) return;

  function setStatus(msg, type) {
	statusEl.textContent = msg;
	statusEl.className   = 'cs-notify__status' + (type ? ' is-' + type : '');
  }

  function setLoading(loading) {
	submitBtn.disabled    = loading;
	submitBtn.textContent = loading ? 'Sending…' : 'Notify Me';
  }

  function isValidEmail(val) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  submitBtn.addEventListener('click', function () {
	var email = emailInput.value.trim();

	if (!email) {
	  setStatus('Please enter your email address.', 'error');
	  emailInput.focus();
	  return;
	}

	if (!isValidEmail(email)) {
	  setStatus('That doesn\'t look like a valid email address.', 'error');
	  emailInput.focus();
	  return;
	}

	setLoading(true);
	setStatus('');

	fetch(ENDPOINT, {
	  method:  'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body:    JSON.stringify({
		email:    email,
		channels: ['new-products']
	  })
	})
	.then(function (res) {
	  if (!res.ok) {
		return res.json().then(function (data) {
		  throw new Error(data.message || 'Something went wrong.');
		});
	  }
	  return res.json();
	})
	.then(function () {
	  setStatus('You\'re on the list. We\'ll be in touch.', 'success');
	  emailInput.value   = '';
	  submitBtn.disabled = true;
	})
	.catch(function (err) {
	  setStatus(err.message || 'Something went wrong. Please try again.', 'error');
	  setLoading(false);
	});
  });

  /* Allow Enter key to submit */
  emailInput.addEventListener('keydown', function (e) {
	if (e.key === 'Enter') submitBtn.click();
  });

}());