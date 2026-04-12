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
	action="https://api.bestcigarmatches.com/contact"
	method="POST"
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

<!-- Contact form JS wired in Milestone 5 -->