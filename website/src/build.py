"""Assembles the static pages from src/pages/*.html bodies + one shared shell.

The output is plain static HTML with the header and footer inlined — no build
step is needed to serve the site. Re-run this only when a body file or the
shell below changes:

    python website/src/build.py
"""

import pathlib
import re
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "pages"
SITE = "https://www.midfieldventures.com/"


def asset_version():
    """Cache-buster derived from the CSS/JS mtimes, so a rebuild always forces
    browsers to pick up style and script changes instead of serving stale
    copies."""
    files = [ROOT / "assets/css/site.css", ROOT / "assets/js/site.js",
             ROOT / "assets/js/bot.js"]
    return str(int(max(f.stat().st_mtime for f in files if f.exists())))

NAV = [
    ("index.html", "Home"),
    ("approach.html", "Our approach"),
    ("how-it-works.html", "How investing works"),
    ("about.html", "About us"),
]

# Search-visible pages, in rough priority order. Anything not listed here is
# either gated, a template, or an error page, and stays out of the sitemap.
SITEMAP = {
    "index.html": "1.0",
    "invest.html": "0.9",
    "approach.html": "0.8",
    "how-it-works.html": "0.8",
    "why-multifamily.html": "0.8",
    "about.html": "0.7",
    "faq.html": "0.7",
    "contact.html": "0.5",
    "schedule.html": "0.5",
    "privacy.html": "0.2",
    "terms.html": "0.2",
    "disclosures.html": "0.3",
}

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://www.midfieldventures.com/{slug}">
<meta name="robots" content="{robots}">

<meta property="og:type" content="website">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://www.midfieldventures.com/{slug}">
<meta property="og:image" content="https://www.midfieldventures.com/assets/img/og-default.jpg">
<meta property="og:site_name" content="Midfield Ventures">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="assets/img/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="assets/img/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600;650&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css?v={assetv}">
{head_extra}</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="header">
  <div class="wrap header-in">
    <a class="brand" href="index.html" aria-label="Midfield Ventures — home">
      <img src="assets/img/logo-navy-520.png" srcset="assets/img/logo-navy-260.png 260w, assets/img/logo-navy-520.png 520w" sizes="132px" width="132" height="39" alt="Midfield Ventures">
    </a>

    <nav class="nav" id="nav" aria-label="Main">
{nav}
      <div class="m-cta">
        <a class="btn btn-primary" href="invest.html">Book a call</a>
      </div>
    </nav>

    <div class="header-cta">
      <a class="btn btn-primary" href="invest.html">Book a call</a>
    </div>

    <button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu"><span></span></button>
  </div>
</header>

<main id="main">
{body}
</main>

<aside class="disclosure">
  <div class="wrap">
    <p><strong>Important disclosures.</strong> This website is for informational purposes only
      and is not an offer to sell, or a solicitation of an offer to buy, any security. Any
      offer is made only through definitive offering documents provided to qualified
      investors, and only in jurisdictions where permitted.</p>
    <p>Private real estate investments involve substantial risk, including illiquidity, the use
      of leverage, and the possible loss of your entire investment. Past performance does not
      guarantee future results. Targeted or projected returns are estimates based on
      assumptions that may not prove accurate, and are not guarantees. Nothing here is tax,
      legal, or investment advice &mdash; consult your own advisors.</p>
  </div>
</aside>

<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <img class="flogo" src="assets/img/logo-white-520.png" srcset="assets/img/logo-white-260.png 260w, assets/img/logo-white-520.png 520w" sizes="150px" width="150" height="45" alt="Midfield Ventures" loading="lazy">
        <p class="small" style="max-width:34ch;color:var(--slate-300)">Multifamily real estate
          investments for investors.</p>
        <ul class="social" aria-label="Midfield Ventures on social media">
          <li><a href="https://www.linkedin.com/in/kimberly-and-tim-dandini-460a25407/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z"/></svg></a></li>
          <li><a href="https://www.instagram.com/midfield.ventures/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.1-9.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/></svg></a></li>
          <li><a href="https://www.facebook.com/profile.php?id=61589733248070" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.2h-3.1V7.8c0-.9.3-1.5 1.6-1.5h1.7V3.4c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V13h2.7v8z"/></svg></a></li>
        </ul>
      </div>
      <div>
        <h5>Invest</h5>
        <ul>
          <li><a href="approach.html">Our approach</a></li>
          <li><a href="offerings.html">Current offerings</a></li>
          <li><a href="how-it-works.html">How investing works</a></li>
          <li><a href="invest.html">Book a call</a></li>
        </ul>
      </div>
      <div>
        <h5>Learn</h5>
        <ul>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="why-multifamily.html">Why multifamily</a></li>
          <li><a href="about.html">About us</a></li>
        </ul>
      </div>
      <div>
        <h5>Contact</h5>
        <ul>
          <li><a href="contact.html">Contact us</a></li>
          <li><a href="schedule.html">Pick a time</a></li>
          <li><a href="mailto:invest@midfieldventures.com">invest@midfieldventures.com</a></li>
          <li><a href="tel:+19714473412">971-447-3412</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year>2026</span> Midfield Ventures. All rights reserved.</span>
      <span><a href="privacy.html">Privacy</a> &nbsp;&middot;&nbsp; <a href="terms.html">Terms</a> &nbsp;&middot;&nbsp; <a href="disclosures.html">Full disclosures</a></span>
    </div>
  </div>
