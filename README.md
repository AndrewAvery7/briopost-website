# Briopost website

Public announcement website for [Briopost](https://briopost.com), hosted on GitHub Pages.

Static HTML, CSS and JavaScript. The interactive examples are scripted demonstrations and do not submit information or publish posts.

Run `node scripts/check.mjs` to check local asset references and JavaScript syntax.

## Link card

When briopost.com is shared in a text, post or chat, apps show `assets/briopost-link-card.png` (1200 x 630, set in the `og:` and `twitter:` tags in `index.html`). Its source is `scripts/link-card.html`; after editing it, run `python scripts/render-link-card.py` to redraw the card and `assets/apple-touch-icon.png`.

## Fonts

Inter and Bricolage Grotesque are self-hosted (`assets/inter-var.woff2`, `assets/bricolage-var.woff2`, SIL Open Font License); the site makes no third-party requests except the waitlist sign-up. `scripts/build-fonts.py` rebuilds them from the google/fonts repository.

## Waitlist

The home page form, `/waitlist/confirm/` and `/waitlist/unsubscribe/` call the waitlist API at `https://app.briopost.com/api/waitlist` (set in each page's `data-api` attribute; code in `assets/waitlist.js`). Until `GET /status` answers `open: true`, the form stays disabled and shows "Sign-ups open shortly."

## Screenshots

Real app screenshots live in `assets/shots/` and are placed in the `#studio` and `#templates` sections of `index.html`; to add one, copy a `<figure>` line there.
