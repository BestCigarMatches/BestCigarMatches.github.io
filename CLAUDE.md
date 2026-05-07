# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bundle exec jekyll serve --config _config.yml,_config.dev.yml` — **standard local dev command.** Merges `_config.dev.yml` (gitignored) overrides over `_config.yml`. Critical because `_config.dev.yml` pins Stripe to a `pk_test_*` publishable key — without it, local dev would hit live Stripe once `_config.yml` is switched to `pk_live_*` for prod. Live reload at http://localhost:4000.
- `bundle exec jekyll serve` — bare command, **not for use post-Stripe-live-flip.** Reads only `_config.yml`. Safe today (everything is still test mode), unsafe after live flip.
- `bundle exec jekyll serve --drafts` — include draft posts (add `--config _config.yml,_config.dev.yml` for the same Stripe-safety reason).
- `bundle exec jekyll build` — one-shot build to `_site/`. Production builds via GitHub Pages always use `_config.yml` only — `_config.dev.yml` never reaches Pages because it's gitignored.
- `bundle install` — install gem dependencies after Gemfile changes.
- After editing `_config.yml` or `_config.dev.yml`, restart `jekyll serve`.

There is no test suite, linter, or JS build step. Jekyll is the only build.

## Stack & Hosting

- **Jekyll 4.3** static site, deployed by **GitHub Pages from the `main` branch**. `CNAME` at the repo root pins the custom domain (`bestcigarmatches.com`).
- **No theme** (Minima removed). All layouts in `_layouts/` are hand-written; do not reintroduce a theme dependency.
- **No JS framework, no preprocessor, no build step.** Vanilla JS in `assets/js/`, single `assets/css/main.css` driven by CSS custom properties.
- **Media is served from Bunny CDN** at `https://bcm-media.b-cdn.net/...`. Image paths follow `https://bcm-media.b-cdn.net/products/[slug]/[slug]-NN.jpg`. Upload to Bunny → image goes live; no commit needed.

## The Two-System Architecture

The repo you're in is **only the public Jekyll site**. There is a second system, the Flask admin app, that is **not in this repo**:

- Lives on PythonAnywhere at `https://admin.bestcigarmatches.com`
- Source lives at `/home/aaronaiken/bcm/` on PythonAnywhere — NOT in version control here
- Owns: `/create-checkout`, `/webhook` (Stripe), `/contact`, `/subscribe`, `/unsubscribe`, all `/admin/*` routes, orders/subscribers/users JSON storage, Shippo label generation, newsletter sender, invoice flow

The two systems meet at the network boundary only. The Jekyll side knows the Flask base URL via `site.api_url` in `_config.yml`, exposed to JS through `<meta name="api-url">` in `_includes/head.html`. Treat the Flask app as a black box from this repo — never assume you can edit it. Background on the admin app lives in `.kt/admin-architecture.md` (gitignored but present locally).

## Cart & Checkout (the core JS flow)

Three files implement the storefront flow. Read them together if you touch any of them:

- `_layouts/product.html` — emits an Add to Cart button with `data-product-*` attributes (sku, name, price, img, exclusive, monogram, monogram-price, monogram-style). For monogram-eligible products it also renders the opt-in / style picker / initials input UI and an inline script that writes the chosen style label back onto the button.
- `assets/js/cart.js` — owns cart state (in-memory + `sessionStorage` under key `bcm_cart`), the cart drawer, qty controls, and the Add-to-Cart button wiring. Exposes `window.BCM_cart` (`getItems`, `getSubtotal`, `clearCart`).
- `assets/js/checkout.js` — owns the two-step checkout modal (info → Stripe Payment Element). Reads Stripe publishable key from `<meta name="stripe-key">` and the API base from `<meta name="api-url">`. Calls `apiUrl + '/create-checkout'` and uses the returned `client_secret` to mount Stripe's Payment Element. On success Stripe redirects to `/order-confirmed/`. Exposes `window.BCM_openCheckout(items, subtotal)`.

`cart.js` must load before `checkout.js`. Both are pulled in via `_includes/buttonjs.html`, which every layout that needs the cart includes near `</body>`.

### Composite cart key — important

Items are keyed by `sku|monogram|monogramStyle|monogramText`, not by SKU alone. This is intentional: the same SKU with different monogram configurations (e.g. one plain + one with initials "AAA") must appear as separate line items in the drawer and in the Stripe Payment Intent. Don't refactor cart lookups back to bare SKU.

### Trust boundary

**Prices and monogram upcharges are validated server-side in Flask.** Client-sent prices are never trusted. The Jekyll side computes a display subtotal for UX; the authoritative total is what Flask returns from `/create-checkout`. When adding a product, mirror the price in the Flask `PRODUCTS` dict (in `routes/checkout.py` on PythonAnywhere) — otherwise the SKU will be rejected at checkout.

### Exclusive products

