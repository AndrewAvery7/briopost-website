# Briopost website

Public announcement website for [Briopost](https://briopost.com), hosted on GitHub Pages.

Static HTML, CSS and JavaScript. The interactive examples are scripted demonstrations and do not submit information or publish posts.

Run `node scripts/check.mjs` to check local asset references and JavaScript syntax.

## Link card

When briopost.com is shared in a text, post or chat, apps show `assets/briopost-link-card.png` (1200 x 630, set in the `og:` and `twitter:` tags in `index.html`). Its source is `scripts/link-card.html`; after editing it, run `python scripts/render-link-card.py` to redraw the card and `assets/apple-touch-icon.png`.
