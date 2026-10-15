#!/usr/bin/env python3
"""Render launch metadata, public tracking config, Instagram links and testimonials."""
import argparse
import html
import json
from pathlib import Path
import re
from urllib.parse import urlparse, urljoin

ROOT = Path(__file__).resolve().parents[1]

def localized(tag, values, cls=""):
    he, en = values["he"], values["en"]
    attrs = f' class="{cls}"' if cls else ""
    return f'<{tag}{attrs} data-he="{html.escape(he, quote=True)}" data-en="{html.escape(en, quote=True)}">{html.escape(he)}</{tag}>'

def validate(config, production=False):
    demo = config.get("demo", True)
    for key in ("siteUrl", "instagramUrl"):
        parsed = urlparse(config[key])
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ValueError(f"{key} must be an absolute HTTPS URL without credentials, query or fragment")
    analytics = config["analytics"]
    patterns = {"ga4Id": r"G-[A-Z0-9]+", "metaPixelId": r"[0-9]{5,20}", "clarityId": r"[A-Za-z0-9]+"}
    for key, pattern in patterns.items():
        if analytics.get(key) and not re.fullmatch(pattern, analytics[key]):
            raise ValueError(f"Invalid {key}")
    if production or not demo:
        if demo:
            raise ValueError("Production requires demo=false and real configuration")
        if urlparse(config["siteUrl"]).hostname.endswith((".example", ".invalid", ".test")):
            raise ValueError("Replace the demo site domain")
        instagram = urlparse(config["instagramUrl"])
        if instagram.hostname not in ("www.instagram.com", "instagram.com") or not re.fullmatch(r"/[A-Za-z0-9_.]{1,30}/?", instagram.path):
            raise ValueError("A real Instagram profile URL is required")
        if any(not analytics.get(key) or "DEMO" in analytics[key].upper() or set(analytics[key]) == {"0"} for key in patterns):
            raise ValueError("Replace all demo tracking IDs")
    for item in config.get("testimonials", []):
        for key in ("name", "role", "quote"):
            if not all(isinstance(item[key].get(lang), str) and item[key][lang].strip() for lang in ("he", "en")):
                raise ValueError(f"Testimonial {key} needs Hebrew and English text")
        for key in ("image", "video"):
            path = item.get(key, "")
            if path and (urlparse(path).scheme or path.startswith("/..") or not (ROOT / path).resolve().is_relative_to(ROOT) or not (ROOT / path).is_file()):
                raise ValueError(f"{key} must name an existing local asset: {path}")
        if not demo and (not item.get("approved") or "demo-client" in item.get("image", "")):
            raise ValueError("Replace draft testimonials and portraits with approved client content before production")

def replace_block(source, name, content, before=None):
    block = f"<!-- {name}_START -->\n{content}\n<!-- {name}_END -->"
    pattern = rf"<!-- {name}_START -->.*?<!-- {name}_END -->"
    if re.search(pattern, source, re.S):
        return re.sub(pattern, lambda _: block, source, flags=re.S)
    if before is None or before not in source:
        raise ValueError(f"Missing insertion point for {name}")
    return source.replace(before, block + "\n" + before, 1)

def render_testimonials(config):
    items = config.get("testimonials", [])
    if not items:
        return ""
    any_drafts = any(not item.get("approved") for item in items)
    disclosure = localized("p", {"he": "טיוטות להמחשה בלבד — הציטוטים, השמות והאיורים בדויים ויש להחליפם בעדויות מאושרות לפני פרסום.", "en": "Illustrative drafts only. Quotes, names, and portraits are placeholders; replace them with approved client testimonials before publishing."}, "testimonial-disclosure") if any_drafts else ""
    cards = []
    for index, item in enumerate(items):
        badge = localized("span", {"he": "טיוטה · לא עדות לקוח אמיתית", "en": "DRAFT · NOT AN ACTUAL CLIENT TESTIMONIAL"}, "testimonial-draft") if not item.get("approved") else ""
        portrait = f'<img src="{html.escape(item["image"], quote=True)}" width="48" height="48" loading="lazy" alt="" />' if item.get("image") else ""
        video = f'<video controls playsinline preload="none" src="{html.escape(item["video"], quote=True)}" poster="{html.escape(item.get("image", ""), quote=True)}"></video>' if item.get("video") else ""
        cards.append(f'<figure class="testimonial reveal" style="--i:{index}">{badge}<blockquote>{localized("p", item["quote"])}</blockquote><figcaption>{portrait}<div class="testimonial-person">{localized("strong", item["name"])}{localized("span", item["role"], "testimonial-role")}</div></figcaption>{video}</figure>')
    return f'<div class="testimonial-section">{disclosure}<div class="testimonial-grid">'+"\n".join(cards)+"</div></div>"

