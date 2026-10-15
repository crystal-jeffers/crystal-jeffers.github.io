# crystal-jeffers.github.io

Portfolio landing page. Published at https://crystal-jeffers.github.io/

- `index.html`: the whole page. Each project card is marked with a comment (`<!-- 1. Employee Lifecycle -->` etc.).
- `assets/style.css`: colors and layout. Theme colors are at the top.
- `assets/site.js`: scroll focus effect, revolving thumbnails, My Focus fly-in, carousel buttons. The page still works fully without it.
- `assets/img/`: SOP phone screenshots and email screenshots (signatures cropped out).
  - Lifecycle and dispatch screenshots load straight from the onboarding and start-up-procedures sites.

To add a carousel photo, copy one `<figure>` inside that card's `.carousel-track`.
To replace a "Screenshot coming soon" box, swap the `<figure class="card-media placeholder">` for a normal `<figure class="card-media"><img ...></figure>`.
To change a revolving thumbnail, edit the `.slide` blocks inside that card's `.rotator`. `data-label` is the caption chip.
