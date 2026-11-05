# crystal-jeffers.github.io

Portfolio landing page. Published at https://crystal-jeffers.github.io/

- `index.html`: the whole page. Each project card is marked with a comment (`<!-- 1. Employee Lifecycle -->` etc.).
- `assets/style.css`: colors and layout. Theme colors are at the top.
- `assets/site.js`: scroll focus effect, revolving thumbnails, My Focus fly-in, carousel buttons. The page still works fully without it.
- `assets/img/`: SOP phones, emails, parts before/after, migration and dispatch-onboarding screenshots (signatures cropped, contact emails blurred).
  - Lifecycle and dispatch screenshots load straight from the onboarding and start-up-procedures sites.

To add a carousel photo, copy one `<figure>` inside that card's `.carousel-track`.
To replace a "Screenshot coming soon" box, swap the `<figure class="card-media placeholder">` for a normal `<figure class="card-media"><img ...></figure>`.
To change a revolving thumbnail, edit the `.slide` blocks inside that card's `.rotator`. `data-label` is the caption chip.

Connected projects: a `<details class="linked-project">` placed after a card's `.card-folder` opens below that card's tabs with tabs of its own (see Security & Reliability Hardening inside the Start-Up Procedures card).
The portfolio progress rail (left side on wide screens, a slim bar under the header on smaller ones) is built by `site.js` from the cards in the current view, so it needs no editing when projects are added.
