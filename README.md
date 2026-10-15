# Shimi Levy — Social Media Portfolio

Bilingual Hebrew/English landing page for Shimi Levy: cinema-trained video production, content, and digital marketing. Portfolio source material is kept in Google Drive.

Run locally with `python3 scripts/serve.py`, then open `http://127.0.0.1:8000/`. The page uses plain HTML, CSS, and JavaScript; there is no build step.

## GitHub Pages preview

The website can be hosted directly on GitHub Pages. Python is only used for local preview and optional configuration updates; it is not needed on the host. Asset and navigation paths are relative, so a project URL such as `https://USERNAME.github.io/shimi/` works. `.nojekyll` tells Pages to serve the existing files directly.

1. Push this directory to the chosen GitHub repository.
2. Set `siteUrl` in `site-config.json` to the actual Pages URL, including the repository path and trailing slash.
3. Run `python3 scripts/configure_site.py` and commit the generated `index.html` with the configuration change. Keep `demo: true` for the current preview.
4. In the repository's **Settings → Pages**, choose **Deploy from a branch**, select the source branch and **/ (root)**, then save.
5. Open the URL reported by Pages when deployment finishes.

The online preview retains the visibly labeled draft testimonials and disabled tracking. The production validation described below is for replacing those demo values before the final launch.

**Drive folder:** [Shimi Levy - Social Media Portfolio](https://drive.google.com/drive/folders/1yv8_ftNrYwHBsRO1tvLFck3qVTCEDRcS)

## Positioning

Digital Marketing Manager with hands-on work across video production, social, paid campaigns, and content strategy. Most recent role: one-person marketing team at Hakeren – Israel Foreign Workers Fund.

Shimi holds a degree in cinema, bringing training in cinematography, directing, storytelling, and editing to business video production. The landing page serves anyone marketing their business or professional services, from people working independently to businesses and organizations; it is not restricted to particular industries. Its main conversion is a WhatsApp inquiry for a free 15-minute introductory call.

Selected results from the English start doc:

- Audience growth: TikTok 77K, Facebook 200K, Instagram 37K, Telegram 28K
- Workers’ rights video in 8+ languages, millions of views
- Google Business Profile rating raised from 3.5 to 4.8
- WhatsApp campaigns at SUCCESS reaching tens of thousands of subscribers daily
- Sea Executive Suites digital presence built in-house, including the website relaunch

Start here:

- [00 – START HERE – English](https://docs.google.com/document/d/1N-IuTQgfmBKfFC45WR3g9jFc7ilOyfzSIwPJLBqiBwI/edit)
- [00 – מתחילים כאן – עברית](https://docs.google.com/document/d/1JzZdOTGtX49eFUS2unee4s6SCbUeqGsrLQtgelrLEVc/edit)

## Portfolio map

| Section | What’s inside |
| --- | --- |
| [01 – Analytics & Results](https://drive.google.com/drive/folders/1sUzKVMmKc27e7vAWS2SC6ID9GsMJSp31) | Hakeren – Israel Foreign Workers Fund; Success Business Consulting |
| [02 – Short-Form Videos](https://drive.google.com/drive/folders/1ERyGHwpYVOvePVlRp1xJmVuR1yPI2XrC) | Hakeren only. Six `.mp4` files (about 8–27 MB each), exported 23 Jun 2026 under machine-generated names. Folder last touched 14 Oct 2026. |
| [03 – Photography & Creative](https://drive.google.com/drive/folders/17TDGHO6q4CfwER_HAUPIvXuG1Z4yNtnC) | Hakeren, Sea Executive Suites, Success Business Consulting |
| [04 – Website & Digital Experience](https://drive.google.com/drive/folders/1berTNkkKm9vuaRKldaQ2ipajcGQLyvGa) | [Sea Executive Suites – Website Redesign Case Study](https://docs.google.com/document/d/1Qn7VU72mFXKPtGBIAcL1QWiPbYxP3GrUkPM4HMQGHRI/edit) |

The case study is the only written project file outside the start docs. Shimi led the multilingual relaunch of [sea-hotel.co.il](http://www.sea-hotel.co.il): UX, content structure, localization, booking, WhatsApp, and launch QA, with the designer, developer, booking-engine provider, and translators.

## Contact

- Mobile: 050-207-0031
- Email: shimonlevi1987@gmail.com
- LinkedIn: [linkedin.com/in/shimilevy](https://www.linkedin.com/in/shimilevy)


## Preview and launch configuration

`site-config.json` is the single source for the public site URL, Instagram URL, tracking IDs, and bilingual testimonials. Run `python3 scripts/configure_site.py` after changing it. This renders absolute Open Graph/Twitter image URLs, canonical metadata, profile links, testimonial markup, and the public analytics settings into `index.html`, so crawlers can read them without JavaScript. The site itself still needs no build tooling.

The preview address is `https://itaydile3.github.io/shimi/`. The current configuration deliberately retains **demo content and tracking values** at the owner's request:

- `siteUrl` uses the GitHub Pages preview address so sharing images and canonical links resolve under `/shimi/`. Update it if the site later moves to a custom domain.
- The Instagram placement is visible with a DEMO badge and stays in the local page; replace `instagramUrl` with Shimi's real profile.
- GA4 `G-DEMO000000`, Meta Pixel `000000000000000`, and Clarity `DEMO000000` are placeholders. `demo: true` prevents loading any of those trackers or sending events to those IDs.
- The testimonials, names, and SVG portrait placeholders are fictional drafts, visibly labeled on the page. Replace their text and portraits, and set each `approved` field to `true`. A local testimonial video can be provided in the optional `video` field.

To prepare production, enter the real values, replace the draft testimonials, set `demo` to `false`, then run `python3 scripts/configure_site.py --production`. Validation rejects the example domain, placeholder tracking IDs, demo portraits, and unapproved quotes. Use `--check` to validate without editing HTML.

`analytics.js` initializes the configured trackers only outside demo mode. WhatsApp clicks retain their section/package placement and current language and are sent as GA4 `whatsapp_click`, Meta `Contact`, and Clarity `whatsapp_click`. The message text, phone number, and Instagram account are not included in these custom event fields. Local QA can inspect the bounded `window.ShimiAnalytics.events` queue; clicks are inquiries, not confirmed bookings.

Implementation references: [GA4 event setup](https://developers.google.com/analytics/devguides/collection/ga4/events), [Meta Pixel setup](https://developers.facebook.com/docs/meta-pixel/get-started/), [Clarity installation](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup), and [Clarity client API](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-api).


Local verification: `python3 -m unittest discover -s tests -p 'test_*.py'` and `node tests/analytics.cjs`. The preview server supports byte-range video requests, including Safari/WebKit's initial `bytes=0-1` probe, and avoids stale HTML/CSS/JS while editing. The 180×180 touch icon reuses the existing SVG favicon mark.