def render_instagram(config, footer=False):
    demo = config.get("demo", True)
    # Demo URLs stay on this preview; never send visitors to an invented account.
    href = "#about" if demo else config["instagramUrl"]
    label = localized("span", {"he": "האינסטגרם שלי ↗", "en": "My Instagram ↗"})
    badge = '<span class="demo-label">DEMO</span>' if demo else ""
    cls = "instagram-link" if not footer else "footer-instagram"
    return f'<a class="{cls}" href="{html.escape(href, quote=True)}" data-instagram="{html.escape(config["instagramUrl"], quote=True)}"'+(' target="_blank" rel="noopener noreferrer"' if not demo else '')+f'>{label}{badge}</a>'

def render(config):
    source = (ROOT / "index.html").read_text()
    base = config["siteUrl"].rstrip("/") + "/"
    # Crawlers need absolute values in the saved HTML, not a JS metadata rewrite.
    source = re.sub(r'\s*<meta (?:property="og:image"|name="twitter:image")[^>]*>', "", source)
    metadata = '\n'.join([
        f'<meta property="og:image" content="{html.escape(urljoin(base, "assets/og.jpg"), quote=True)}" />',
        f'<meta name="twitter:image" content="{html.escape(urljoin(base, "assets/og.jpg"), quote=True)}" />',
        f'<meta property="og:url" content="{html.escape(base, quote=True)}" />',
        f'<link rel="canonical" href="{html.escape(base, quote=True)}" />',
        '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png" />'
    ])
    source = replace_block(source, "SITE_META", metadata, before='    <meta property="og:image:width"')
    client = json.dumps({"demo": config.get("demo", True), "analytics": config["analytics"]}, ensure_ascii=False).replace("<", "\\u003c")
    source = replace_block(source, "SITE_CONFIG", f'<script id="site-config" type="application/json">{client}</script>', before="  </head>")
    case_start = source.index('<section class="band" id="cases">')
    first_case = source.index('          <article class="case reveal">', case_start)
    source = replace_block(source, "TESTIMONIALS", render_testimonials(config), before=source[first_case:first_case+len('          <article class="case reveal">')])
    source = replace_block(source, "INSTAGRAM_ABOUT", render_instagram(config), before='            <dl class="craft-details">')
    source = replace_block(source, "INSTAGRAM_FOOTER", render_instagram(config, footer=True), before='      <a href="accessibility.html"')
    return source

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--production", action="store_true", help="Reject demo domains, tracking IDs and unapproved testimonials")
    parser.add_argument("--check", action="store_true", help="Validate configuration without writing HTML")
    args = parser.parse_args()
    config = json.loads((ROOT / "site-config.json").read_text())
    try:
        validate(config, production=args.production)
        if not args.check:
            (ROOT / "index.html").write_text(render(config))
    except (ValueError, KeyError) as error:
        parser.exit(1, f"Configuration error: {error}\n")
    print("Configuration validated" if args.check else "Site metadata, links, testimonials and analytics configuration rendered")
    if config.get("demo", True):
        print("DEMO mode: draft testimonials and disabled tracking. Replace demo values before final launch.")
if __name__ == "__main__":
    main()
