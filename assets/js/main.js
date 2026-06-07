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

  /* ---------- nav: states + scroll-spy + progress ---------- */
  var nav = $("#nav"), hero = $("#top"), progress = $("#progress");
  var navLinks = $$("#navLinks a");
  var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
  function onScroll() {
    var y = window.scrollY, h = document.documentElement;
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hero-mode", y < hero.offsetHeight - 90);
    progress.style.transform = "scaleX(" + (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) + ")";
    // spy
    var mid = y + innerHeight * 0.32, active = null;
    sections.forEach(function (s) { if (s.offsetTop <= mid) active = s.id; });
    navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + active); });
  }

  /* ---------- mobile menu ---------- */
  var burger = $("#burger");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("menu-open"); }); });

  /* ---------- count-up ---------- */
  function count(el) {
    var target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "", dur = 1500, start = null;
    if (reduce) { el.textContent = target.toLocaleString("en-IN") + suffix; return; }
    function step(ts) {
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
  // legend <-> segment highlight
  var segs = $$(".donut__seg"), legendLis = $$("#legend li");
  function hot(i, on) {
    if (segs[i]) segs[i].classList.toggle("hot", on);
    if (legendLis[i]) legendLis[i].classList.toggle("hot", on);
  }
  legendLis.forEach(function (li, i) {
    li.addEventListener("mouseenter", function () { hot(i, true); });
    li.addEventListener("mouseleave", function () { hot(i, false); });
  });
  segs.forEach(function (s, i) {
    s.addEventListener("mouseenter", function () { hot(i, true); });
    s.addEventListener("mouseleave", function () { hot(i, false); });
  });

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

  /* ---------- journey: bus sway + green road fill ---------- */
  var roadBus = $("#roadBus"), road = $("#road"), roadFill = $("#roadFill");
  function journey() {
    if (!road) return;
    var r = road.getBoundingClientRect();
    var prog = (innerHeight * 0.46 - r.top) / r.height;
    prog = Math.max(0, Math.min(1, prog));
    if (roadFill) roadFill.style.height = (prog * 100) + "%";
    if (roadBus && !reduce) roadBus.style.transform = "rotate(" + (Math.sin(prog * Math.PI * 4) * 6) + "deg)";
  }

  /* ---------- testimonials carousel ---------- */
  (function carousel() {
    var track = $("#carTrack"), vp = $("#carViewport"), dotsWrap = $("#carDots");
    if (!track) return;
    var cards = $$(".qcard", track), n = cards.length, idx = 0, auto;
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
    $("#carNext").addEventListener("click", function () { go(idx + 1); reset(); });
    $("#carPrev").addEventListener("click", function () { go(idx - 1); reset(); });
    // drag / swipe
    var down = false, sx = 0, dx = 0;
    function start(x) { down = true; sx = x; dx = 0; track.classList.add("dragging"); clearInterval(auto); }
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

  /* ---------- LinkedIn links (filled when URLs provided) ---------- */
  var LI = {
    sanjeev: "",
    vidyut: "",
    vidush: ""
  };
  $$(".linkin[data-li]").forEach(function (a) {
    var u = LI[a.dataset.li];
    if (u) { a.href = u; }
    else { a.href = "https://www.linkedin.com/search/results/all/?keywords=" + encodeURIComponent(a.dataset.li + " kauntia"); }
  });

  /* ---------- rAF scroll loop ---------- */
  var ticking = false;
  function loop() { onScroll(); journey(); ticking = false; }
  window.addEventListener("scroll", function () { if (!ticking) { requestAnimationFrame(loop); ticking = true; } }, { passive: true });
  window.addEventListener("resize", loop);
  loop();
})();