</footer>

<div class="sticky-cta">
  <a class="btn btn-primary btn-block" href="{sticky_href}">{sticky_label}</a>
</div>

<script src="assets/js/kb.js?v={assetv}" defer></script>
<script src="assets/js/site.js?v={assetv}" defer></script>
<script src="assets/js/bot.js?v={assetv}" defer></script>
</body>
</html>
"""


def build(path):
    """Body files carry their metadata in an HTML comment on the first lines."""
    raw = path.read_text(encoding="utf-8")
    meta = dict(re.findall(r"^@(\w+):\s*(.*)$", raw.split("-->")[0], re.M))
    body = raw.split("-->", 1)[1].strip()

    slug = path.stem + ".html"
    # A page's own nav link is marked current and, on the conversion page,
    # the sticky bar points at the form already on screen.
    nav = "\n".join(
        '      <a href="{h}"{cur}>{l}</a>'.format(
            h=h, l=l, cur=' aria-current="page"' if h == slug else ""
        )
        for h, l in NAV
    )

    head_extra = meta.get("head", "")
    if head_extra:
        head_extra = (PAGES / head_extra).read_text(encoding="utf-8") + "\n"

    out = SHELL.format(
        title=meta["title"],
        og_title=meta.get("og", meta["title"].split(" | ")[0]),
        desc=meta["desc"],
        slug="" if slug == "index.html" else slug,
        robots=meta.get("robots", "index,follow,max-image-preview:large"),
        assetv=asset_version(),
        nav=nav,
        body=body,
        head_extra=head_extra,
        sticky_href=meta.get("sticky_href", "invest.html"),
        sticky_label=meta.get("sticky_label", "Book a call"),
    )
    (ROOT / slug).write_text(out, encoding="utf-8")
    print("built", slug, len(out), "bytes")


def write_sitemap():
    """Only search-visible pages. Gated pages, templates and 404 are excluded."""
    today = date.today().isoformat()
    urls = []
    for name, priority in SITEMAP.items():
        if not (ROOT / name).exists():
            print("  sitemap: skipping missing", name)
            continue
        loc = SITE + ("" if name == "index.html" else name)
        urls.append(
            "  <url>\n"
            f"    <loc>{loc}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <priority>{priority}</priority>\n"
            "  </url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
    print("built sitemap.xml", len(urls), "urls")


def stamp_index():
    """index.html is hand-authored, so the build only rewrites its asset
    version query — nothing else in the file is touched."""
    p = ROOT / "index.html"
    if not p.exists():
        return
    t = p.read_text(encoding="utf-8")
    v = asset_version()
    t = re.sub(r"(assets/(?:css/site\.css|js/site\.js))(?:\?v=\d+)?",
               lambda m: m.group(1) + "?v=" + v, t)
    p.write_text(t, encoding="utf-8")
    print("stamped index.html assets v=" + v)


def write_kb():
    """Builds the assistant's answer bank from the FAQ copy already on the site.

    This is deliberately NOT a language model. On a securities site an LLM that
    free-forms answers about returns, fees or risk is a compliance hazard — it
    can invent a figure or produce something that reads as investment advice.
    This reads only from answers already written, reviewed and published, so the
    assistant can never say anything the site does not already say. Answers that
    still contain an unresolved [placeholder] are excluded automatically.
    """
    import json

    entries = []
    for name in ("faq.html", "how-it-works.html"):
        f = ROOT / name
        if not f.exists():
            continue
        html = f.read_text(encoding="utf-8")
        pattern = r'<summary>(.*?)</summary>\s*<div class="acc-body">(.*?)</div>'
        for q, a in re.findall(pattern, html, re.S):
            strip = lambda x: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", x)).strip()
            question, answer = strip(q), strip(a)
            if question and answer and "[" not in answer:
                entries.append({"q": question, "a": answer})

    seen, unique = set(), []
    for e in entries:
        key = e["q"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(e)

    header = (
        "/* Generated by src/build.py from the site's own FAQ copy.\n"
        "   Do not edit by hand - change the FAQ and rebuild. */\n"
    )
    body = "window.MIDFIELD_KB = " + json.dumps(unique, indent=2) + ";\n"
    (ROOT / "assets" / "js" / "kb.js").write_text(header + body, encoding="utf-8")
    print("built kb.js", len(unique), "answers")

if __name__ == "__main__":
    for f in sorted(PAGES.glob("*.html")):
        if f.name.startswith("_"):
            continue
        build(f)
    write_kb()
    stamp_index()
    write_sitemap()