`exclusive: true` in product front matter caps the line at qty 1 in the cart and disables qty controls. Used for one-of-a-kind items.

## Content Model

Two Jekyll collections:

- **`_products/`** → permalink `/shop/:name/`, layout defaults to `product`, `in_stock: false` and `exclusive: false` by default (see `defaults` block in `_config.yml`). The shop index (`_pages/shop.md` → `_layouts/shop.html`) builds its grid from `site.products`, sorting featured products first via Liquid. `assets/js/filter.js` runs the category filter bar on shop pages — it reads `data-category` on cards and `data-filter` on buttons.
- **`_pages/`** → permalink `/:name/`. All standalone pages (about, contact, faq, shop, subscribe, etc.) live here.

### Product front matter contract

Required: `name`, `sku`, `price` (numeric, used for cart math), `price_display` (formatted string), `category`, `images` (list of absolute Bunny URLs), `short_desc`, `in_stock`. Optional: `featured`, `exclusive`, `stripe_price_id`, `related` (list of SKUs), and the monogram block (`monogram: true`, `monogram_price`, `monogram_turnaround`, `monogram_styles[]` with `id`/`label`/`desc`/`image_detail`/`image_case`).

`category` values used by the filter bar: `matches`, `leather-cigar-cases`, `leather-match-accessories`, `small-leather-goods`. SKU prefixes follow that taxonomy: `BCM-M-*`, `BCM-CC-*`, `BCM-LA-*`, `BCM-SL-*`.

Related products are resolved by SKU in `_layouts/product.html` via `where: "sku", sku` — Jekyll collections don't expose a `slug` property, so don't try to match on it.

## Coming-Soon Mode (current state)

`index.md` is currently set to `layout: coming-soon`, which is a standalone layout with no nav/footer chrome. `assets/js/notify.js` POSTs the email field to `apiUrl + '/subscribe'` with `channels: ['new-products']`. To switch to the full homepage, change `index.md`'s layout back to `default`. The coming-soon layout and `notify.js` should stay in place after launch.

## Styling Conventions

- Single `assets/css/main.css`, organised by section, no Sass.
- All colors/spacing/typography via CSS custom properties. Two palettes — light (parchment) and dark (espresso) — switched purely by `prefers-color-scheme`. There is no manual dark-mode toggle and the public site doesn't use the CRT/scanline aesthetic from the admin app.
- 18px base font size on `body` is non-negotiable.
- Fonts loaded from Bunny Fonts (privacy-respecting): Cormorant Garamond (display), Lora (body), DM Sans (UI/labels).
- `[hidden] { display: none !important; }` is in the reset block on purpose — required so layout CSS doesn't override the HTML `hidden` attribute used to gate the checkout modal steps.

## Do Not / Gotchas

- **Never apply Liquid's `| relative_url` filter to Bunny CDN URLs.** It prepends `baseurl` and corrupts the absolute URL. Reserve `relative_url` for site-relative paths (own assets, internal pages).
- **Quote YAML front matter values that contain em dashes, commas, or other punctuation.** Jekyll fails silently on parse errors and renders blank pages. Prefer flat front-matter fields over nested lists for the same reason — nested structures have caused silent failures here before.
- **Don't mix the public-site aesthetic with the admin aesthetic.** The Cockpit/Nerdy-Girl themes and CRT/VT323 elements belong to the admin app only. The public site is "candlelight, not CRT."
- **Don't add Google Analytics, Meta Pixel, or any tracking pixel.** Site policy is Tinylytics-only, no tracking.
- **`localhost:4000` cannot complete a real checkout.** Flask CORS is locked to `https://bestcigarmatches.com`. End-to-end checkout testing happens in production — see "Production smoke test" in the launch punch list. Don't loosen CORS in committed code; do the test card + immediate refund dance against the real domain instead.

## Branches & Commits

- `main` — production. GitHub Pages serves from here. The only long-lived branch.
- `feature/<name>` — short-lived working branches off `main`. Merge back via `git checkout main && git merge --no-ff feature/<name>`, then push, then `git branch -d feature/<name>`. Delete the remote branch too.
- The previous `feature/* → dev → staging → main` flow was retired 2026-05-07 — single-developer overhead without benefit. If a future contributor joins, revisit.
- One commit per issue when practical. Auto-close syntax (`Closes #N`) fires on merge to `main`.
- **Commit messages are written in Han Solo voice.** Example tone: `Punch it. Cart wired, forms live, checkout modal fixed, new product added. Closes #72 #74 #55 #33`. This is a deliberate stylistic choice — match it.

## Local-Only Knowledge

The `.kt/` directory is gitignored and contains long-form knowledge-transfer docs maintained by hand (`admin-architecture.md`, `decisions.md`, `PROJECT_KNOWLEDGE.md`, `KT-design-system.md`). When you need history, rationale, or details about the Flask side that aren't obvious from the code in this repo, read those files locally. They are authoritative for context but should not be relied on by future tooling that only sees committed files.
