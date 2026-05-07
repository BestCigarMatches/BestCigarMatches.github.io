---
layout: page
title: Order Received
description: "Your Best Cigar Matches order has been received."
permalink: /order-confirmed/
page_ident: ORDER RECEIVED
---

Your order is in. Thank you.

You'll receive a confirmation email shortly. If anything looks off, [get in touch](/contact/) and we'll sort it out.

**Ships Tuesday.** Orders placed after Monday at midnight (12:00 AM ET) go out the following week.

— Aaron & Lindsay

<script>
// Clear cart on successful order — this page only loads after payment completes.
// Runs after cart.js has initialized via buttonjs.html.
(function () {
  try {
	sessionStorage.removeItem('bcm_cart');
  } catch (e) {}
  // Also clear via cart API if available
  if (window.BCM_cart && typeof window.BCM_cart.clearCart === 'function') {
	window.BCM_cart.clearCart();
  }
})();
</script>