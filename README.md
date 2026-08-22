# Midfield Ventures — website

Static marketing and investor-education site for Midfield Ventures, a
multifamily real estate sponsor. Plain HTML, CSS and JavaScript — no
framework, no build dependencies, no npm.

**Live preview:** published to GitHub Pages from `website/` on every push to
`main`.

---

## ⚠️ Not ready to publish publicly

This site is a working draft. Before it goes in front of investors:

1. **Unverified figures are highlighted in yellow.** Anything wrapped in
   `<span class="ph">` is a placeholder — no unit count, market, fee or
   performance figure on this site is confirmed. Count them with:
   ```bash
   for f in website/*.html; do printf "%-24s %3d\n" "$f" "$(grep -o 'class="ph"' "$f" | wc -l)"; done
   ```
2. **The legal pages are unreviewed drafts.** `privacy.html`, `terms.html`
   and `disclosures.html` each carry a yellow banner saying so. They are
   starting templates, not legal advice, and must be reviewed by counsel.
3. **Securities compliance is a launch blocker.** Counsel must confirm which
   exemption applies (Rule 506(b) or 506(c)), approve the returns calculator
   and its wording, approve any performance figures, and approve testimonial
   language before publication.

---

## Running it locally

```bash
python -m http.server 4321 --directory website
```

Then open <http://localhost:4321>.

## Making changes

`index.html` is hand-authored. **Every other page is generated** from a body
file plus one shared shell:

```bash
# 1. edit website/src/pages/<page>.html
# 2. rebuild
python website/src/build.py
```

The build assembles the pages, regenerates `sitemap.xml`, rebuilds the
assistant's answer bank, and stamps a cache-busting version onto the CSS and
JS so a normal browser refresh picks up changes.

> **The one seam to remember:** header and footer markup lives in *both*
> `website/src/build.py` (for generated pages) and `index.html` (hand-authored).
> A change to either must be made in both places.

## Layout

```
website/
├── index.html              hand-authored homepage
├── *.html                  generated — edit src/pages/, not these
├── sitemap.xml             generated
├── robots.txt
├── assets/
│   ├── css/site.css        design system + all components
│   ├── js/site.js          nav, reveals, chart, calculator, forms
│   ├── js/bot.js           investor assistant widget
│   ├── js/kb.js            generated answer bank — do not edit
│   ├── img/                logos, favicons, photography
│   └── video/              hero background loop
└── src/
    ├── build.py            shell, nav, footer, sitemap, answer bank
    ├── make-assets.py      regenerates logos and favicons
    └── pages/*.html        page bodies + metadata

source-assets/             original brand and generated media
```

## The investor assistant

The chat widget answers **only from the site's own published FAQ copy**, which
`build.py` extracts into `assets/js/kb.js` at build time. It is deliberately
not a language model: on a securities site, a model that free-forms answers
about returns, fees or risk can invent a figure or produce something that
reads as investment advice.

Answers still containing an unresolved `[placeholder]` are **excluded
automatically**, so the assistant can never quote an unconfirmed number. When
it cannot match a question it says so and routes the visitor to a human.

Fill in a placeholder and rebuild, and that answer joins the bank on its own.

## Full handover notes

See [`website/README.md`](website/README.md) for placeholder inventory, asset
specifications, form-integration instructions and the design system reference.
