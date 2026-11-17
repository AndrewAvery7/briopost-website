# briopost.com design system

The website's own rules for type, space, color and motion. The brand palette and fonts come from
`assets/brand-tokens.css` (synced from the studio with `npm run brand:sync`); everything else lives in
`assets/site.css` as CSS custom properties with the names below. Phone first: every value is set for 375 px,
then widened.

## Identity: Midnight Stage

- Midnight (#121433) carries the page. Deep (#0C0E26) is the floor under the stage. Paper (#F6F4EF) is text and
  the light band. Haze (#7C81C4) is the quiet accent for lines and secondary marks.
- Orange spark (#FF5B2E) is rare: the one main button per screen, the active state, one highlighted word.
- **The slide is always the brightest object on screen.** Panels around it stay darker than it.
- **Contrast rule:** orange is a fill with midnight text on it, or text on midnight. Never small orange text on
  paper or white.
- No purple gradients, no emoji markers, no glassy blur cards, no rounded card on every block. Boldness lives in
  one or two signature moments per page; the rest is calm.

## Type

Bricolage Grotesque (500-800) for headings and numbers; Inter (400-800) for everything else. Both self-hosted.
Fluid scale, ratio about 1.25 on phones and 1.333 on wide screens:

| Token | Phone (375) | Wide (1440) | Use |
| --- | --- | --- | --- |
| `--t-display` | 40px | 88px | One per page: the H1 |
| `--t-h2` | 30px | 56px | Section headings |
| `--t-h3` | 21px | 28px | Card and step titles |
| `--t-lead` | 18px | 21px | Intro paragraphs |
| `--t-body` | 16px | 17px | Body text, minimum 16px on phones |
| `--t-small` | 14px | 14px | Captions, notes, labels |
| `--t-label` | 12px | 13px | Uppercase eyebrow labels, tracking .12em |

Headings: weight 800, letter-spacing -0.035em, `text-wrap: balance`, line-height 1.02-1.1. Body line-height 1.6,
measure 60-68 characters. Numbers in slides and stats use Bricolage with tabular figures.

## Space

A 4 px base with an 8 px rhythm: `--s-1` 4, `--s-2` 8, `--s-3` 12, `--s-4` 16, `--s-5` 24, `--s-6` 32, `--s-7` 48,
`--s-8` 64, `--s-9` 96, `--s-10` 128. Side gutter 16 px on phones (20 px from 390), 32 px from 768, 56 px from 1200;
content width max 1168 px (`--maxw`; the brand book's 1120 px reading container plus a little room for the sample).
Section padding `--s-8` on phones, `--s-10` from 960 px; sections set only their top and bottom padding, so a `.wrap`
inside them keeps its side gutter.

Corners follow the brand book: 10 px for buttons, fields and link chips; 16 px for cards, panels, the studio window and
the film; 14 px for photos, screenshots and small cards; small status chips, the "Needs your OK" pill and the brand
swatches stay round. Never a pill-shaped panel, and not every block gets a panel: lists sit on hairline rules, and a
page keeps panels for the few things that are objects (a form, a sample, the closing action). Slides keep their own
4 px corner, as the sample draws them.

Breakpoints: phone first; 600 px gives tablets their own proportions (reading width, one-row hero sign-up, bigger
slides); 768 px puts text blocks side by side; 960 px is the two-column page opening (words left, product right);
1100 px shows the full menu.

## Motion language

Movement must explain or delight, never block. Every section is fully readable before any script runs, and a
section is never hidden waiting for an animation (reveals only add movement to content that is already visible).

| Token | Value | Use |
| --- | --- | --- |
| `--m-quick` | 140 ms | Hover, press, focus, toggles |
| `--m-base` | 260 ms | Tabs, slide changes, small reveals |
| `--m-slow` | 520 ms | Chart drawing, brand recolor sweep, calendar fill |
| `--m-stage` | 900 ms | The one signature moment per page |
| `--ease-out` | cubic-bezier(.2,.8,.2,1) | Things arriving |
| `--ease-in-out` | cubic-bezier(.65,0,.35,1) | Things changing in place |
| `--ease-spring` | linear() spring, 1 overshoot | The "Give my OK" tick only |

What moves and why:
- **Slides** move sideways like a real carousel (explains the format).
- **Charts** draw from zero once when first seen (explains "charts from your numbers").
- **Brand switch** sweeps the new colors across the slides left to right (explains "your brand, everywhere").
- **Calendar** fills in one day at a time (explains planning).
- **Give my OK** is the only springy moment (the emotional beat: you are in control).
- Nothing parallaxes the page, nothing hijacks scrolling, nothing loops forever except the muted film while on
  screen (with a Pause button).
- **Template wall** (templates page): the covers drift through one slow pass (90 to 110 seconds), then stop. Pause
  stops them early; Play goes on, or runs the pass again once it has stopped. It pauses while the pointer rests on the covers
  and off screen, and never moves under reduced motion.

Reduced motion: every transition becomes an instant change or a 120 ms fade, charts appear drawn, the film waits
for Play. Before-and-after dividers move only on click and drag.

## Components

Buttons (orange fill with midnight text for the one main action; outline in haze for the rest; one rule everywhere:
48 px tall, 24 px at the sides, Inter Bold 16 px, 10 px corners, hugging their words; on a phone under 480 px the
buttons in an action row fill the row), the eyebrow label (short orange bar plus small capitals), the studio window (deep panel, 1 px haze line,
16 px radius), slide frames (4:5 portrait or 1:1 square, true export proportions), form fields (52 px tall in the closing form, 48 px in the hero, 1 px
`--field-line`, 10 px corners, orange focus ring), and the sample note ("Sample · Nothing is sent, generated or posted") that
sits next to every demo.
