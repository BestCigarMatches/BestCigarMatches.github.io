/* filter.js — shop category filter
   Reads data-category on .product-card elements.
   Reads data-filter on .filter-btn elements.
   No framework. No dependencies. */

(function () {
  'use strict';

  var filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return; // only runs on shop page

  var buttons = filterBar.querySelectorAll('.filter-btn');
  var cards   = document.querySelectorAll('.product-card');

  function setActive(btn) {
    buttons.forEach(function (b) {
      b.classList.remove('filter-btn--active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('filter-btn--active');
    btn.setAttribute('aria-pressed', 'true');
  }

  function filterCards(category) {
    cards.forEach(function (card) {
      if (category === 'all' || card.dataset.category === category) {
        card.style.display = '';
        card.removeAttribute('aria-hidden');
      } else {
        card.style.display = 'none';
        card.setAttribute('aria-hidden', 'true');
      }
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setActive(btn);
      filterCards(btn.dataset.filter);
    });
  });

}());
