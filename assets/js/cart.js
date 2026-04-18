// cart.js — Best Cigar Matches
// Cart state, drawer, sessionStorage persistence.
// No Stripe calls here — checkout.js handles payment.
//
// Cart key is composite: sku|monogram|monogramStyle|monogramText
// This allows the same SKU to appear multiple times with different
// monogram configurations (or with/without monogram).

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────

  var STORAGE_KEY = 'bcm_cart';

  // Cart item shape:
  // { cartKey, sku, name, price, img, qty, exclusive,
  //   monogram, monogramStyle, monogramText }
  var state = {
    items: []
  };

  // ─── Cart key ─────────────────────────────────────────────────────────────

  function makeCartKey(sku, monogram, monogramStyle, monogramText) {
    // Composite key distinguishes same SKU with different monogram configs
    var mono  = monogram      ? '1' : '0';
    var style = monogramStyle || '';
    var text  = monogramText  || '';
    return sku + '|' + mono + '|' + style + '|' + text;
  }

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

  function findItem(cartKey) {
    return state.items.find(function (i) { return i.cartKey === cartKey; });
  }

  function addToCart(product) {
    // product: { sku, name, price, img, exclusive,
    //            monogram, monogramStyle, monogramText }
    var cartKey  = makeCartKey(
      product.sku,
      product.monogram,
      product.monogramStyle,
      product.monogramText
    );
    var existing = findItem(cartKey);

    if (existing) {
      // Exclusive products: hard cap at 1
      if (existing.exclusive) {
        showCartFeedback('Only one of this item allowed per order.');
        return;
      }
      existing.qty += 1;
    } else {
      state.items.push({
        cartKey:       cartKey,
        sku:           product.sku,
        name:          product.name,
        price:         parseFloat(product.price),
        img:           product.img || '',
        qty:           1,
        exclusive:     product.exclusive     || false,
        monogram:      product.monogram      || false,
        monogramStyle: product.monogramStyle || '',
        monogramText:  product.monogramText  || ''
      });
    }

    saveCart();
    renderCart();
    openDrawer();
  }

  function removeFromCart(cartKey) {
    state.items = state.items.filter(function (i) { return i.cartKey !== cartKey; });
    saveCart();
    renderCart();
  }

  function updateQty(cartKey, delta) {
    var item = findItem(cartKey);
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
      // Monogram upcharge already baked into item.price at add-to-cart time
      return sum + (i.price * i.qty);
    }, 0);
  }

  function formatMoney(amount) {
    return '$' + parseFloat(amount).toFixed(2);
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
      if (emptyEl)  emptyEl.hidden  = false;
      if (footerEl) footerEl.hidden = true;
      var rows = itemsEl.querySelectorAll('.cart-item');
      rows.forEach(function (r) { r.parentNode.removeChild(r); });
      return;
    }

    if (emptyEl)  emptyEl.hidden  = true;
    if (footerEl) footerEl.hidden = false;

    // Remove existing rows before re-render
    var existing = itemsEl.querySelectorAll('.cart-item');
    existing.forEach(function (r) { r.parentNode.removeChild(r); });

    state.items.forEach(function (item) {
      var row = buildItemRow(item);
      itemsEl.appendChild(row);
    });

    if (subtotalEl) {
      subtotalEl.textContent = formatMoney(getSubtotal());
    }

    var payAmountEl = document.getElementById('pay-btn-amount');
    if (payAmountEl) {
      payAmountEl.textContent = formatMoney(getSubtotal());
    }
  }

  function buildItemRow(item) {
    var row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.cartKey = item.cartKey;

    // Image
    var imgEl = document.createElement('img');
    imgEl.className = 'cart-item__img';
    imgEl.src    = item.img || '';
    imgEl.alt    = item.name;
    imgEl.width  = 64;
    imgEl.height = 64;
    row.appendChild(imgEl);

    // Info
    var info = document.createElement('div');
    info.className = 'cart-item__info';

    var nameEl = document.createElement('p');
    nameEl.className   = 'cart-item__name';
    nameEl.textContent = item.name;
    info.appendChild(nameEl);

    // Monogram details
    if (item.monogram && item.monogramText) {
      if (item.monogramStyle) {
        var styleEl = document.createElement('p');
        styleEl.className   = 'cart-item__price';
        styleEl.textContent = 'Style: ' + item.monogramStyle;
        styleEl.style.fontStyle = 'italic';
        info.appendChild(styleEl);
      }
      var monoEl = document.createElement('p');
      monoEl.className   = 'cart-item__price';
      monoEl.textContent = 'Monogram: ' + item.monogramText.toUpperCase();
      monoEl.style.fontStyle = 'italic';
      info.appendChild(monoEl);
    }

    var priceEl = document.createElement('p');
    priceEl.className   = 'cart-item__price';
    priceEl.textContent = formatMoney(item.price);
    info.appendChild(priceEl);

    // Qty controls
    if (!item.exclusive) {
      var qtyWrap = document.createElement('div');
      qtyWrap.className = 'cart-item__qty';
      qtyWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:6px;';

      var minusBtn = document.createElement('button');
      minusBtn.className = 'cart-qty-btn';
      minusBtn.textContent = '−';
      minusBtn.setAttribute('aria-label', 'Decrease quantity');
      minusBtn.addEventListener('click', (function (key) {
        return function () { updateQty(key, -1); };
      })(item.cartKey));

      var qtyLabel = document.createElement('span');
      qtyLabel.className   = 'cart-item__qty-label';
      qtyLabel.textContent = item.qty;
      qtyLabel.style.cssText = 'font-family:var(--font-ui);font-size:0.85rem;min-width:20px;text-align:center;';

      var plusBtn = document.createElement('button');
      plusBtn.className = 'cart-qty-btn';
      plusBtn.textContent = '+';
      plusBtn.setAttribute('aria-label', 'Increase quantity');
      plusBtn.addEventListener('click', (function (key) {
        return function () { updateQty(key, 1); };
      })(item.cartKey));

      qtyWrap.appendChild(minusBtn);
      qtyWrap.appendChild(qtyLabel);
      qtyWrap.appendChild(plusBtn);
      info.appendChild(qtyWrap);
    } else {
      var qtyNote = document.createElement('p');
      qtyNote.className   = 'cart-item__price';
      qtyNote.textContent = 'Qty: 1 (limit 1 per order)';
      info.appendChild(qtyNote);
    }

    row.appendChild(info);

    // Remove button
    var removeBtn = document.createElement('button');
    removeBtn.className   = 'cart-item__remove';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', 'Remove ' + item.name + ' from cart');
    removeBtn.addEventListener('click', (function (key) {
      return function () { removeFromCart(key); };
    })(item.cartKey));
    row.appendChild(removeBtn);

    return row;
  }

  function updateBadge() {
    var badge = document.getElementById('cart-count');
    if (!badge) return;
    var count = getCartCount();
    badge.textContent    = count;
    badge.style.display  = count > 0 ? 'flex' : 'none';
  }

  function showCartFeedback(msg) {
    var footerEl = document.getElementById('cart-footer');
    if (!footerEl) return;
    var existing = footerEl.querySelector('.cart-feedback');
    if (existing) existing.parentNode.removeChild(existing);

    var el = document.createElement('p');
    el.className   = 'cart-feedback fine-print';
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
        var sku           = btn.dataset.productSku;
        var name          = btn.dataset.productName;
        var price         = parseFloat(btn.dataset.productPrice);
        var img           = btn.dataset.productImg || '';
        var exclusive     = btn.dataset.productExclusive === 'true';
        var hasMonogram   = btn.dataset.productMonogram === 'true';
        var monogramPrice = parseFloat(btn.dataset.productMonogramPrice || 0);

        var monogramText  = '';
        var monogramStyle = '';
        var monogramChosen = false;

        if (hasMonogram) {
          var optIn     = document.getElementById('monogram-opt-in');
          var textInput = document.getElementById('monogram-text');
          var styleSelected = document.querySelector('.monogram-style-radio:checked');

          if (optIn && optIn.checked) {
            // Must have selected a style
            if (!styleSelected) {
              showCartFeedback('Please choose a monogram stamp size.');
              return;
            }
            // Must have entered initials
            monogramText = textInput ? textInput.value.toUpperCase().trim() : '';
            if (!monogramText) {
              if (textInput) textInput.focus();
              showCartFeedback('Please enter your initials for the monogram.');
              return;
            }
            monogramChosen = true;
            monogramStyle  = styleSelected.dataset.label || '';
            price          = price + monogramPrice;
          }
        }

        addToCart({
          sku:           sku,
          name:          name,
          price:         price,
          img:           img,
          exclusive:     exclusive,
          monogram:      monogramChosen,
          monogramStyle: monogramStyle,
          monogramText:  monogramText
        });
      });
    });
  }

  // ─── Thumb gallery ────────────────────────────────────────────────────────

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

    var closeBtn = document.getElementById('cart-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    var overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

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