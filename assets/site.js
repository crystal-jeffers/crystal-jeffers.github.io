/* =========================================================================
   SITE.JS: two small enhancements. The page is complete without this file:
   every card, image and accordion is fully visible if it fails to load.

   1. CARD FOCUS: as you scroll, the card nearest the focus line "stands up"
      (class .is-active) and the others settle back and dim slightly.
      Nothing is ever hidden; inactive text stays readable (AA contrast).
   2. CAROUSELS: adds arrow buttons and dots. Without this file the photos
      still scroll sideways by swipe, trackpad or keyboard.

   Reduced motion: style.css removes all movement and transitions for people
   whose device asks for less motion; the active card is still marked by
   color and shadow.
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- 1. Card focus ---------- */
  var cards = Array.prototype.slice.call(document.querySelectorAll(".project"));
  if (cards.length && "getBoundingClientRect" in document.documentElement) {
    document.documentElement.classList.add("focus-ready");

    var active = null;
    var FOCUS_LINE = 0.42; // fraction of the window height, from the top

    function setActive(card) {
      if (card === active) return;
      if (active) active.classList.remove("is-active");
      card.classList.add("is-active");
      active = card;
    }

    function pick() {
      var line = window.innerHeight * FOCUS_LINE;
      var doc = document.documentElement;
      var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 4;
      var last = cards[cards.length - 1];

      // At the very bottom the last card can never reach the line, so give it focus.
      if (atBottom && last.getBoundingClientRect().top < window.innerHeight) {
        return setActive(last);
      }

      var best = cards[0], bestDist = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var r = cards[i].getBoundingClientRect();
        if (r.top <= line && r.bottom >= line) return setActive(cards[i]);
        var d = Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line));
        if (d < bestDist) { bestDist = d; best = cards[i]; }
      }
      setActive(best);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; pick(); });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Opening or closing an accordion changes card heights.
    cards.forEach(function (card) {
      card.addEventListener("toggle", onScroll, true);
      // Keyboard users: tabbing into a card brings it into focus.
      card.addEventListener("focusin", function () { setActive(card); });
    });
    pick();
  }

  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 3. Revolving-door thumbnails ----------
     Advances only while its card is the one in focus and on screen, pauses
     on hover, and never auto-plays for reduced-motion users (a click or
     Enter still steps through). */
  Array.prototype.forEach.call(document.querySelectorAll(".rotator"), function (rot) {
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
    rot.addEventListener("click", step);
    rot.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); step(); }
    });

    place();
    setInterval(function () { if (shouldPlay()) step(); }, 3400);
  });

  /* ---------- 4. My Focus fly-in (setup is in the page <head>) ---------- */
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

  /* ---------- 2. Carousels ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".carousel"), function (car) {
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
    for (var i = 0; i < slides.length; i++) {
      (function (n) {
        var dot = document.createElement("button");
        dot.type = "button"; dot.className = "carousel-dot";
        dot.setAttribute("aria-label", "Photo " + (n + 1) + " of " + slides.length);
        dot.addEventListener("click", function () { go(n); });
        dots.appendChild(dot); dotEls.push(dot);
      })(i);
    }

    controls.appendChild(prev); controls.appendChild(dots); controls.appendChild(next);
    car.appendChild(controls);

    function current() {
      return Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    }
    function go(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      track.scrollTo({ left: n * track.clientWidth, behavior: calm ? "auto" : "smooth" });
    }
    function update() {
      var c = current();
      prev.disabled = c <= 0;
      next.disabled = c >= slides.length - 1;
      dotEls.forEach(function (d, k) {
        d.classList.toggle("active", k === c);
        if (k === c) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
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
})();
