# Midfield Ventures — website

Static HTML/CSS/JS. No build step, no framework, no dependencies. Open
`index.html` or serve the folder and it runs.

```bash
python -m http.server 4321 --directory website
```

---

## 1. Before this goes live

### Every unverified fact is highlighted

Anything wrapped in `<span class="ph">…</span>` renders with a yellow highlight.
These are placeholders — **no performance figure, unit count, market, fee or
return on this site is real.** They ship highlighted on purpose so nothing
fabricated can go live by accident.

Count them per page (`grep -c` counts lines, not occurrences — use `-o`):

```bash
for f in website/*.html; do printf "%-24s %3d\n" "$f" "$(grep -o 'class="ph"' "$f" | wc -l)"; done
```

As of this build: **328 across 18 pages.**

| Page | Count | | Page | Count |
| --- | ---: | --- | --- | ---: |
| index | 63 | | about | 10 |
| portfolio | 44 | | invest | 10 |
| article-template | 43 | | disclosures | 9 |
| property-template | 38 | | contact | 7 |
| how-it-works | 26 | | insights | 7 |
| faq | 19 | | offerings | 5 |
| approach | 14 | | 404 | 2 |
| terms | 14 | | schedule | 2 |
| privacy | 13 | | why-multifamily | 2 |

Five of them are not simple fill-in-the-blanks and need a decision before they
can be written:

- **The rate-shock answer** (`faq.html`, risk section) — how Midfield properties
  handled the 2022–23 rate spike. If there were no properties through that
  period, say so plainly; that is a credible answer and a vague one is not.
- **The debt policy** (`faq.html`) — fixed-rate agency vs. bridge, and the
  conditions under which bridge debt is acceptable. This answer does more work
  than any return figure on the site.
- **Succession and continuity** (`about.html#continuity`) — what happens
  operationally if a principal cannot continue. Confirm the operating-agreement
  language with counsel before writing it.
- **The realized-deals section** (`portfolio.html`) — if Midfield has no
  completed round trips yet, replace that section with an honest statement of
  where each property stands. An empty realized section with a clear
  explanation is far better than a page implying a track record that does not
  exist, and investors do check.
- **The featured article** (`insights.html`) — the article grid is a
  *publishing plan*, not live posts. Each title targets a real query cluster;
  they link to `#` until written.

Once every one is replaced with a verified figure, delete the `.ph` rule near
the bottom of `assets/css/site.css` to clear the highlighting.

### Securities compliance is a blocker, not a polish item

This is a site for a private securities offering. Before publishing, counsel
must confirm:

- **Which exemption you rely on.** Rule 506(b) prohibits general solicitation —
  meaning a public site cannot advertise a specific offering, and you must have
  a pre-existing substantive relationship before showing deal terms. Rule 506(c)
  permits public advertising but requires you to *verify* accreditation, not just
  accept a check-the-box self-certification. The site is currently built for the
  common hybrid: public education, gated offering detail.
- **Testimonial disclosures.** The SEC marketing rule requires disclosure of
  whether a testimonial giver was compensated and of material conflicts. The
  three homepage testimonials are placeholders with a note to that effect.
- **Performance presentation.** Targeted or projected returns need the
  assumptions and the "not a guarantee" language attached wherever they appear —
  including the hero fact card.
- **The disclosure block** near the bottom of every page contains a placeholder
  paragraph to be replaced with final approved language.

### Assets still needed

| Placeholder | Spec |
| --- | --- |
| Hero photograph | 2400×1400 WebP, flagship community exterior, subject right of centre so the scrim covers copy and not the building |
| Property photos | 1200×750 WebP — 3 on the homepage, 5 on the portfolio page, plus hero + before/after per property detail page |
| `og-default.jpg` | 1200×630, for link previews |
| Principal headshot | Already in place (`principals-*.jpg`), generated from `Kim and Dan.png` |

> **Flag:** the supplied photo file is named `Kim and Dan.png`, but the company
> bio names the principals **Tim and Kimberly**. The site says Tim and Kimberly.
> Confirm which is correct before launch.

---

## 2. Wiring up the form

`assets/js/site.js` fakes the submit with a `setTimeout`. Replace that block with
a real POST to your CRM or ESP. The form already collects the accreditation
answer and branches the confirmation message on it, which is the routing you
want: `yes` → sponsor follow-up, `no`/`unsure` → education sequence.

Whatever you connect it to must handle the accreditation answer as sensitive
data. Do not push it to an analytics tool.

Suggested stack:

- **Forms/CRM:** HubSpot, ActiveCampaign, or ConvertKit
- **Investor portal:** Juniper Square, InvestNext, SyndicationPro, or Cashflow
  Portal — the `Investor login` links currently point at a
  `portal.midfieldventures.com` placeholder
- **Scheduling:** Calendly, SavvyCal or HubSpot Meetings — drop the embed into
  the `.embed-slot` on `schedule.html` (the markup carries a commented example)

---

## 3. Files

