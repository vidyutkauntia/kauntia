/* Kauntia Motor Works — interactions (vanilla, no dependencies) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  $("#yr").textContent = new Date().getFullYear();

  /* ---------- custom cursor ---------- */
  if (fine && !reduce) {
    var cur = $("#cursor"), dot = $("#cursorDot");
    var cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.left = tx + "px"; dot.style.top = ty + "px";
      cur.style.opacity = dot.style.opacity = "1";
    });
    (function follow() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.left = cx + "px"; cur.style.top = cy + "px";
      requestAnimationFrame(follow);
    })();
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("[data-cursor], a, button")) cur.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("[data-cursor], a, button")) cur.classList.remove("is-hover");
    });
    document.addEventListener("mouseleave", function () { cur.style.opacity = dot.style.opacity = "0"; });
  }

  /* ---------- nav: states + scroll-spy + progress + wheel ---------- */
  var nav = $("#nav"), hero = $("#top"), progress = $("#progress");
  var navLinks = $$("#navLinks a");
  var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
  var wheelRotor = $("#wheelRotor"), wheelProg = $("#wheelProg"), WHEEL_MAXDEG = 1000, WP_C = 295.31;
  var heroInner = $("#heroInner"), heroVideo = $("#heroVideo");
  function onScroll() {
    var y = window.scrollY, h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    p = Math.max(0, Math.min(1, p));
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hero-mode", y < hero.offsetHeight - 90);
    // hero parallax (Apple-style): content drifts up + fades, video zooms gently
    if (!reduce && y < hero.offsetHeight) {
      var hp = Math.min(y / hero.offsetHeight, 1);
      if (heroInner) { heroInner.style.transform = "translateY(" + (hp * 70) + "px)"; heroInner.style.opacity = String(Math.max(0, 1 - hp * 1.25)); }
      if (heroVideo) heroVideo.style.transform = "scale(" + (1 + hp * 0.14) + ")";
    }
    progress.style.transform = "scaleX(" + p + ")";
    if (wheelRotor) wheelRotor.style.transform = "rotate(" + (p * WHEEL_MAXDEG) + "deg)";
    if (wheelProg) wheelProg.style.strokeDashoffset = WP_C * (1 - p);
    // spy
    var mid = y + innerHeight * 0.32, active = null;
    sections.forEach(function (s) { if (s.offsetTop <= mid) active = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + active); });
  }

  /* ---------- steering wheel: drag to drive (native scroll stays intact) ---------- */
  (function steering() {
    var wheel = $("#wheel"), tip = $("#wheelTip");
    if (!wheel) return;
    // gentle one-time nudge so users notice it is interactive
    if (!reduce) { setTimeout(function () { tip && tip.classList.add("show"); }, 1400);
      setTimeout(function () { tip && tip.classList.remove("show"); }, 6500); }
    var dragging = false, lastAng = 0;
    function ang(e) {
      var r = wheel.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
    }
    wheel.addEventListener("pointerdown", function (e) {
      dragging = true; lastAng = ang(e); wheel.classList.add("grab");
      try { wheel.setPointerCapture(e.pointerId); } catch (x) {}
      tip && tip.classList.remove("show"); e.preventDefault();
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var a = ang(e), d = a - lastAng;
      if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
      lastAng = a;
      var doc = document.documentElement;
      var factor = (doc.scrollHeight - doc.clientHeight) / 760; // ~2 turns = whole page
      window.scrollBy(0, (d * 180 / Math.PI) * factor); // clockwise (right) scrolls down
    });
    window.addEventListener("pointerup", function () { dragging = false; wheel.classList.remove("grab"); });
    window.addEventListener("pointercancel", function () { dragging = false; wheel.classList.remove("grab"); });
  })();

  /* ---------- mobile menu ---------- */
  var burger = $("#burger");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("menu-open"); }); });

  /* ---------- count-up ---------- */
  function count(el) {
    var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "", dur = 2400, start = null;
    if (reduce) { el.textContent = target.toLocaleString("en-IN") + suffix; return; }
    function step(ts) {
      if (el._stop) return;
      if (start === null) start = ts;
      var k = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e).toLocaleString("en-IN") + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- donut ---------- */
  function drawDonut() {
    var segs = $$(".donut__seg"), offset = 0;
    segs.forEach(function (s) {
      var val = parseFloat(s.dataset.val);
      s.style.strokeDashoffset = -offset;
      requestAnimationFrame(function () { s.style.strokeDasharray = (val - 1) + " " + (100 - val + 1); });
      offset += val;
    });
  }
  // legend <-> segment highlight + click-to-focus (shows weightage)
  var donutEl = $("#donut"), segs = $$(".donut__seg"), legendLis = $$("#legend li");
  var big = $(".donut__big"), cap = $(".donut__cap");
  var focused = -1;
  function hot(i, on) {
    if (focused >= 0) return; // don't fight a locked focus on hover
    if (segs[i]) segs[i].classList.toggle("hot", on);
    if (legendLis[i]) legendLis[i].classList.toggle("hot", on);
  }
  function resetFocus() {
    focused = -1; donutEl.classList.remove("focusing");
    segs.forEach(function (s) { s.classList.remove("hot"); });
    legendLis.forEach(function (l) { l.classList.remove("hot"); });
    big.classList.remove("sm"); big.textContent = "12,000"; cap.textContent = "e-buses in India";
  }
  function focus(i) {
    if (big) big._stop = true; // lock center against the count-up animation
    if (focused === i) { resetFocus(); return; }
    focused = i;
    donutEl.classList.add("focusing");
    segs.forEach(function (s, j) { s.classList.toggle("hot", j === i); });
    legendLis.forEach(function (l, j) { l.classList.toggle("hot", j === i); });
    big.classList.add("sm");
    big.textContent = parseFloat(segs[i].dataset.val) + "%";
    cap.textContent = segs[i].dataset.name + " share";
  }
  legendLis.forEach(function (li, i) {
    li.addEventListener("mouseenter", function () { hot(i, true); });
    li.addEventListener("mouseleave", function () { hot(i, false); });
    li.addEventListener("click", function () { focus(i); });
  });
  segs.forEach(function (s, i) {
    s.addEventListener("mouseenter", function () { hot(i, true); });
    s.addEventListener("mouseleave", function () { hot(i, false); });
    s.addEventListener("click", function () { focus(i); });
  });
  if (big) big.parentNode.addEventListener("click", function () { if (focused >= 0) resetFocus(); });
  var donutReset = $("#donutReset");
  if (donutReset) donutReset.addEventListener("click", resetFocus);

  /* ---------- rings ---------- */
  function fillRing(ring) {
    var pct = parseFloat(ring.dataset.pct), fg = ring.querySelector(".ring__fg"), C = 327;
    fg.style.stroke = ring.dataset.color;
    fg.style.strokeDashoffset = C;
    if (!reduce) requestAnimationFrame(function () { fg.style.strokeDashoffset = C * (1 - pct / 100); });
    else fg.style.strokeDashoffset = C * (1 - pct / 100);
    var num = ring.querySelector(".ring__num[data-count]");
    if (num) count(num);
  }

  /* ---------- observers ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal, .ms").forEach(function (el) { io.observe(el); });

  var ioNum = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { count(en.target); ioNum.unobserve(en.target); } });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { if (!el.closest(".ring") && !el.closest(".donut")) ioNum.observe(el); });

  var ioDonut = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { drawDonut(); var b = $(".donut__big"); if (b) count(b); ioDonut.unobserve(en.target); } });
  }, { threshold: 0.4 });
  if ($("#donut")) ioDonut.observe($("#donut"));

  var ioRing = new IntersectionObserver(function (es) {
    es.forEach(function (en) { if (en.isIntersecting) { fillRing(en.target); ioRing.unobserve(en.target); } });
  }, { threshold: 0.5 });
  $$(".ring").forEach(function (r) { ioRing.observe(r); });

  /* ---------- logo marquee: repeat enough tiles for a seamless, gap-free loop ---------- */
  (function logos() {
    var track = $("#logosTrack");
    if (!track) return;
    var base = track.innerHTML;          // the starting set of tiles
    track.innerHTML = base;
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.3 && guard < 20) { track.innerHTML += base; guard++; }
    track.innerHTML = track.innerHTML + track.innerHTML; // two identical halves -> -50% loops seamlessly
  })();

  /* ---------- fleet grid (449 buses, by city) ---------- */
  (function fleet() {
    var viz = $("#fleetViz"); if (!viz) return;
    var groups = [
      { n: 12, c: "var(--green-bright)" }, // Bengaluru 120
      { n: 10, c: "#3fd089" },             // Guwahati 100
      { n: 17, c: "var(--navy-2)" },       // Delhi 168
      { n: 6,  c: "var(--navy)" }          // Dolvi 61
    ];
    var k = 0;
    groups.forEach(function (g) {
      for (var j = 0; j < g.n; j++) {
        var s = document.createElement("span");
        s.className = "fbus"; s.style.background = g.c;
        s.style.transitionDelay = (k * 0.022) + "s";
        viz.appendChild(s); k++;
      }
    });
  })();

  /* ---------- journey map: road draws, nodes surface in sequence, bus drives ---------- */
  (function jmapBus() {
    var jmap = $("#jmap"); if (!jmap) return;
    var motion = document.getElementById("jbusMotion");
    // stagger the node reveals so they appear after the road begins drawing
    $$(".jnode").forEach(function (n, i) { n.style.transitionDelay = (0.55 + i * 0.07) + "s"; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting && motion && !reduce) { try { motion.beginElement(); } catch (x) {} } });
    }, { threshold: 0.35 });
    io.observe(jmap);
  })();

  /* ---------- journey node hover tooltips (content on hover) ---------- */
  (function jtip() {
    var tip = $("#jtip"), jmap = $("#jmap");
    if (!tip || !jmap) return;
    $$(".jnode").forEach(function (node) {
      var titleEl = node.querySelector("title");
      var desc = titleEl ? titleEl.textContent : "";
      function place() {
        var nb = node.getBoundingClientRect(), mb = jmap.getBoundingClientRect();
        var cx = nb.left + nb.width / 2 - mb.left;
        var below = (nb.top - mb.top) < mb.height * 0.42;
        tip.textContent = desc;
        tip.style.left = cx + "px";
        tip.style.top = (below ? (nb.bottom - mb.top) : (nb.top - mb.top)) + "px";
        tip.classList.toggle("below", below);
        tip.classList.add("show");
      }
      node.addEventListener("mouseenter", place);
      node.addEventListener("mouseleave", function () { tip.classList.remove("show"); });
    });
  })();

  /* ---------- (legacy vertical road; no-op if absent) ---------- */
  var roadBus = $("#roadBus"), road = $("#road"), roadFill = $("#roadFill");
  var roadLine = road ? road.querySelector(".road__line") : null;
  function journey() {
    if (!road) return;
    var r = road.getBoundingClientRect();
    var prog = (innerHeight * 0.46 - r.top) / r.height;
    prog = Math.max(0, Math.min(1, prog));
    if (roadFill) roadFill.style.height = (prog * 100) + "%";
    if (roadLine && !reduce) roadLine.style.backgroundPositionY = (-prog * r.height * 2) + "px";
    if (roadBus) {
      // drive the bus down the road, keeping it ~centred in the viewport while in range
      var bh = roadBus.offsetHeight || 84;
      var t = Math.max(0, Math.min(innerHeight * 0.46 - r.top, r.height - bh));
      roadBus.style.top = t + "px";
      var tilt = reduce ? 0 : Math.sin(prog * Math.PI * 4) * 6;
      roadBus.style.transform = "translateX(-50%) rotate(" + tilt + "deg)";
    }
  }

  /* ---------- testimonials carousel ---------- */
  (function carousel() {
    var track = $("#carTrack"), vp = $("#carViewport"), dotsWrap = $("#carDots");
    if (!track) return;
    var cards = $$(".qcard", track), n = cards.length, idx = 0, auto;
    var hint = $("#carHint"), hintGone = false;
    function hideHint() { if (hint && !hintGone) { hint.style.transition = "opacity .4s"; hint.style.opacity = "0"; hintGone = true; } }
    cards.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Go to slide " + (i + 1));
      b.addEventListener("click", function () { go(i); reset(); });
      dotsWrap.appendChild(b);
    });
    var dots = $$("button", dotsWrap);
    function go(i) {
      idx = (i + n) % n;
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      dots.forEach(function (d, j) { d.classList.toggle("active", j === idx); });
    }
    function reset() { clearInterval(auto); if (!reduce) auto = setInterval(function () { go(idx + 1); }, 6000); }
    $("#carNext").addEventListener("click", function () { go(idx + 1); reset(); hideHint(); });
    $("#carPrev").addEventListener("click", function () { go(idx - 1); reset(); hideHint(); });
    // drag / swipe
    var down = false, sx = 0, dx = 0;
    function start(x) { down = true; sx = x; dx = 0; track.classList.add("dragging"); clearInterval(auto); hideHint(); }
    function move(x) { if (down) { dx = x - sx; track.style.transform = "translateX(calc(" + (-idx * 100) + "% + " + dx + "px))"; } }
    function end() {
      if (!down) return; down = false; track.classList.remove("dragging");
      if (Math.abs(dx) > vp.offsetWidth * 0.18) go(idx + (dx < 0 ? 1 : -1)); else go(idx);
      reset();
    }
    vp.addEventListener("pointerdown", function (e) { start(e.clientX); });
    window.addEventListener("pointermove", function (e) { move(e.clientX); });
    window.addEventListener("pointerup", end);
    vp.addEventListener("mouseenter", function () { clearInterval(auto); });
    vp.addEventListener("mouseleave", reset);
    go(0); reset();
  })();

  /* ---------- leadership showcase ---------- */
  (function showcase() {
    var tabs = $$("#showcaseTabs .stab"), photos = $$(".showcase__photo img"), panels = $$(".showcase__panel");
    if (!tabs.length) return;
    function select(i) {
      tabs.forEach(function (t, j) { t.classList.toggle("is-active", j === i); });
      photos.forEach(function (p, j) { p.classList.toggle("is-active", j === i); });
      panels.forEach(function (p, j) { p.classList.toggle("is-active", j === i); });
    }
    tabs.forEach(function (t, i) { t.addEventListener("click", function () { select(i); }); });
  })();

  /* ---------- India map: sync pin <-> location list on hover ---------- */
  (function indiamap() {
    function link(a, b) {
      a.addEventListener("mouseenter", function () { a.classList.add("active"); if (b) b.classList.add("active"); });
      a.addEventListener("mouseleave", function () { a.classList.remove("active"); if (b) b.classList.remove("active"); });
    }
    $$(".loc").forEach(function (li) { link(li, document.querySelector('.pin[data-k="' + li.dataset.k + '"]')); });
    $$(".pin").forEach(function (pin) { link(pin, document.querySelector('.loc[data-k="' + pin.dataset.k + '"]')); });
  })();

  /* ---------- Life reel: repeat frames for a seamless loop, then wire lightbox ----------
     (fixed 6x repeat = two identical 3x halves, so the -50% keyframe loops with no gap;
      avoids measuring image widths, which are 0 before load) */
  $$(".reel__row").forEach(function (row) {
    var base = row.innerHTML;
    row.innerHTML = base + base + base + base + base + base;
  });
  (function lightbox() {
    var lb = $("#lightbox"), img = $("#lbImg"), cap = $("#lbCap"), closeBtn = $("#lbClose");
    if (!lb) return;
    function show(t) {
      var im = t.querySelector("img");
      img.src = im.src; img.alt = im.alt || ""; cap.textContent = t.dataset.cap || "";
      lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
    }
    function hide() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
    $$(".frame").forEach(function (t) {
      t.addEventListener("click", function () { show(t); });
    });
    closeBtn.addEventListener("click", hide);
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__fig")) hide(); });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  })();

  /* ---------- LinkedIn links (legacy; team links are hard-coded in HTML) ---------- */
  var LI = {
    sanjeev: "https://www.linkedin.com/in/sanjeevkauntia",
    vidyut: "https://www.linkedin.com/in/vidyutkauntia",
    vidush: "https://www.linkedin.com/in/vidush-kauntia"
  };
  $$(".linkin[data-li]").forEach(function (a) {
    var u = LI[a.dataset.li];
    if (u) a.href = u;
    else a.href = "https://www.linkedin.com/search/results/all/?keywords=" + encodeURIComponent(a.dataset.li + " kauntia");
  });

  /* ---------- rAF scroll loop ---------- */
  var ticking = false;
  function loop() { onScroll(); journey(); ticking = false; }
  window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(loop); ticking = true; } }, { passive: true });
  window.addEventListener("resize", loop);
  loop();
})();
