// cart.js — Best Cigar Matches
// Cart state, drawer, and sessionStorage persistence.
// Wired up in Milestone 4 (Cart & Checkout).
//
// Responsibilities (Milestone 4):
//   - Maintain cart state (items, quantities, totals) in memory
//   - Add to cart, remove from cart, update quantity
//   - Open/close cart drawer
//   - Update cart icon count badge (#cart-count)
//   - Persist cart to sessionStorage (survives page nav, clears on browser close)
//   - Render cart items in .cart-drawer__items
//   - Calculate and display subtotal in .cart-total__amount
//   - No Stripe calls here — that happens at checkout button click