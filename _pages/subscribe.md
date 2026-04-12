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
	action="https://api.bestcigarmatches.com/subscribe"
	method="POST"
	novalidate
  >
	<div class="form-group">
	  <label class="form-label" for="subscribe-name">Your name</label>
	  <input
		class="form-input"
		type="text"
		id="subscribe-name"
		name="name"
		required
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

<!-- Subscribe form JS wired in Milestone 5 -->