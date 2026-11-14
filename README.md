# Briopost website

Public announcement website for [Briopost](https://briopost.com), hosted on GitHub Pages.

Static HTML, CSS and JavaScript. The interactive examples are scripted demonstrations and do not submit information or publish posts.

Run `node scripts/check.mjs` to check local asset references, JavaScript syntax, and the search and analytics rules below (titles, descriptions, canonical addresses, link-preview tags, structured data, the sitemap and the analytics line). It prints warnings for the four legal pages until their generator emits the newer head tags.

## Link card

When briopost.com is shared in a text, post or chat, apps show `assets/briopost-link-card.png` (1200 x 630, set in the `og:` and `twitter:` tags in `index.html`). Since 2026-11-13 it is the brand kit's share image (`docs/brand/kit/social/share-image-1200x630.png` in the app repo); copy that file again when the kit changes. `scripts/link-card.html` and `python scripts/render-link-card.py` still draw `assets/apple-touch-icon.png` and the `icon-*.png` files, but the card they draw is the older "Coming soon" design: do not copy it over the brand kit card.

## Logo

Every page header uses `assets/briopost-lockup.svg`, the brand kit's horizontal dark lockup (`docs/brand/kit/logo/briopost-lockup-horizontal-dark.svg`, with the ™ built in). Never retype the wordmark in HTML.

## Interactive home page

- `assets/preview.js`: the sample in the hero. Three hand-written topics (Sales, Leadership, Career) and a box where visitors type their own thought; "Shape it" lays it into a fixed design (cover, the idea, a closing question) in all four formats. Nothing is sent, generated or posted, and the page says so; analytics records only that a topic or Shape it was clicked, never the words.
- `assets/motion.js` + `assets/interactive.css`: sections rise in on scroll, the How it works line and step 4 pulse, the "Give my OK" sample, larger screenshots on click, and a tilt on the template cards. Reduced motion turns movement off; the page works without the script.

## Home page film

`assets/film/`: a 30-second silent loop in the Studio section (WebM first, MP4 fallback, WebP poster at 9.1 s). It plays only while on screen, waits for Play when the visitor has reduced motion on, and has a Pause/Play button (`assets/motion.js`, step 6). Its HyperFrames source, the 1920 master and render notes live in the app repo at `docs/films/home-loop/`; re-render there and copy the three web files here.

Below it, **Watch with sound (37 s)** opens the narrated version (voice and music) in a dialog: `briopost-home-narrated.webm` / `.mp4`, poster `briopost-home-narrated-poster.webp`, and English captions `briopost-home-narrated.en.vtt`. It starts from the click (browsers only allow sound then), pauses the silent loop while it plays and resumes it on close. A **Captions: On / Off** button shows or hides the captions; the choice is kept in the visitor's browser only, and the player's own CC menu stays in step (`assets/motion.js`, step 7). Its source lives in the app repo at `docs/films/home-narrated/`; re-render there and copy the four web files (and the captions file if the script changes) here.

## Beta tester guide

`/beta/` (noindex, not in the sitemap): sign-in steps, five things to try (ticks kept in the visitor's browser only, `assets/beta.js`), how to send feedback (info@briopost.com) and short answers that match Terms section 17. The tester sign-up messages in `assets/waitlist.js` link to it, and so does the test-account email in the app.

## Fonts

Inter and Bricolage Grotesque are self-hosted (`assets/inter-var.woff2`, `assets/bricolage-var.woff2`, SIL Open Font License). Outside requests: the waitlist API, the Cloudflare Web Analytics beacon, and Google Analytics once its ID is set (below). `scripts/build-fonts.py` rebuilds them from the google/fonts repository.

## Waitlist

The home page form, `/waitlist/confirm/` and `/waitlist/unsubscribe/` call the waitlist API at `https://app.briopost.com/api/waitlist` (set in each page's `data-api` attribute; code in `assets/waitlist.js`). Until `GET /status` answers `open: true`, the form stays disabled and shows "Sign-ups open shortly."

## Screenshots

Real app screenshots live in `assets/shots/` and are placed in the `#studio` and `#templates` sections of `index.html`; to add one, copy a `<figure>` line there.

## Google Analytics 4

`assets/analytics.js` is loaded on every page with exactly `<script src="/assets/analytics.js" defer></script>` (the legal-page generator emits the same line). It holds `const GA_MEASUREMENT_ID = "";` near the top. While that is empty the file does nothing: no Google request, no cookies, no events. To switch it on, paste the Measurement ID from Google Analytics (Admin > Data streams > the briopost.com stream, it looks like `G-AB12CD34EF`) between the quotes and merge. It counts every visitor, with no consent banner (the owner's decision), and only on briopost.com; add `?ga_debug=1` to an address to test anywhere else and see the visit in GA's DebugView.

In the GA stream's Enhanced measurement settings, turn off **Outbound clicks** and **File downloads**: this file sends both itself (`outbound_click`, `file_download`), so leaving them on counts them twice. Leave page views, scrolls and site search on.

Events it sends (all only when the ID is set):

| Event | When |
| --- | --- |
| `page_view` | Every page (GA's own). `?ref=tag` links count as source `tag`, medium `referral`, campaign `ref_link` unless the link already has `utm_` tags. The confirm/unsubscribe `?token=` is removed before anything is sent. |
| `waitlist_form_start` | First time someone clicks into a waitlist form (`form_location`: `hero` or `waitlist_section`). |
| `generate_lead` and `sign_up` | A new sign-up the server accepted ("Check your inbox"). Mark `generate_lead` as a key event in GA. |
| `waitlist_already_joined` | The address was already confirmed. |
| `waitlist_error` | A sign-up failed (`error_reason`: `validation`, `closed`, `rate_limited`, `rejected`, `server_<code>`, `network`), or a confirm/unsubscribe link failed (`invalid_link`, `missing_code`, ...). |
| `waitlist_confirmed` / `waitlist_unsubscribed` | On `/waitlist/confirm/` and `/waitlist/unsubscribe/` after the server says it worked. |
| `cta_click` | Any main button or "Join the waitlist" link (`cta_label`, `cta_location`). |
| `film_interaction` | The home page film (`film_action`: `watch_with_sound`, `captions_on`, `captions_off`). "Watch with sound" also sends `cta_click`. |
| `demo_interaction` | The interactive sample on the home page (`demo_action`: `format_tab`, `next_slide`, `previous_slide`, `go_to_slide`, `poll_vote`, `poll_reset`). |
| `faq_open` | A question opened in the home page FAQ. |
| `scroll_depth` | 25, 50, 75 and 90 percent of a page read (`percent_scrolled`). |
| `file_download` | A legal PDF link. |
| `outbound_click` / `email_click` | A link to another site / an email link. |
| `page_not_found` | The 404 page. |

`assets/waitlist.js` tells the analytics file what happened through a page event (`briopost:waitlist`); it sends nothing itself.

## Search engines

- Every indexed page has a unique title and description, a canonical `https://briopost.com/.../` address matching `sitemap.xml`, Open Graph and Twitter tags, and `lang="en-US"`. `/waitlist/confirm/`, `/waitlist/unsubscribe/` and `404.html` are `noindex, follow` and stay out of the sitemap.
- `sitemap.xml` lists each indexed page with `<lastmod>`; the check fails if a page's "Last updated" date is newer than its `lastmod`, so update both together. `robots.txt` names the sitemap.
- Structured data (JSON-LD): Organization (Briopost LLC), WebSite, WebPage, SoftwareApplication and FAQPage on the home page; BreadcrumbList on the legal pages once the generator adds it.
- `404.html` is what GitHub Pages shows for any missing address, so its links all start with `/`.
- `site.webmanifest` and `assets/icon-*.png` (drawn by `scripts/render-link-card.py`) give phones and browsers the app icon.
- **IndexNow**: `8d289821e8f67d141300ba6699bebfed.txt` at the site root is the public IndexNow key (public by design, not a secret). After a push to `main` that changes a page, the sitemap or `llms.txt`, `.github/workflows/indexnow.yml` waits for GitHub Pages to publish, then `scripts/indexnow.mjs` sends the sitemap's addresses to `api.indexnow.org` (Bing, Yandex and others). Run it by hand from the Actions tab (Run workflow), or preview with `node scripts/indexnow.mjs --dry-run`.
- **Google Search Console**: verify `briopost.com` as a Domain property (a DNS TXT record in Cloudflare), then submit `https://briopost.com/sitemap.xml`.
- **Bing Webmaster Tools**: no verification file is needed. Sign in at bing.com/webmasters and choose "Import from Google Search Console"; it copies the site and sitemap.