```
website/
├── index.html              homepage             (hand-authored)
├── approach.html           buy box & strategy   ┐
├── portfolio.html          track record         │
├── how-it-works.html       LP mechanics         │
├── why-multifamily.html    asset-class primer   │
├── about.html              Tim & Kimberly       │  generated — edit the
├── faq.html                38 questions         │  bodies in src/pages/,
├── insights.html           publishing plan      │  not these files
├── invest.html             conversion page      │
├── contact.html            reach us             │
├── schedule.html           book a call          │
├── offerings.html          gated — noindex      │
├── property-template.html  copy per property    │
├── article-template.html   copy per article     │
├── 404.html                not found            │
├── privacy.html            ┐                    │
├── terms.html              │ counsel-review     │
├── disclosures.html        ┘ drafts             ┘
├── sitemap.xml             generated by build.py
├── robots.txt
├── assets/
│   ├── css/site.css        design system + components, single file
│   ├── js/site.js          nav, scroll reveal, accordion, form
│   └── img/                logos, favicons, principals photo
└── src/
    ├── build.py            shell, nav, footer, sitemap config
    ├── make-assets.py      regenerates logos/favicons from the source PNGs
    └── pages/*.html        page bodies + metadata
```

### Page metadata

Each body file opens with an HTML comment carrying its metadata:

| Key | Purpose |
| --- | --- |
| `@title` | `<title>` tag |
| `@og` | Open Graph title (defaults to `@title` before the pipe) |
| `@desc` | Meta description — **keep under ~160 characters** or Google truncates it |
| `@robots` | Optional. Defaults to `index,follow`. Set `noindex,nofollow` for gated or template pages |
| `@head` | Optional. Filename of an extra `<head>` fragment, e.g. `_faq-schema.html` |
| `@sticky_href` / `@sticky_label` | Optional. Overrides the mobile sticky CTA |

### Adding a property or article page

1. Copy `src/pages/property-template.html` → `src/pages/property-oakwood.html`
2. Fill it in and **delete the `@robots: noindex,nofollow` line** so it can be indexed
3. Add it to the `SITEMAP` dict in `src/build.py` with a priority
4. Point the matching card on `portfolio.html` (or `insights.html`) at it
5. Rebuild

Both templates ship `noindex` on purpose — an unfilled template must never be
indexed with `[Property Name]` in the title.

### Editing a generated page

The five inner pages share one header, footer and disclosure block, held in
`src/build.py`. **Edit `src/pages/<page>.html`, then rebuild:**

```bash
python website/src/build.py
```

The output is plain static HTML — the build step exists so the shared chrome
cannot drift between pages, not because the site needs compiling. Each body
file starts with an HTML comment carrying its `@title`, `@desc` and other
metadata; the assembler reads those and marks the matching nav link
`aria-current="page"`.

`index.html` is hand-authored and is not touched by the build.

`src/make-assets.py` knocks the baked backgrounds out of the supplied logo PNGs
via a border flood-fill (so interior whites survive), trims, and emits the
`@1x/@2x` sets plus favicons. Re-run it only if the source logo files change.

### Site status

**All 18 pages built.** No broken links, no missing anchors, no structural
issues. `sitemap.xml` lists the 14 search-visible pages; `offerings.html`, both
templates and `404.html` are excluded from it and marked `noindex`.

Deploy note: point your host's 404 handler at `/404.html`. On Netlify or Vercel
this is automatic; on Apache add `ErrorDocument 404 /404.html`, on nginx
`error_page 404 /404.html;`.

The three legal pages carry a yellow **draft banner** stating they are
templates requiring review. Do not remove those banners until counsel has
actually reviewed them.

### The offerings page is a compliance boundary

`offerings.html` is deliberately a **gate, not a listing** — no property names,
no terms, no returns. Under Rule 506(b) a sponsor may not publicly advertise a
specific offering; under 506(c) it may, but only with verified accreditation.
Either way, deal specifics do not belong on a public URL. It is `noindex`,
disallowed in `robots.txt`, and out of the sitemap. Do not "improve" it by
adding the current deal.

---

## 4. Design system

Palette sampled directly from the emblem — the navy is the exact value from the
logo file, so the brand mark never sits on an approximation of its own colour.

| Token | Value | Use |
| --- | --- | --- |
| `--navy-700` | `#1B3044` | Brand navy, dark sections |
| `--navy-900` | `#0B1D2E` | Footer, deepest surface |
| `--slate-300` | `#90A8C0` | Emblem light slate, body copy on navy |
| `--paper` | `#F7F5F1` | Warm page background |
| `--brass` | `#B98442` | **Primary CTAs only** — do not spend it elsewhere |

**Type:** Newsreader (display) / Inter (body) / IBM Plex Mono (numbers, labels,
disclosures). The mono face is load-bearing: it marks every figure and legal
line, which is what makes the site read as underwriting rather than marketing.

**Motion:** all reveals are CSS transitions on `transform`/`opacity` only, with
a 60ms stagger, gated behind `prefers-reduced-motion` and `(hover: hover)`.
Deliberately no count-up animation on the statistics — numbers a visitor is
reading should not move.
