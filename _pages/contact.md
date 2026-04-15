---
layout: page
title: Contact
description: "Get in touch with Best Cigar Matches. Questions, orders, or just want to talk cigars."
permalink: /contact/
page_ident: CONTACT
---

We're a small operation and we read everything that comes in. Lindsay handles correspondence and she's good at it — you'll hear back.

Use the form below for questions, order inquiries, or anything else. If you're asking about a monogram on a leather piece, include the characters and lettering style you're interested in.

<div class="contact-form-wrap">
  <form
	id="contact-form"
	class="contact-form"
	novalidate
  >
	<div class="form-group">
	  <label class="form-label" for="contact-name">Your name</label>
	  <input
		class="form-input"
		type="text"
		id="contact-name"
		name="name"
		required
		autocomplete="name"
		placeholder="First and last"
	  >
	</div>

	<div class="form-group">
	  <label class="form-label" for="contact-email">Email address</label>
	  <input
		class="form-input"
		type="email"
		id="contact-email"
		name="email"
		required
		autocomplete="email"
		placeholder="you@example.com"
	  >
	</div>

	<div class="form-group">
	  <label class="form-label" for="contact-message">Message</label>
	  <textarea
		class="form-textarea"
		id="contact-message"
		name="message"
		required
		rows="6"
		placeholder="What's on your mind?"
	  ></textarea>
	</div>

	<button class="btn btn-primary" type="submit" id="contact-submit">
	  Send Message
	</button>

	<div class="contact-form__status" id="contact-status" aria-live="polite"></div>
  </form>
</div>

<script>
(function () {
  var form      = document.getElementById('contact-form');
  var submitBtn = document.getElementById('contact-submit');
  var statusEl  = document.getElementById('contact-status');
  var apiUrl    = (document.querySelector('meta[name="api-url"]') || {}).content
                  || 'https://admin.bestcigarmatches.com';

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name    = document.getElementById('contact-name').value.trim();
    var email   = document.getElementById('contact-email').value.trim();
    var message = document.getElementById('contact-message').value.trim();

    if (!name || !email || !message) {
      setStatus('error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    setStatus('', '');

    fetch(apiUrl + '/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name, email: email, message: message })
    })
    .then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      setLoading(false);
      if (result.ok) {
        setStatus('success', 'Message sent. You\'ll hear back soon.');
        form.reset();
      } else {
        setStatus('error', result.data.error || 'Something went wrong. Please try again.');
      }
    })
    .catch(function () {
      setLoading(false);
      setStatus('error', 'Could not send message. Please try again.');
    });
  });

  function setLoading(loading) {
    submitBtn.disabled    = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Send Message';
  }

  function setStatus(type, msg) {
    statusEl.textContent = msg;
    statusEl.className   = 'contact-form__status' + (type ? ' is-' + type : '');
  }
})();
</script>
