# Pau Studio website

Five-page static site for Pau Studio, served by GitHub Pages from `main` / root:
Home (`index.html`), About, Services, Work and Contact.

## Showcase: updating a category

Home and Work read one file, `assets/work.json`. In each category (`product-still`,
`carousel`, `slideshow`, `product-reel`, `sharing-video`) the site shows the entry with the
latest `completed_at` that has `"cleared_for_public": true`. Other categories are not affected.

1. Put the web-ready media in `assets/media/` (images about 1080 px wide; videos 720 px wide,
   H.264 MP4 with `+faststart`, plus a poster JPG). Use only media cleared for public use.
2. Add an entry to `items` in `assets/work.json`: `category`, `title`, `caption`,
   `completed_at` (ISO time with `+08:00`), `cleared_for_public`, `type` (`image`, `carousel`
   or `video`), `media` or `slides`, `poster` for videos, `alt`, and `label`
   (studio work, plus the AI presenter or AI-generated disclosure that applies).
   Keep older entries; they stay as the record.
3. Preview locally: `python -m http.server 8000`, then open `http://127.0.0.1:8000/work.html`.
4. Commit and push. The live site updates after GitHub Pages finishes deploying.

Paths are relative, so the site works under `https://lyven81.github.io/pau-studio/`.

## Enquiry form

`contact.html` posts through `assets/contact.js` to FormSubmit (AJAX mode). It sends the visible
fields plus `source_page`, `campaign` (from `?campaign=` in the URL), `brand=pau-studio` and a
`submission_id` that is reused if the visitor retries. Success shows only when FormSubmit replies
`"success":"true"`. FormSubmit emails each enquiry to the studio inbox; the private tracker on the
founder's laptop imports them. A landing page reuses the same form and sets its own
`data-source` on the `<form>` tag.

No keys, tracker files or lead records belong in this repository.
