# Briopost website

Public announcement website for [Briopost](https://briopost.com), hosted on GitHub Pages.

Static HTML, CSS and JavaScript. The interactive examples are scripted demonstrations and do not submit information or publish posts.

Run `node scripts/build-pages.mjs` after changing a page or a partial (see "Pages and shared parts"), then `node scripts/check.mjs` to check whether the shared parts are up to date and to check local asset references, JavaScript syntax, and the search and analytics rules below (titles, descriptions, canonical addresses, link-preview tags, structured data, the sitemap and the analytics line). It prints warnings for the four legal pages until their generator emits the newer head tags.

## Link card

When briopost.com is shared in a text, post or chat, apps show `assets/briopost-share-card.png` (1200 x 630, set in the `og:` and `twitter:` tags of every page). Since 2026-11-20 it is the same card as the studio sites (the owner-approved card with the large logo): it is made in the app repo by `node scripts/og/render.mjs` (`public/briopost-og.png`); copy that file here when it changes, under a new name if apps should drop their saved previews. `scripts/link-card.html` and `python scripts/render-link-card.py` still draw `assets/apple-touch-icon.png` and the `icon-*.png` files, but the card they draw (`assets/briopost-link-card.png`, no longer used) is the older "Coming soon" design: do not use it.

## Logo

Every page header uses `assets/briopost-lockup.svg`, the brand kit's horizontal dark lockup (`docs/brand/kit/logo/briopost-lockup-horizontal-dark.svg`, with the ™ built in). Never retype the wordmark in HTML.

## Pages and shared parts

Every hand-written page shares one header, one footer and one stylesheet. The four legal pages (`privacy/`, `terms/`, `email-policy/`, `contact/`) are written by the generator in the studio repo, keep `assets/style.css`, and are left alone.

- `assets/site.css`: the site's styles (tokens from `DESIGN-SYSTEM.md`, phone first), loaded after `assets/brand-tokens.css`. It also styles the simple pages (`.action-card`, `.doc`) and the older class names `waitlist.js` and `/beta/` use (`.button`, `.panel`, `.notice`).
- `assets/site.js`: the phone menu (loaded by the footer partial, so every page has it).
- `partials/header.html`: skip link, logo, menu (Features, Templates, How it works, FAQ, Free tools) and the "Become a beta tester" button. It adds the `js` class to `<html>`; without JavaScript, `html:not(.js)` rules apply and the menu simply wraps.
- `partials/footer.html`: the guide, tool and profession pages, the legal links, "Independent of LinkedIn..." and "© 2026 Briopost LLC · Post with brio.".
- `assets/sample/`: the interactive sample (`sample.js`, `sample.css`, `img/`, `playfair-latin.woff2`). Pictures load from `/assets/sample/img/`. `sample.js`'s `render()` also runs in Node.
- `assets/designs/`: real carousel covers and graphics from the studio (400 x 500 WebP; the four `kit-` pictures 420 x 526). Add more here when a page needs them.
- `assets/pages/`: page-specific styles and scripts (`guides.css` for guide pages, `tools.css` + `tools-extra.css` for the free tools, `brand.css` for `/linkedin-brand-kit/`, one script per tool).
- Wide screens: from 1600 px the content column grows (`--maxw` 1360 px, then 1480 px from 1840 px) so a 1920 px screen is not mostly margin; text keeps its own line length.

`node scripts/build-pages.mjs` fills these markers in every hand-written page, replacing whatever is between them:

| Marker pair | Filled with |
| --- | --- |
| `<!--HEADER-->` ... `<!--/HEADER-->` | `partials/header.html` |
| `<!--FOOTER-->` ... `<!--/FOOTER-->` | `partials/footer.html` |
| `<!--SAMPLE-->` ... `<!--/SAMPLE-->` | the sample as plain HTML, so it reads without JavaScript. Options go in the opening marker: `<!--SAMPLE topic="career" size="square" chart="line" brand="harbor" format="carousel"-->` (topics `sales`, `leadership`, `career`). |

`node scripts/build-pages.mjs --check` changes nothing and exits 1 if a page is out of date or a hand-written page has no HEADER/FOOTER markers. `node scripts/check.mjs` runs it first, so a stale page fails the check.

To add a page:

1. Create `<path>/index.html` with every link starting at `/`. In `<head>`: its own `<title>`, a 110-160 character description, canonical `https://briopost.com/<path>/`, Open Graph and Twitter tags, `theme-color`, `<link rel="stylesheet" href="/assets/brand-tokens.css">` then `<link rel="stylesheet" href="/assets/site.css">`, the line `<script src="/assets/analytics.js" defer></script>`, `<script src="/assets/visit.js" defer></script>`, the Cloudflare beacon tag (copy it from `index.html`), and JSON-LD with a BreadcrumbList.
2. In `<body>`: `<!--HEADER-->` and `<!--/HEADER-->` on two lines, then `<main id="main">` with exactly one `<h1>`, then `<!--FOOTER-->` and `<!--/FOOTER-->`. End the page at one action: a link to `/#waitlist` ("Become a beta tester"), or a compact form wired like the home page's (class `wl-form`, `data-api="https://app.briopost.com/api/waitlist"`, the hidden Website field, plus `<script src="/assets/waitlist.js" defer>`; note that `waitlist.js` knows only the `hw-` and `wl-` ids).
3. To show the sample: a `<div class="bp-demo" id="preview" data-img="/assets/sample/img/">` with the controls (see the home page) and `<div class="bp-output"><!--SAMPLE--><!--/SAMPLE--></div>`, plus `/assets/sample/sample.css` and `/assets/sample/sample.js`. Keep "Sample · Nothing is sent, generated or posted." next to it. Only one `#preview` per page (analytics reads clicks inside it).
4. Add the page to `sitemap.xml` (with `<lastmod>`) unless it is `noindex`.
5. Run `node scripts/build-pages.mjs`, then `node scripts/check.mjs`. Links in the header and footer to pages that are not built yet show as warnings until the page exists (the list is `PLANNED` in `scripts/check.mjs`).

## Page list and what is deliberately not built

Search pages (one search each, how-to first, Briopost second, ending at the beta tester action): the carousel maker, templates, how to make a carousel, carousel size, post generator, content calendar, post approval, how to choose a carousel tool, LinkedIn polls, graphics, post formatting, personal branding, how to post a PDF carousel, brand kit, and three input pages (PDF, blog post or link, notes to carousel; each input was checked in the studio code for beta testers on 2026-11-17). Four "Made for" pages and four free tools (post formatter, carousel size checker, hook preview, slide planner). LinkedIn's own limits (post length, poll rules, document size and pages) appear only as quotes or close paraphrases of LinkedIn Help, with the link and the date they were checked.

Not built on purpose: data reports (Briopost has no public, sourced data yet; build them only from real data with sources), comparison pages (no competitor names), pages for Company Page posting or live LinkedIn statistics (both wait on LinkedIn).

## Interactive home page

- The sample (`assets/sample/sample.js`) sits on the first screen: three sample topics, three brand kits, the four format tabs, the slide size switch, chart kinds and a box where visitors type their own thought ("Shape it"). Nothing is sent, generated or posted, and the page says so; analytics records only which control was used, never the words.
- `assets/home.js`: the "Give my OK" card (the one springy moment), the "Plan the month" calendar (posts below the screen start as dashed outlines that still show their words, then fill in one by one), and the cost moment. No section is ever hidden waiting for a script, there is no scroll-jacking, and reduced motion turns movement off. The page reads completely without JavaScript.
- `<!-- PROOF SLOT -->` in `index.html` marks where real, permitted beta tester posts would go. It stays empty until there are some.

## Film production

The home page film (section `.film`, `<video id="briopost-film">`) plays `assets/film/`: `briopost-film-1080.mp4` (desktop, about 45 MB), `briopost-film-720.mp4` (phones up to 700 px wide, about 25 MB), the cover `briopost-film-poster-1600.webp` / `-800.webp` (the opening logo slide). The film has no captions track (the player offers no captions option). Both MP4s are H.264 with the index at the front (`+faststart`), so they start playing before they finish downloading; `preload="none"` means nothing downloads until someone presses play. Cloudflare and browsers keep CSS and JavaScript for up to 4 hours, so `index.html` loads `home.css` and `combined.js` with a `?v=` tag: change the tag whenever either file changes, or visitors can get the new page with the old files for a few hours. The film files keep their names, so the poster and both MP4 links carry their own `?v=` tag too: change it whenever the film is re-rendered. `assets/analytics.js` records `video_start`, `video_progress` (50%) and `video_complete`, nothing about the visitor.

The master (2:36, 1920x1080, 24 fps), the editable Remotion project, the real product captures, the AI footage and the narration and music are archived outside this repo (see the archive README in `OneDrive\Videos\Briopost film archive\`). To change the film: edit and render the master there, then re-encode the two web files with the commands in that README and replace the files here.

## Beta tester guide

`/beta/` (noindex, not in the sitemap): sign-in steps, five things to try (ticks kept in the visitor's browser only, `assets/beta.js`), how to send feedback (info@briopost.com) and short answers that match Terms section 17. The tester sign-up messages in `assets/waitlist.js` link to it, and so does the test-account email in the app.

## Fonts

Inter and Bricolage Grotesque are self-hosted (`assets/inter-var.woff2`, `assets/bricolage-var.woff2`, SIL Open Font License). Outside requests: the waitlist API, the Cloudflare Web Analytics beacon, and Google Analytics once its ID is set (below). `scripts/build-fonts.py` rebuilds them from the google/fonts repository, keeping Latin characters and only the OpenType features browsers apply by default plus `tnum`/`lnum` (98 KB for both).

## Waitlist

Visitors read "beta tester" wording everywhere ("Become a beta tester", "Free beta, by invitation."); the ids (`hw-*`, `wl-*`), the `/waitlist/...` addresses, the event names and the API keep the older name. The two home page forms (`hw-form` in the hero, `wl-form` with the optional role in `#waitlist`), `/waitlist/confirm/` and `/waitlist/unsubscribe/` call the waitlist API at `https://app.briopost.com/api/waitlist` (set in each page's `data-api` attribute; code in `assets/waitlist.js`). Until `GET /status` answers `open: true`, the form stays disabled and shows "Sign-ups open shortly."

A beta tester's personal link (`/?ref=beta-testers&invite=<code>`) carries a single-use code. `waitlist.js` reads it, keeps it in the tab's sessionStorage (`bp-invite`) and removes it from the address bar with `history.replaceState`, so a refresh still works (the `ref` stays in the address) while the code is not left in the address, history or what later scripts read. It is sent only with the sign-up itself and forgotten once the sign-up succeeds.

## Screenshots

Real app screenshots live in `assets/shots/` and are placed in the `#studio` section of `index.html`; to add one, copy an `<li>` line there. The `#templates` block shows eight covers from `assets/designs/` and links to `/linkedin-carousel-templates/`.

## Google Analytics 4

`assets/analytics.js` is loaded on every page with exactly `<script src="/assets/analytics.js" defer></script>` (the legal-page generator emits the same line). It holds `const GA_MEASUREMENT_ID = "";` near the top. While that is empty the file does nothing: no Google request, no cookies, no events. To switch it on, paste the Measurement ID from Google Analytics (Admin > Data streams > the briopost.com stream, it looks like `G-AB12CD34EF`) between the quotes and merge. It counts every visitor, with no consent banner (the owner's decision), and only on briopost.com; add `?ga_debug=1` to an address to test anywhere else and see the visit in GA's DebugView.

In the GA stream's Enhanced measurement settings, turn off **Outbound clicks** and **File downloads**: this file sends both itself (`outbound_click`, `file_download`), so leaving them on counts them twice. Leave page views, scrolls and site search on.

Events it sends (all only when the ID is set):

| Event | When |
| --- | --- |
| `page_view` | Every page (GA's own). `?ref=tag` links count as source `tag`, medium `referral`, campaign `ref_link` unless the link already has `utm_` tags. The address sent to Google is rebuilt from an allowlist (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `utm_id`, `gclid`, `gbraid`, `wbraid`, `ref`): every other field, including the confirm/unsubscribe `?token=` and a beta tester's `?invite=` code, is dropped, and `page_location` / `page_referrer` are always set explicitly. `scripts/test-analytics-privacy.mjs` (run by the check) proves it. |
| `waitlist_form_start` | First time someone clicks into a waitlist form (`form_location`: `hero` or `waitlist_section`). |
| `generate_lead` and `sign_up` | A new sign-up the server accepted ("Check your inbox"). Mark `generate_lead` as a key event in GA. |
| `waitlist_already_joined` | The address was already confirmed. |
| `waitlist_error` | A sign-up failed (`error_reason`: `validation`, `closed`, `rate_limited`, `rejected`, `server_<code>`, `network`), or a confirm/unsubscribe link failed (`invalid_link`, `missing_code`, ...). |
| `waitlist_confirmed` / `waitlist_unsubscribed` | On `/waitlist/confirm/` and `/waitlist/unsubscribe/` after the server says it worked. |
| `cta_click` | Any main button (`.btn` or `.button`: "Become a beta tester", "See all 150 carousel designs", Confirm, Unsubscribe, "Open Briopost") or any link to `#waitlist` (`cta_label`, `cta_location`). |
| `demo_interaction` | The sample (`#preview`) and the scripted moments, with `demo_action` and `demo_value` (`(none)` when there is nothing to add). In the sample: `sample_topic` (sales, leadership, career), `brand_switch` (midnight, harbor, daylight), `size_switch` (portrait, square), `chart_kind` (bar, line, area), `shape_own` (never the words), `format_tab` (carousel, graphic, text, poll), `next_slide`, `previous_slide`, `go_to_slide` (slide number), `poll_vote` (the sample option), `poll_reset`. Around it: `give_ok` and `take_back_ok` (the "Give my OK" card), `cost_preview` and `cost_reset` (the cost moment). The calendar has no controls and sends nothing. |
| `faq_open` | A question opened in the home page FAQ. |
| `scroll_depth` | 25, 50, 75 and 90 percent of a page read (`percent_scrolled`). |
| `file_download` | A legal PDF link. |
| `outbound_click` / `email_click` | A link to another site / an email link. |
| `page_not_found` | The 404 page. |
| `tool_use` | A control in a free tool (`tool_name`: `post_formatter`, `size_checker`, `hook_preview` or `slide_planner`; `tool_action`: e.g. `bold`, `bullets`, `see_more`, `draft_on`, `hook_edit`, `hook_add`, `hook_remove`, `plan_update`, `shape_switch`, `clear`). Never the text. |
| `tool_copy` | A Copy button in the post formatter, the hook preview ("Copy hook N") or the slide planner ("Copy as plain text"). |
| `tool_result` | The size checker read a file (`size_match`: `portrait`, `square`, `story`, `wide`, `banner` or `none`; `file_kind`: `image` or `pdf`). Never the file. |
| `tool_error` | The size checker could not read a file (`error_reason`). |

`assets/waitlist.js` tells the analytics file what happened through a page event (`briopost:waitlist`); it sends nothing itself.

## Search engines

- Every indexed page has a unique title and description, a canonical `https://briopost.com/.../` address matching `sitemap.xml`, Open Graph and Twitter tags, and `lang="en-US"`. `/waitlist/confirm/`, `/waitlist/unsubscribe/` and `404.html` are `noindex, follow` and stay out of the sitemap.
- `sitemap.xml` lists each indexed page with `<lastmod>`; the check fails if a page's "Last updated" date is newer than its `lastmod`, so update both together. It also fails if a page's `index.html` has a git commit (or, locally, an uncommitted change) dated after its `lastmod`; set `lastmod` to the date the message names (CI checks out the full history for this). `robots.txt` names the sitemap.
- Structured data (JSON-LD): Organization (Briopost LLC), WebSite, WebPage (with an ImageObject as `primaryImageOfPage`), SoftwareApplication, FAQPage on the home page; BreadcrumbList on inner pages. A FAQPage must repeat the page's visible `<details><summary>`/`<p>` questions and answers word for word, in order; `scripts/check.mjs` compares them.
- `404.html` is what GitHub Pages shows for any missing address, so its links all start with `/`.
- `site.webmanifest` and `assets/icon-*.png` (drawn by `scripts/render-link-card.py`) give phones and browsers the app icon.
- **IndexNow**: `8d289821e8f67d141300ba6699bebfed.txt` at the site root is the public IndexNow key (public by design, not a secret). After a push to `main` that changes a page, the sitemap or `llms.txt`, `.github/workflows/indexnow.yml` waits for GitHub Pages to publish, then `scripts/indexnow.mjs` sends the sitemap's addresses to `api.indexnow.org` (Bing, Yandex and others). Run it by hand from the Actions tab (Run workflow), or preview with `node scripts/indexnow.mjs --dry-run`.
- **Google Search Console**: verify `briopost.com` as a Domain property (a DNS TXT record in Cloudflare), then submit `https://briopost.com/sitemap.xml`.
- **Bing Webmaster Tools**: no verification file is needed. Sign in at bing.com/webmasters and choose "Import from Google Search Console"; it copies the site and sitemap.
