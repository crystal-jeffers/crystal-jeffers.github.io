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
      "Challenge, build & impact" tab slides out from behind it. The How I
      work steps on the About page follow the same idea (2b).
   3. REVOLVING-DOOR THUMBNAILS.
   4. MY FOCUS: fly-in, and flip cards (hover with a mouse; tap or Enter
      otherwise).
   5. CAROUSELS: arrow buttons and dots.
   6. CLICK TO ENLARGE: gallery photos open full size in a lightbox. Card
      thumbnails open the card's Gallery tab instead.

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

  /* ---------- 2b. How I work: the step nearest the focus line comes forward ----------
     Earlier steps are marked .is-past so the progression reads top to bottom. */
  each(".process", function (list) {
    var steps = Array.prototype.slice.call(list.children);
    if (!steps.length) return;
    list.classList.add("focus-on");
    var cur = -1;
    var mark = function (k) {
      if (k === cur) return;
      cur = k;
      steps.forEach(function (s, j) {
        s.classList.toggle("is-active", j === k);
        s.classList.toggle("is-past", j < k);
      });
    };
    var pickStep = function () {
      var line = window.innerHeight * 0.45, best = 0, bestD = Infinity;
      for (var j = 0; j < steps.length; j++) {
        var r = steps[j].getBoundingClientRect();
        if (r.top <= line && r.bottom >= line) { best = j; break; }
        var d = Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line));
        if (d < bestD) { bestD = d; best = j; }
      }
      mark(best);
    };
    var waiting = false;
    var onMove = function () {
      if (waiting) return;
      waiting = true;
      window.requestAnimationFrame(function () { waiting = false; pickStep(); });
    };
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    steps.forEach(function (s, j) { s.addEventListener("focusin", function () { mark(j); }); });
    pickStep();
  });

  /* ---------- 2c. Project cards: the orange + toggle, tabs, and gallery ----------
     An orange + beside each card's buttons opens and closes its details.
     Inside, site.js turns each <section class="card-panel"> into a binder
     tab (The Challenge, What I Built, Details, Business Impact, Gallery).
     Clicking a card's thumbnail opens the card straight to its Gallery. */
  var openGallery = function () {};
  each(".project details.case", function (det, n) {
    var card = det.closest(".project");
    var base = card && card.id ? card.id : "card-" + n;
    if (!det.id) det.id = base + "-details";
    det.classList.add("has-toggle");

    // Media: a row of story pills inside the Media tab (Video, Starting Cases, ...)
    Array.prototype.forEach.call(det.querySelectorAll(".media-set"), function (set) {
      var panes = Array.prototype.slice.call(set.querySelectorAll(":scope > .media-pane"));
      if (!panes.length) return;
      var row = document.createElement("div");
      row.className = "media-pills";
      row.setAttribute("role", "tablist");
      row.setAttribute("aria-label", "Media");
      var pills = panes.map(function (pn, k) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "media-pill";
        b.setAttribute("role", "tab");
        b.textContent = pn.getAttribute("data-label");
        b.addEventListener("click", function () { set.pickPane(k); });
        row.appendChild(b);
        return b;
      });
      set.insertBefore(row, set.firstChild);
      set.classList.add("pills-on");
      set.pickPane = function (k) {
        panes.forEach(function (pn, j) {
          pn.hidden = j !== k;
          pills[j].setAttribute("aria-selected", j === k ? "true" : "false");
        });
      };
      set.panes = panes;
      // Open on the first story with pictures, not the video placeholder
      var first = 0;
      panes.forEach(function (pn, j) { if (!first && pn.getAttribute("data-pane") !== "video") first = j; });
      set.pickPane(first);
    });

    // Tabs
    var body = det.querySelector(".case-body");
    var folder = det.querySelector(".card-folder");
    var panels = Array.prototype.slice.call(det.querySelectorAll(".card-panel"));
    var tabs = [];
    if (folder && panels.length) {
      var list = document.createElement("div");
      list.className = "card-tabs";
      list.setAttribute("role", "tablist");
      list.setAttribute("aria-label", "Project details");
      panels.forEach(function (pn, k) {
        pn.id = base + "-panel-" + pn.getAttribute("data-tab");
        pn.setAttribute("role", "tabpanel");
        pn.setAttribute("tabindex", "0");
        var t = document.createElement("button");
        t.type = "button";
        t.className = "card-tab";
        t.id = base + "-tab-" + pn.getAttribute("data-tab");
        t.setAttribute("role", "tab");
        t.setAttribute("aria-controls", pn.id);
        t.textContent = pn.getAttribute("data-label");
        pn.setAttribute("aria-labelledby", t.id);
        t.addEventListener("click", function () { pick(k, false); });
        t.addEventListener("keydown", function (e) {
          var m = panels.length, j = null;
          if (e.key === "ArrowRight") j = (k + 1) % m;
          else if (e.key === "ArrowLeft") j = (k - 1 + m) % m;
          else if (e.key === "Home") j = 0;
          else if (e.key === "End") j = m - 1;
          if (j !== null) { e.preventDefault(); pick(j, true); }
        });
        list.appendChild(t);
        tabs.push(t);
      });
      folder.parentNode.insertBefore(list, folder);
      body.classList.add("tabs-on");
    }
    function pick(k, focus) {
      tabs.forEach(function (t, j) {
        var on = j === k;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus && tabs[k]) tabs[k].focus();
    }
    if (tabs.length) pick(0, false);

    // The orange + beside the card's buttons
    var text = card ? card.querySelector(".card-text") : null;
    var links = text ? text.querySelector(".project-links") : null;
    if (text && !links) {
      links = document.createElement("div");
      links.className = "project-links";
      text.appendChild(links);
    }
    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "case-plus";
    plus.setAttribute("aria-controls", det.id);
    if (links) links.appendChild(plus);
    // The play button beside the + opens Media at the video
    var mediaIdx = -1;
    panels.forEach(function (pn, k) { if (pn.getAttribute("data-tab") === "media") mediaIdx = k; });
    if (mediaIdx >= 0 && links) {
      var play = document.createElement("button");
      play.type = "button";
      play.className = "case-play";
      play.setAttribute("aria-label", "Watch the video (coming soon)");
      play.title = "Video coming soon";
      play.innerHTML = '<span class="play-icon" aria-hidden="true"></span>';
      play.addEventListener("click", function () {
        det.open = true;
        pick(mediaIdx, false);
        var set = panels[mediaIdx].querySelector(".media-set");
        if (set && set.pickPane) set.panes.forEach(function (pn, j) { if (pn.getAttribute("data-pane") === "video") set.pickPane(j); });
        window.requestAnimationFrame(function () {
          var top = (tabs[mediaIdx] || panels[mediaIdx]).getBoundingClientRect().top;
          window.scrollBy({ top: top - 100, behavior: calm ? "auto" : "smooth" });
        });
      });
      links.appendChild(play);
    }
    var sync = function () {
      var open = det.open;
      plus.setAttribute("aria-expanded", open ? "true" : "false");
      plus.setAttribute("aria-label", open ? "Hide the challenge, build, and impact" : "Show the challenge, build, and impact");
      plus.title = open ? "Hide details" : "The challenge, build, and impact";
      if (!plus.firstChild) plus.innerHTML = '<span class="plus-icon" aria-hidden="true"></span>';
      if (card) card.classList.toggle("is-open", open);
    };
    plus.addEventListener("click", function () { det.open = !det.open; });
    det.addEventListener("toggle", sync);
    sync();

    // Open straight to the Gallery, at the photo that matches the thumbnail
    if (card) card.openGallery = function (src) {
      det.open = true;
      var file = src ? src.split("/").pop() : "";
      var g = -1, paneIdx = -1, set = null;
      panels.forEach(function (pn, k) {
        if (pn.getAttribute("data-tab") !== "media") return;
        g = k;
        set = pn.querySelector(".media-set");
        if (set && set.panes && file) set.panes.forEach(function (pane, j) {
          if (paneIdx >= 0) return;
          var hit = Array.prototype.slice.call(pane.querySelectorAll(".carousel-track img")).some(function (im) { return (im.getAttribute("src") || "").split("/").pop() === file; });
          if (hit) paneIdx = j;
        });
      });
      if (g < 0) return;
      pick(g, false);
      if (set && set.pickPane && paneIdx >= 0) set.pickPane(paneIdx);
      window.requestAnimationFrame(function () {
        var pane = set && paneIdx >= 0 ? set.panes[paneIdx] : panels[g];
        var track = pane.querySelector(".carousel-track");
        if (track && file) {
          var imgs = Array.prototype.slice.call(track.children);
          imgs.forEach(function (fg, j) {
            var im = fg.querySelector("img");
            if (im && (im.getAttribute("src") || "").split("/").pop() === file) track.scrollLeft = j * track.clientWidth;
          });
        }
        var top = (tabs[g] || panels[g]).getBoundingClientRect().top;
        window.scrollBy({ top: top - 100, behavior: calm ? "auto" : "smooth" });
      });
    };
  });
  openGallery = function (card, src) { if (card && card.openGallery) card.openGallery(src); };

  /* ---------- 2d. About page: "The result" drops in when it scrolls into view ---------- */
  var result = document.querySelector(".ripple-result");
  if (result && document.documentElement.classList.contains("anim-ready")) {
    var rio = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { result.classList.add("flown"); rio.disconnect(); }
    }, { threshold: 0.6 });
    rio.observe(result);
  }

  /* ---------- 2f. About page side navigation ----------
     Appears once the hero has scrolled away, and marks the section in view. */
  var side = document.querySelector(".side-nav");
  if (side) {
    var links = Array.prototype.slice.call(side.querySelectorAll("a"));
    var secs = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var hero = document.querySelector(".hero-banner");
    var spy = function () {
      if (hero) side.classList.toggle("is-shown", hero.getBoundingClientRect().bottom < 90);
      var line = window.innerHeight * 0.35, cur = 0;
      secs.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) cur = i; });
      var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) cur = secs.length - 1;
      links.forEach(function (a, i) {
        if (i === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
      });
    };
    var spyWait = false;
    window.addEventListener("scroll", function () {
      if (spyWait) return;
      spyWait = true;
      window.requestAnimationFrame(function () { spyWait = false; spy(); });
    }, { passive: true });
    window.addEventListener("resize", spy);
    spy();
  }

  /* ---------- 2g. About page: sideways version timeline ----------
     Arrow buttons step one card at a time. The fade on each side shows only
     while there's more to see in that direction. */
  each(".ver-scroller", function (box) {
    var track = box.querySelector(".versions");
    if (!track) return;
    var mk = function (dir, label) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "ver-nav ver-nav-" + dir;
      b.setAttribute("aria-label", label);
      box.appendChild(b);
      return b;
    };
    var prev = mk("prev", "Previous version"), next = mk("next", "Next version");
    // One click moves a whole view: two cards on wider screens, one on phones.
    var cards = Array.prototype.slice.call(track.querySelectorAll(".ver"));
    var perView = function () {
      var c = cards[0];
      if (!c) return 1;
      return Math.max(1, Math.round((track.clientWidth + 16) / (c.getBoundingClientRect().width + 16)));
    };
    var page = function () {
      var c = cards[0];
      var w = c ? c.getBoundingClientRect().width + 16 : track.clientWidth;
      return Math.round(track.scrollLeft / (w * perView()));
    };
    var count = document.createElement("span");
    count.className = "ver-count";
    count.setAttribute("aria-live", "polite");
    box.parentNode.insertBefore(count, box.nextSibling);
    var stepBy = function (d) {
      var c = cards[0];
      var w = (c ? c.getBoundingClientRect().width + 16 : track.clientWidth) * perView();
      track.scrollTo({ left: (page() + d) * w, behavior: calm ? "auto" : "smooth" });
    };
    prev.addEventListener("click", function () { stepBy(-1); });
    next.addEventListener("click", function () { stepBy(1); });
    var update = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      var atStart = track.scrollLeft <= 2, atEnd = track.scrollLeft >= max;
      box.classList.toggle("can-prev", !atStart);
      box.classList.toggle("can-next", !atEnd);
      prev.hidden = atStart;
      next.hidden = atEnd;
      var pages = Math.ceil(cards.length / perView());
      count.textContent = pages > 1 ? (Math.min(page(), pages - 1) + 1) + " of " + pages : "";
    };
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    box.classList.add("is-live");
    update();
  });

  /* ---------- 2h. About page, What I bring: the orange bar over each title
     slides right as its row scrolls into view, then the arrow drops down. */
  var ripple = document.querySelector(".ripple");
  if (ripple && "IntersectionObserver" in window && !calm) {
    var rows = Array.prototype.slice.call(ripple.children);
    rows.forEach(function (li) {
      var tag = li.querySelector(".ripple-tag");
      if (!tag || li.classList.contains("ripple-last")) return;
      var cover = document.createElement("span");
      cover.className = "ripple-cover";
      cover.setAttribute("aria-hidden", "true");
      tag.appendChild(cover);
    });
    ripple.classList.add("drop-ready");
    var rowIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("revealed"); rowIO.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -28% 0px", threshold: 0 });
    rows.forEach(function (li) { rowIO.observe(li); });
  }

  /* ---------- 2i. About me: a deck of three cards ----------
     The white arrow sends the front card to the back. */
  each(".about-deck", function (deck) {
    var stack = deck.querySelector(".deck-cards");
    var cards = stack ? Array.prototype.slice.call(stack.querySelectorAll(".deck-card")) : [];
    if (cards.length < 2) return;
    deck.classList.add("deck-live");
    var order = cards.map(function (_, k) { return k; }); // order[0] is the front card
    var nav = document.createElement("div");
    nav.className = "deck-nav";
    var count = document.createElement("span");
    count.className = "deck-count";
    count.setAttribute("aria-live", "polite");
    var next = document.createElement("button");
    next.type = "button";
    next.className = "deck-next";
    next.setAttribute("aria-label", "Next card");
    nav.appendChild(count);
    nav.appendChild(next);
    deck.appendChild(nav);
    var lay = function () {
      order.forEach(function (cardIndex, pos) {
        var c = cards[cardIndex];
        c.setAttribute("data-pos", String(pos));
        c.setAttribute("aria-hidden", pos === 0 ? "false" : "true");
      });
      count.textContent = (order[0] + 1) + " of " + cards.length;
    };
    var busy = false;
    next.addEventListener("click", function () {
      if (busy) return;
      var front = cards[order[0]];
      var advance = function () {
        front.classList.remove("is-leaving");
        order.push(order.shift());
        lay();
        busy = false;
      };
      if (calm) return advance();
      busy = true;
      front.classList.add("is-leaving");
      setTimeout(advance, 320);
    });
    lay();
  });

  /* ---------- 2j. Year in Review: a vertical deck that cycles every 6 seconds ---------- */
  each(".why-deck", function (deck) {
    var cards = Array.prototype.slice.call(deck.children);
    if (cards.length < 2) return;
    deck.classList.add("why-live");
    var at = 0, last = 0, hover = false;
    var nav = document.createElement("div");
    nav.className = "why-nav";
    var mk = function (cls, label) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "why-btn " + cls; b.setAttribute("aria-label", label);
      nav.appendChild(b); return b;
    };
    var prev = mk("why-prev", "Previous card");
    var count = document.createElement("span");
    count.className = "why-count"; count.setAttribute("aria-live", "polite");
    nav.appendChild(count);
    var next = mk("why-next", "Next card");
    deck.parentNode.insertBefore(nav, deck.nextSibling);
    var lay = function () {
      cards.forEach(function (c, k) {
        var pos = (k - at + cards.length) % cards.length;
        c.setAttribute("data-pos", String(pos));
        c.setAttribute("aria-hidden", pos === 0 ? "false" : "true");
      });
      count.textContent = (at + 1) + " of " + cards.length;
    };
    var go = function (d) {
      var front = cards[at];
      if (calm || d < 0) { at = (at + d + cards.length) % cards.length; lay(); return; }
      front.classList.add("is-dropping");
      setTimeout(function () { front.classList.remove("is-dropping"); at = (at + 1) % cards.length; lay(); }, 380);
    };
    prev.addEventListener("click", function () { last = Date.now(); go(-1); });
    next.addEventListener("click", function () { last = Date.now(); go(1); });
    deck.addEventListener("mouseenter", function () { hover = true; });
    deck.addEventListener("mouseleave", function () { hover = false; });
    lay();
    setInterval(function () {
      if (calm || hover || document.hidden || Date.now() - last < 6000) return;
      var r = deck.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      go(1);
    }, 6000);
  });

  /* ---------- 2k. Year in Review: the message thread plays itself ---------- */
  each(".thread", function (box) {
    var list = box.querySelector(".thread-list");
    var items = list ? Array.prototype.slice.call(list.children) : [];
    if (!items.length || calm) return;
    box.classList.add("thread-live");
    var n = 0, started = false;
    var show = function () {
      if (document.hidden) return setTimeout(show, 1000);
      if (n >= items.length) {
        return setTimeout(function () {
          box.classList.add("thread-reset");
          setTimeout(function () {
            items.forEach(function (it) { it.classList.remove("in"); });
            box.classList.remove("thread-reset");
            list.style.transform = "";
            n = 0; show();
          }, 600);
        }, 4500);
      }
      var it = items[n++];
      it.classList.add("in");
      // keep the newest message at the bottom of the window
      var over = it.offsetTop + it.offsetHeight - box.clientHeight + 16;
      list.style.transform = over > 0 ? "translateY(" + (-over) + "px)" : "";
      var wait = it.classList.contains("msg-topic") ? 900 : 1500 + Math.min(it.textContent.length * 18, 1600);
      setTimeout(show, wait);
    };
    var tio = new IntersectionObserver(function (en) {
      if (!started && en[0].isIntersecting) { started = true; show(); tio.disconnect(); }
    }, { threshold: 0.3 });
    tio.observe(box);
  });

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
     on hover, and never auto-plays for reduced-motion users. A click (or
     Enter) opens the card straight to its Gallery at the screen in front. */
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
    rot.setAttribute("role", "button");
    rot.setAttribute("aria-label", (rot.getAttribute("aria-label") || "Screenshots") + ". Opens the gallery.");
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
    var toGallery = function () {
      var img = slides[i].querySelector("img");
      openGallery(card, img ? img.getAttribute("src") : "");
    };
    rot.addEventListener("click", toGallery);
    rot.addEventListener("keydown", function (e) {
      if (e.target !== rot) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toGallery(); }
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

    // Long carousels show "3 of 24" instead of a wall of dots.
    var count = null;
    if (slides.length > 12) {
      count = document.createElement("span");
      count.className = "carousel-count";
      count.setAttribute("aria-live", "polite");
      dots = count;
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
      if (count) count.textContent = (c + 1) + " of " + slides.length;
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

    // Auto-advance at the same pace as the card thumbnails. Waits while the
    // pointer is over it, after a manual step, or when it isn't on screen.
    var hover = false, lastTouch = 0;
    car.addEventListener("mouseenter", function () { hover = true; });
    car.addEventListener("mouseleave", function () { hover = false; });
    ["click", "keydown", "touchstart", "wheel"].forEach(function (ev) {
      car.addEventListener(ev, function () { lastTouch = Date.now(); }, { passive: true });
    });
    setInterval(function () {
      if (calm || hover || document.hidden || Date.now() - lastTouch < 9000) return;
      if (!track.clientWidth) return;
      var r = car.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var c = current();
      track.scrollTo({ left: (c >= slides.length - 1 ? 0 : c + 1) * track.clientWidth, behavior: "smooth" });
    }, 3400);
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
  // Side-by-side comparisons ("How it evolved") open full size, in order.
  each(".evolve", function (box) {
    var imgs = Array.prototype.slice.call(box.querySelectorAll("img"));
    imgs.forEach(function (img, k) {
      makeZoomable(img, function () { return { items: imgs.map(itemFrom), start: k }; });
    });
  });
  // Version timeline pictures on the About page open full size, in order.
  var vers = Array.prototype.slice.call(document.querySelectorAll("img.ver-shot"));
  vers.forEach(function (img, k) {
    makeZoomable(img, function () { return { items: vers.map(itemFrom), start: k }; });
  });
  // Single thumbnails (not rotators) open their card's Gallery.
  each(".card-media:not(.rotator) img", function (img) {
    var card = img.closest(".project");
    img.classList.add("to-gallery");
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", "Open the gallery: " + (img.alt || "screenshots"));
    var go = function () { openGallery(card, img.getAttribute("src")); };
    img.addEventListener("click", go);
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
})();

/* ---------- Round 4: each section flies off to the right once you scroll
   past it, and flies back in from the left when you scroll back up.
   Content is always visible at rest; only scrolled-past sections move. ---------- */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var sections = Array.prototype.slice.call(document.querySelectorAll("main .page-section")).slice(0, -1);
  if (!sections.length) return;
  var groups = sections.map(function (sec) {
    var items = [];
    Array.prototype.forEach.call(sec.children, function (ch) {
      if (ch.matches("ul.chips")) Array.prototype.push.apply(items, ch.children);
      else items.push(ch);
    });
    items.forEach(function (el, i) { el.classList.add("fly-item"); el.style.setProperty("--fly-i", Math.min(i, 10)); });
    return { sec: sec, items: items, out: false };
  });
  var tick = false;
  var check = function () {
    tick = false;
    var vh = window.innerHeight;
    groups.forEach(function (g) {
      var bottom = g.sec.getBoundingClientRect().bottom;
      if (!g.out && bottom < vh * 0.3) {
        g.out = true;
        g.items.forEach(function (el) { el.classList.remove("fly-back"); el.classList.add("fly-out"); });
      } else if (g.out && bottom > vh * 0.42) {
        g.out = false;
        g.items.forEach(function (el) { el.classList.remove("fly-out"); el.classList.add("fly-prep"); });
        void g.sec.offsetWidth;
        g.items.forEach(function (el) { el.classList.remove("fly-prep"); el.classList.add("fly-back"); });
      }
    });
  };
  window.addEventListener("scroll", function () { if (!tick) { tick = true; window.requestAnimationFrame(check); } }, { passive: true });
  check();
})();

/* ---------- Round 5: Year in Review cards fold down the page ---------- */
(function () {
  var trio = document.querySelector(".why-trio");
  if (!trio || !document.documentElement.classList.contains("anim-ready")) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { trio.classList.add("fallen"); io.disconnect(); } });
  }, { threshold: 0.25 });
  io.observe(trio);
})();

/* ---------- Round 6b: Details headlines open on tap ---------- */
(function () {
  var items = document.querySelectorAll(".card-panel[data-tab='details'] .build-item");
  if (!items.length) return;
  document.documentElement.classList.add("bi-ready");
  document.querySelectorAll(".card-panel[data-tab='details'] .build-list").forEach(function (list) {
    var hint = document.createElement("p"); hint.className = "bi-hint"; hint.textContent = "Tap any item for the details.";
    list.parentNode.insertBefore(hint, list);
  });
  items.forEach(function (it) {
    it.setAttribute("tabindex", "0"); it.setAttribute("role", "button"); it.setAttribute("aria-expanded", "false");
    var toggle = function () { var o = it.classList.toggle("open"); it.setAttribute("aria-expanded", o ? "true" : "false"); };
    it.addEventListener("click", toggle);
    it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
})();
