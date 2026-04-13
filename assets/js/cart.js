// cart.js — Best Cigar Matches
// Cart state, drawer, sessionStorage persistence.
// No Stripe calls here — checkout.js handles payment.

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────

  var STORAGE_KEY = 'bcm_cart';

  // Cart item shape:
  // { sku, name, price, img, qty, exclusive, monogram, monogramText }
  var state = {
    items: []
  };

  // ─── Persistence ──────────────────────────────────────────────────────────

  function saveCart() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (e) {
      // sessionStorage unavailable — cart still works in memory
    }
  }

  function loadCart() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          state.items = parsed;
        }
      }
    } catch (e) {
      state.items = [];
    }
  }

  // ─── Cart operations ──────────────────────────────────────────────────────

  function findItem(sku) {
    return state.items.find(function (i) { return i.sku === sku; });
  }

  function addToCart(product) {
    // product: { sku, name, price, img, exclusive, monogram, monogramText }
    var existing = findItem(product.sku);

    if (existing) {
      // Exclusive products: hard cap at 1
      if (existing.exclusive) {
        showCartFeedback('Only one of this item allowed per order.');
        return;
      }
      existing.qty += 1;
    } else {
      state.items.push({
        sku:          product.sku,
        name:         product.name,
        price:        parseFloat(product.price),
        img:          product.img || '',
        qty:          1,
        exclusive:    product.exclusive || false,
        monogram:     product.monogram || false,
        monogramText: product.monogramText || ''
      });
    }

    saveCart();
    renderCart();
    openDrawer();
  }

  function removeFromCart(sku) {
    state.items = state.items.filter(function (i) { return i.sku !== sku; });
    saveCart();
    renderCart();
  }

  function updateQty(sku, delta) {
    var item = findItem(sku);
    if (!item) return;
    // Exclusive items are always qty 1 — no increment allowed
    if (item.exclusive) return;
    item.qty = Math.max(1, item.qty + delta);
    saveCart();
    renderCart();
  }

  function clearCart() {
    state.items = [];
    saveCart();
    renderCart();
  }

  // ─── Calculations ─────────────────────────────────────────────────────────

  function getCartCount() {
    return state.items.reduce(function (sum, i) { return sum + i.qty; }, 0);
  }

  function getSubtotal() {
    return state.items.reduce(function (sum, i) {
      var linePrice = i.price;
      // Monogram upcharge is already baked into item.price at add-to-cart time
      return sum + (linePrice * i.qty);
    }, 0);
  }

  function formatMoney(cents) {
    // Prices are stored as dollars (float), not cents
    return '$' + cents.toFixed(2);
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  function renderCart() {
    updateBadge();

    var itemsEl    = document.getElementById('cart-items');
    var emptyEl    = document.getElementById('cart-empty');
    var footerEl   = document.getElementById('cart-footer');
    var subtotalEl = document.getElementById('cart-subtotal');

    if (!itemsEl) return;

    if (state.items.length === 0) {
      // Show empty state, hide footer
      if (emptyEl) emptyEl.hidden = false;
      if (footerEl) footerEl.hidden = true;
      // Clear any item rows (keep empty state div)
      var rows = itemsEl.querySelectorAll('.cart-item');
      rows.forEach(function (r) { r.parentNode.removeChild(r); });
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (footerEl) footerEl.hidden = false;

    // Remove existing item rows before re-render
    var existing = itemsEl.querySelectorAll('.cart-item');
    existing.forEach(function (r) { r.parentNode.removeChild(r); });

    // Build and insert item rows
    state.items.forEach(function (item) {
      var row = buildItemRow(item);
      itemsEl.appendChild(row);
    });

    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(getSubtotal());
    }

    // Update pay button amount in checkout modal if visible
    var payAmountEl = document.getElementById('pay-btn-amount');
    if (payAmountEl) {
      payAmountEl.textContent = formatMoney(getSubtotal());
    }
  }

  function buildItemRow(item) {
    var row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.sku = item.sku;

    // Image
    var imgEl = document.createElement('img');
    imgEl.className = 'cart-item__img';
    imgEl.src = item.img || '';
    imgEl.alt = item.name;
    imgEl.width = 64;
    imgEl.height = 64;
    row.appendChild(imgEl);

    // Info
    var info = document.createElement('div');
    info.className = 'cart-item__info';

    var nameEl = document.createElement('p');
    nameEl.className = 'cart-item__name';
    nameEl.textContent = item.name;
    info.appendChild(nameEl);

    // Monogram note
    if (item.monogram && item.monogramText) {
      var monoEl = document.createElement('p');
      monoEl.className = 'cart-item__price';
      monoEl.textContent = 'Monogram: ' + item.monogramText.toUpperCase();
      monoEl.style.fontStyle = 'italic';
      info.appendChild(monoEl);
    }

    var priceEl = document.createElement('p');
    priceEl.className = 'cart-item__price';
    priceEl.textContent = formatMoney(item.price);
    info.appendChild(priceEl);

    // Qty controls — exclusive items show qty label only (no stepper)
    if (!item.exclusive) {
      var qtyWrap = document.createElement('div');
      qtyWrap.className = 'cart-item__qty';
      qtyWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:6px;';

      var minusBtn = document.createElement('button');
      minusBtn.className = 'cart-qty-btn';
      minusBtn.textContent = '−';
      minusBtn.setAttribute('aria-label', 'Decrease quantity');
      minusBtn.addEventListener('click', function () { updateQty(item.sku, -1); });

      var qtyLabel = document.createElement('span');
      qtyLabel.className = 'cart-item__qty-label';
      qtyLabel.textContent = item.qty;
      qtyLabel.style.cssText = 'font-family:var(--font-ui);font-size:0.85rem;min-width:20px;text-align:center;';

      var plusBtn = document.createElement('button');
      plusBtn.className = 'cart-qty-btn';
      plusBtn.textContent = '+';
      plusBtn.setAttribute('aria-label', 'Increase quantity');
      plusBtn.addEventListener('click', function () { updateQty(item.sku, 1); });

      qtyWrap.appendChild(minusBtn);
      qtyWrap.appendChild(qtyLabel);
      qtyWrap.appendChild(plusBtn);
      info.appendChild(qtyWrap);
    } else {
      var qtyNote = document.createElement('p');
      qtyNote.className = 'cart-item__price';
      qtyNote.textContent = 'Qty: 1 (limit 1 per order)';
      info.appendChild(qtyNote);
    }

    row.appendChild(info);

    // Remove button
    var removeBtn = document.createElement('button');
    removeBtn.className = 'cart-item__remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Remove ' + item.name + ' from cart');
    removeBtn.addEventListener('click', function () { removeFromCart(item.sku); });
    row.appendChild(removeBtn);

    return row;
  }

  function updateBadge() {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    var count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function showCartFeedback(msg) {
    // Brief inline feedback — reuses the cart drawer area
    var footerEl = document.getElementById('cart-footer');
    if (!footerEl) return;
    var existing = footerEl.querySelector('.cart-feedback');
    if (existing) existing.parentNode.removeChild(existing);

    var el = document.createElement('p');
    el.className = 'cart-feedback fine-print';
    el.textContent = msg;
    el.style.cssText = 'color:var(--accent);margin-bottom:10px;';
    footerEl.insertBefore(el, footerEl.firstChild);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }

  // ─── Drawer open/close ────────────────────────────────────────────────────

  function openDrawer() {
    var drawer  = document.getElementById('cart-drawer');
    var overlay = document.getElementById('cart-overlay');
    var toggle  = document.getElementById('cart-toggle');
    if (drawer)  drawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-visible');
    if (toggle)  toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    var drawer  = document.getElementById('cart-drawer');
    var overlay = document.getElementById('cart-overlay');
    var toggle  = document.getElementById('cart-toggle');
    if (drawer)  drawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-visible');
    if (toggle)  toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // ─── Add to Cart button wiring ────────────────────────────────────────────

  function wireAddToCartButtons() {
    var buttons = document.querySelectorAll('.btn-add-to-cart');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sku       = btn.dataset.productSku;
        var name      = btn.dataset.productName;
        var price     = parseFloat(btn.dataset.productPrice);
        var img       = btn.dataset.productImg || '';
        var exclusive = btn.dataset.productExclusive === 'true';
        var hasMonogram     = btn.dataset.productMonogram === 'true';
        var monogramPrice   = parseFloat(btn.dataset.productMonogramPrice || 0);

        // If this product supports monograms, read the opt-in state
        var monogramText = '';
        var monogramChosen = false;
        if (hasMonogram) {
          var optIn = document.getElementById('monogram-opt-in');
          var textInput = document.getElementById('monogram-text');
          if (optIn && optIn.checked) {
            monogramChosen = true;
            monogramText = textInput ? textInput.value.toUpperCase().trim() : '';
            if (!monogramText) {
              textInput && textInput.focus();
              return; // Don't add without initials entered
            }
            price = price + monogramPrice; // Upcharge baked into line item price
          }
        }

        addToCart({
          sku:          sku,
          name:         name,
          price:        price,
          img:          img,
          exclusive:    exclusive,
          monogram:     monogramChosen,
          monogramText: monogramText
        });
      });
    });
  }

  // ─── Thumb gallery (product page) ─────────────────────────────────────────

  function wireThumbGallery() {
    var thumbs  = document.querySelectorAll('.product-detail__thumb');
    var mainImg = document.getElementById('product-img-main');
    if (!mainImg || !thumbs.length) return;
    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        mainImg.src = thumb.src;
        thumbs.forEach(function (t) { t.style.opacity = '0.75'; });
        thumb.style.opacity = '1';
      });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    loadCart();
    renderCart();
    wireAddToCartButtons();
    wireThumbGallery();

    // Cart toggle button
    var toggleBtn = document.getElementById('cart-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var drawer = document.getElementById('cart-drawer');
        if (drawer && drawer.classList.contains('is-open')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });
    }

    // Close button inside drawer
    var closeBtn = document.getElementById('cart-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Overlay click closes drawer
    var overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Escape key closes drawer
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    // Checkout button — hands off to checkout.js
    var checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        closeDrawer();
        if (typeof window.BCM_openCheckout === 'function') {
          window.BCM_openCheckout(state.items, getSubtotal());
        }
      });
    }
  }

  // Expose what checkout.js needs
  window.BCM_cart = {
    getItems:    function () { return state.items; },
    getSubtotal: getSubtotal,
    clearCart:   clearCart
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
