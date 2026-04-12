// collapsible.js — expand/collapse toggle for FAQ and other collapsible elements
(function () {
  'use strict';

  var collapsibles = document.querySelectorAll('.collapsible');

  collapsibles.forEach(function (btn) {
	btn.addEventListener('click', function () {
	  var expanded = this.getAttribute('aria-expanded') === 'true';
	  this.setAttribute('aria-expanded', String(!expanded));
	  this.classList.toggle('active');

	  var content = this.nextElementSibling;
	  if (content) {
		content.style.display = expanded ? 'none' : 'block';
	  }
	});
  });
}());