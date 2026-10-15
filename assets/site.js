/* =========================================================================
   SITE.JS: small enhancements. The page is complete without this file:
   every card, image and accordion is fully visible if it fails to load.

   1. AUDIENCE VIEWS: the lens bar above Portfolio Work filters and re-orders
      the cards. Each view's order and description live on its button in
      index.html; each card's data-lens lists the views it appears in.
      A view can be shared as a link: ?view=growth (or operations, people,
      systems).
   2. CARD FOCUS: as you scroll, the card nearest the focus line "stands up"
      (class .is-active) and the others settle back. The active card's
      "Challenge, build & impact" tab slides out from behind it.
   3. REVOLVING-DOOR THUMBNAILS.
   4. MY FOCUS: fly-in, and flip cards (hover with a mouse; tap or Enter
      otherwise).
   5. CAROUSELS: arrow buttons and dots.
   6. CLICK TO ENLARGE: every screenshot opens full size in a lightbox.

   Reduced motion: style.css removes movement for people whose device asks
   for less motion.
   ========================================================================= */
(function () {
  "use strict";

  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var each = function (sel, fn, root) {
    Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn);
  };

  /* ---------- 2. Card focus (set up first; the lens bar calls refresh) ---------- */
  var allCards = Array.prototype.slice.call(document.querySelectorAll(".project"));
  var refreshFocus = function () {};

  if (allCards.length && "getBoundingClientRect" in document.documentElement) {
    document.documentElement.classList.add("focus-ready");

    var active = null;
    var FOCUS_LINE = 0.42; // fraction of the window height, from the top

    var setActive = function (card) {
      if (card === active) return;
      if (active) active.classList.remove("is-active");
      if (card) card.classList.add("is-active");
      active = card;
    };

    var visibleCards = function () {
      return allCards.filter(function (c) { return !c.hidden; })
        .sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
    };

    var pick = function () {
      var cards = visibleCards();
      if (!cards.length) return setActive(null);
      var line = window.innerHeight * FOCUS_LINE;
      var doc = document.documentElement;
      var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4;
      var last = cards[cards.length - 1];

      // At the very bottom the last card can never reach the line, so give it focus.
      if (atBottom && last.getBoundingClientRect().top < window.innerHeight) return setActive(last);

      var best = cards[0], bestDist = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        if (r.top <= line && r.bottom >= line) return setActive(cards[i]);
        var d = Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line));
        if (d < bestDist) { bestDist = d; best = cards[i]; }
      }
      setActive(best);
    };

    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; pick(); });
    };
    refreshFocus = onScroll;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    allCards.forEach(function (card) {
      card.addEventListener("toggle", onScroll, true); // accordions change heights
      card.addEventListener("focusin", function () { setActive(card); });
    });
    pick();
  }

  /* ---------- 1. Audience views ---------- */
  var list = document.querySelector(".work-list");
  var lensButtons = Array.prototype.slice.call(document.querySelectorAll(".lens"));
  var note = document.querySelector(".lens-note");
  var share = document.querySelector(".lens-share");
  var originalOrder = allCards.slice();

  function applyLens(id, opts) {
    opts = opts || {};
    var btn = lensButtons.filter(function (b) { return b.getAttribute("data-lens-id") === id; })[0];
    if (!btn || !list) return;
    lensButtons.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });

    var order = (btn.getAttribute("data-order") || "").split(",").filter(Boolean);
    var byId = {};
    originalOrder.forEach(function (c) { byId[c.id] = c; });

    if (id === "all" || !order.length) {
      originalOrder.forEach(function (c) { c.hidden = false; list.appendChild(c); });
    } else {
      originalOrder.forEach(function (c) {
        var lenses = (c.getAttribute("data-lens") || "").split(/\s+/);
        c.hidden = lenses.indexOf(id) === -1;
      });
      // Cards in this view, most compelling first; any other tagged card after.
      order.forEach(function (cid) { if (byId[cid] && !byId[cid].hidden) list.appendChild(byId[cid]); });
      originalOrder.forEach(function (c) { if (!c.hidden && order.indexOf(c.id) === -1) list.appendChild(c); });
    }

    var shown = originalOrder.filter(function (c) { return !c.hidden; }).length;
    if (note) {
      note.innerHTML = "";
      var b = document.createElement("b");
      b.textContent = shown + (shown === 1 ? " project" : " projects") + ". ";
      note.appendChild(b);
      note.appendChild(document.createTextNode(btn.getAttribute("data-note") || ""));
    }
    if (share) share.hidden = id === "all";

    if (opts.updateUrl && window.history && history.replaceState) {
      var url = new URL(window.location.href);
      if (id === "all") url.searchParams.delete("view"); else url.searchParams.set("view", id);
      history.replaceState(null, "", url.toString());
    }
    if (opts.animate && !calm) {
      list.classList.remove("swapped");
      void list.offsetWidth; // restart the animation
      list.classList.add("swapped");
    }
    refreshFocus();
  }

  lensButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      applyLens(b.getAttribute("data-lens-id"), { updateUrl: true, animate: true });
    });
  });
  if (share) {
    share.addEventListener("click", function () {
      var url = window.location.href;
      var done = function () {
        var old = share.textContent;
        share.textContent = "Link copied";
        setTimeout(function () { share.textContent = old; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
      } else {
        window.prompt("Copy this link:", url);
      }
    });
  }
  if (lensButtons.length) {
    var start = new URLSearchParams(window.location.search).get("view") || "all";
    if (!lensButtons.some(function (b) { return b.getAttribute("data-lens-id") === start; })) start = "all";
    applyLens(start, {});
  }

  /* ---------- 3. Revolving-door thumbnails ----------
     Advances only while its card is the one in focus and on screen, pauses
     on hover, and never auto-plays for reduced-motion users (a click or
     Enter still steps through). The ⤢ button opens the screens full size. */
  each(".rotator", function (rot) {
    var slides = Array.prototype.slice.call(rot.querySelectorAll(".slide"));
    var n = slides.length;
    if (n < 2) return;
    var card = rot.closest(".project");
    var i = 0, hovering = false;

    var label = document.createElement("span");
    label.className = "rotator-label";
    label.setAttribute("aria-hidden", "true");
    rot.appendChild(label);
    rot.setAttribute("tabindex", "0");
    rot.setAttribute("aria-label", (rot.getAttribute("aria-label") || "Screenshots") + ". Press Enter for the next screen.");
    rot.classList.add("is-live");

    function place() {
      slides.forEach(function (s, k) {
        var pos = "hidden";
        if (k === i) pos = "front";
        else if (k === (i + 1) % n) pos = "next";
        else if (n > 2 && k === (i - 1 + n) % n) pos = "prev";
        s.setAttribute("data-pos", pos);
        s.setAttribute("aria-hidden", pos === "front" ? "false" : "true");
      });
      label.textContent = slides[i].getAttribute("data-label") || "";
      rot.setAttribute("data-index", i);
    }
    function step() { i = (i + 1) % n; place(); }

    function onScreen() {
      var r = rot.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }
    function shouldPlay() {
      return !calm && !hovering && !document.hidden && onScreen() &&
        (!card || card.classList.contains("is-active"));
    }

    rot.addEventListener("mouseenter", function () { hovering = true; });
    rot.addEventListener("mouseleave", function () { hovering = false; });
    rot.addEventListener("click", function (e) { if (!e.target.closest(".zoom-btn")) step(); });
    rot.addEventListener("keydown", function (e) {
      if (e.target !== rot) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(); }
    });

    place();
    setInterval(function () { if (shouldPlay()) step(); }, 3400);
  });

  /* ---------- 4. My Focus: fly-in (setup is in the page <head>) and flip ---------- */
  var pillars = document.querySelector(".pillars");
  if (pillars && document.documentElement.classList.contains("anim-ready")) {
    var fly = function () {
      Array.prototype.forEach.call(pillars.children, function (li) { li.classList.add("flown"); });
    };
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { fly(); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(pillars);
  }

  // With a mouse, hover does the flipping (CSS), so a click is ignored.
  // Touch and keyboard toggle it.
  var hoverMouse = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  each(".flip", function (btn) {
    var lastPointer = "";
    btn.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType; });
    btn.addEventListener("click", function (e) {
      var keyboard = e.detail === 0;
      if (hoverMouse && lastPointer === "mouse" && !keyboard) return;
      var on = !btn.classList.contains("flipped");
      btn.classList.toggle("flipped", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  /* ---------- 5. Carousels ---------- */
  each(".carousel", function (car) {
    var track = car.querySelector(".carousel-track");
    if (!track) return;
    var slides = track.children;
    if (slides.length < 2) return;

    var controls = document.createElement("div");
    controls.className = "carousel-controls";

    var prev = document.createElement("button");
    prev.type = "button"; prev.className = "carousel-btn"; prev.textContent = "‹";
    prev.setAttribute("aria-label", "Previous photo");

    var next = document.createElement("button");
    next.type = "button"; next.className = "carousel-btn"; next.textContent = "›";
    next.setAttribute("aria-label", "Next photo");

    var dots = document.createElement("div");
    dots.className = "carousel-dots";
    var dotEls = [];
    for (var k = 0; k < slides.length; k++) {
      (function (n) {
        var dot = document.createElement("button");
        dot.type = "button"; dot.className = "carousel-dot";
        dot.setAttribute("aria-label", "Photo " + (n + 1) + " of " + slides.length);
        dot.addEventListener("click", function () { go(n); });
        dots.appendChild(dot); dotEls.push(dot);
      })(k);
    }

    controls.appendChild(prev); controls.appendChild(dots); controls.appendChild(next);
    car.appendChild(controls);

    function current() { return Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)); }
    function go(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      track.scrollTo({ left: n * track.clientWidth, behavior: calm ? "auto" : "smooth" });
    }
    function update() {
      var c = current();
      prev.disabled = c <= 0;
      next.disabled = c >= slides.length - 1;
      dotEls.forEach(function (d, j) {
        d.classList.toggle("active", j === c);
        if (j === c) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
      });
    }
    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(current() + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(current() - 1); }
    });
    car.classList.add("has-controls");
    update();
  });

  /* ---------- 6. Click to enlarge ---------- */
  var box = document.createElement("div");
  box.className = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Enlarged screenshot");
  box.innerHTML =
    '<span class="lightbox-count" aria-live="polite"></span>' +
    '<button type="button" class="lightbox-close" aria-label="Close">×</button>' +
    '<button type="button" class="lightbox-nav prev" aria-label="Previous">‹</button>' +
    '<img alt="">' +
    '<p class="lightbox-caption"></p>' +
    '<button type="button" class="lightbox-nav next" aria-label="Next">›</button>';
  document.body.appendChild(box);

  var lbImg = box.querySelector("img");
  var lbCap = box.querySelector(".lightbox-caption");
  var lbCount = box.querySelector(".lightbox-count");
  var lbPrev = box.querySelector(".prev");
  var lbNext = box.querySelector(".next");
  var group = [], at = 0, returnFocus = null;

  function show() {
    var item = group[at];
    lbImg.src = item.src;
    lbImg.alt = item.alt;
    lbCap.textContent = item.caption || item.alt || "";
    var many = group.length > 1;
    lbPrev.hidden = lbNext.hidden = !many;
    lbCount.textContent = many ? (at + 1) + " of " + group.length : "";
  }
  function openBox(items, start, from) {
    group = items; at = start || 0; returnFocus = from || null;
    show();
    box.hidden = false;
    document.body.classList.add("lightbox-open");
    box.querySelector(".lightbox-close").focus();
  }
  function closeBox() {
    box.hidden = true;
    lbImg.removeAttribute("src");
    document.body.classList.remove("lightbox-open");
    if (returnFocus) returnFocus.focus();
  }
  function move(d) { at = (at + d + group.length) % group.length; show(); }

  box.querySelector(".lightbox-close").addEventListener("click", closeBox);
  lbPrev.addEventListener("click", function () { move(-1); });
  lbNext.addEventListener("click", function () { move(1); });
  lbImg.addEventListener("click", closeBox);
  box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") closeBox();
    else if (e.key === "ArrowRight" && group.length > 1) move(1);
    else if (e.key === "ArrowLeft" && group.length > 1) move(-1);
    else if (e.key === "Tab") { // keep focus inside the dialog
      var f = Array.prototype.filter.call(box.querySelectorAll("button"), function (b) { return !b.hidden; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function itemFrom(img) {
    var fig = img.closest("figure");
    var cap = fig && fig.querySelector("figcaption");
    return { src: img.currentSrc || img.src, alt: img.alt, caption: cap ? cap.textContent : "" };
  }
  function makeZoomable(img, getGroup) {
    img.classList.add("zoomable");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Enlarge: " + (img.alt || "screenshot"));
    var open = function () { var g = getGroup(); openBox(g.items, g.start, img); };
    img.addEventListener("click", open);
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  // Carousel photos: step through the whole carousel in the lightbox.
  each(".carousel-track", function (track) {
    var imgs = Array.prototype.slice.call(track.querySelectorAll("img"));
    imgs.forEach(function (img, k) {
      makeZoomable(img, function () { return { items: imgs.map(itemFrom), start: k }; });
    });
  });
  // Single thumbnails (not rotators).
  each(".card-media:not(.rotator) img", function (img) {
    makeZoomable(img, function () { return { items: [itemFrom(img)], start: 0 }; });
  });
  // Rotators: a small button opens the screen in front, with the rest to step through.
  each(".rotator", function (rot) {
    var imgs = Array.prototype.slice.call(rot.querySelectorAll(".slide img"));
    if (!imgs.length) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "zoom-btn";
    btn.innerHTML = "&#10530;";
    btn.setAttribute("aria-label", "Enlarge these screenshots");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var items = imgs.map(function (img) {
        var label = img.closest(".slide").getAttribute("data-label") || "";
        return { src: img.currentSrc || img.src, alt: img.alt, caption: label ? label + ": " + img.alt : img.alt };
      });
      openBox(items, parseInt(rot.getAttribute("data-index") || "0", 10), btn);
    });
    rot.appendChild(btn);
  });
})();
