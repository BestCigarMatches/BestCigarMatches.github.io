---
layout: page
title: Stay in the Loop
description: "Sign up for updates from Best Cigar Matches — new products, restocks, and notes from the bench."
permalink: /subscribe/
page_ident: STAY IN THE LOOP
---

No spam. No noise. We send something when there's something worth sending — a new product, a restock, an occasional note from the bench. That's it.

<div class="subscribe-form-wrap">
  <form
	id="subscribe-form"
	class="subscribe-form"
	novalidate
  >
	<div class="form-group">
	  <label class="form-label" for="subscribe-name">Your name</label>
	  <input
		class="form-input"
		type="text"
		id="subscribe-name"
		name="name"
		autocomplete="given-name"
		placeholder="First name is fine"
	  >
	</div>

	<div class="form-group">
	  <label class="form-label" for="subscribe-email">Email address</label>
	  <input
		class="form-input"
		type="email"
		id="subscribe-email"
		name="email"
		required
		autocomplete="email"
		placeholder="you@example.com"
	  >
	</div>

	<div class="form-group">
	  <p class="form-label" id="channels-label">I'm interested in</p>
	  <div class="form-checkboxes" role="group" aria-labelledby="channels-label">

		<label class="form-check">
		  <input type="checkbox" name="channels" value="new-products" checked>
		  <span>New products</span>
		</label>

		<label class="form-check">
		  <input type="checkbox" name="channels" value="restocks" checked>
		  <span>Restocks</span>
		</label>

		<label class="form-check">
		  <input type="checkbox" name="channels" value="matches" checked>
		  <span>Matches</span>
		</label>

		<label class="form-check">
		  <input type="checkbox" name="channels" value="leather-goods">
		  <span>Leather goods</span>
		</label>

		<label class="form-check">
		  <input type="checkbox" name="channels" value="journal">
		  <span>Journal posts</span>
		</label>

	  </div>
	</div>

	<button class="btn btn-primary" type="submit" id="subscribe-submit">
	  Subscribe
	</button>

	<div class="subscribe-form__status" id="subscribe-status" aria-live="polite"></div>

  </form>
</div>

<p class="fine-print mt-3">Unsubscribe any time — every email has a link. We don't share your address with anyone.</p>

<script>
(function () {
  var form      = document.getElementById('subscribe-form');
  var submitBtn = document.getElementById('subscribe-submit');
  var statusEl  = document.getElementById('subscribe-status');
  var apiUrl    = (document.querySelector('meta[name="api-url"]') || {}).content
                  || 'https://admin.bestcigarmatches.com';

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name  = document.getElementById('subscribe-name').value.trim();
    var email = document.getElementById('subscribe-email').value.trim();

    if (!email) {
      setStatus('error', 'Please enter your email address.');
      return;
    }

    var channelBoxes = form.querySelectorAll('input[name="channels"]:checked');
    var channels = Array.from(channelBoxes).map(function (cb) { return cb.value; });

    setLoading(true);
    setStatus('', '');

    fetch(apiUrl + '/subscribe', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name, email: email, channels: channels })
    })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      setLoading(false);
      if (result.ok) {
        setStatus('success', 'You\'re in. Welcome to the list.');
        form.reset();
      } else {
        setStatus('error', result.data.error || 'Something went wrong. Please try again.');
      }
    })
    .catch(function () {
      setLoading(false);
      setStatus('error', 'Could not subscribe. Please try again.');
    });
  });

  function setLoading(loading) {
    submitBtn.disabled    = loading;
    submitBtn.textContent = loading ? 'Subscribing…' : 'Subscribe';
  }

  function setStatus(type, msg) {
    statusEl.textContent = msg;
    statusEl.className   = 'subscribe-form__status' + (type ? ' is-' + type : '');
  }
})();
</script>
