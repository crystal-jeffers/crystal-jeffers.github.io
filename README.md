# crystal-jeffers.github.io

Portfolio landing page. Published at https://crystal-jeffers.github.io/

- `index.html`: the whole page. Each project card is marked with a comment (`<!-- 1. Employee Lifecycle -->` etc.).
- `assets/style.css`: colors and layout. Theme colors are at the top.
- `assets/site.js`: the scroll focus effect and carousel buttons. The page still works fully without it.
- `assets/img/`: blurred dispatch screenshots and the SOP phone screenshots.
  - Employee Lifecycle screenshots load straight from the onboarding site.

To add a carousel photo, copy one `<figure>` inside that card's `.carousel-track`.
To replace a "Screenshot coming soon" box, swap the `<figure class="card-media placeholder">` for a normal `<figure class="card-media"><img ...></figure>`.
