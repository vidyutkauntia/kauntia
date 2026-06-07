/* Kauntia Motor Works — interactions (vanilla, no dependencies) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("yr").textContent = new Date().getFullYear();

  /* ---------- NAV: hero-mode + scrolled state ---------- */
  var nav = document.getElementById("nav");
  var hero = document.getElementById("top");
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    nav.classList.toggle("hero-mode", y < hero.offsetHeight - 90);
    // progress rail
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    rail.style.backgroundPosition = "0 " + (100 - p * 100) + "%";
    bus.style.top = (p * (window.innerHeight - 22)) + "px";
  }
  var rail = document.querySelector(".scroll-rail");
  var bus = document.getElementById("scrollBus");

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger");
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".nav__links a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("menu-open"); });
  });

  /* ---------- count-up ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var dur = 1400, t0 = null;
    var isInt = target % 1 === 0;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - k, 3); // easeOutCubic
      var v = target * e;
      el.textContent = (isInt ? Math.round(v) : v.toFixed(0)).toLocaleString("en-IN") + suffix;
      if (k < 1) requestAnimationFrame(step);
      else el.textContent = (isInt ? Math.round(target) : target).toLocaleString("en-IN") + suffix;
    }
    if (reduce) { el.textContent = target.toLocaleString("en-IN") + suffix; }
    else requestAnimationFrame(step);
  }

  /* ---------- donut ---------- */
  function drawDonut(root) {
    var segs = root.querySelectorAll(".donut__seg");
    var offset = 0;
    segs.forEach(function (s) {
      var val = parseFloat(s.dataset.val);
      // small gap between segments
      s.style.strokeDashoffset = -offset;
      s.style.strokeDasharray = "0 100";
      requestAnimationFrame(function () {
        s.style.strokeDasharray = (val - 1) + " " + (100 - val + 1);
      });
      offset += val;
    });
  }

  /* ---------- rings ---------- */
  function fillRing(ring) {
    var pct = parseFloat(ring.dataset.pct);
    var color = ring.dataset.color;
    var fg = ring.querySelector(".ring__fg");
    var C = 327; // 2*pi*52
    fg.style.stroke = color;
    fg.style.strokeDashoffset = reduce ? C * (1 - pct / 100) : C;
    if (!reduce) requestAnimationFrame(function () {
      fg.style.strokeDashoffset = C * (1 - pct / 100);
    });
    var num = ring.querySelector(".ring__num[data-count]");
    if (num) countUp(num);
  }

  /* ---------- IntersectionObserver: reveals + triggers ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      el.classList.add("in");
      el.querySelectorAll && el.querySelectorAll(".hstat__num[data-count],[data-count]").forEach(function () {});
      io.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll(".reveal, .ms").forEach(function (el) { io.observe(el); });

  /* count-ups via dedicated observer (so numbers fire once visible) */
  var ioNum = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      countUp(en.target);
      ioNum.unobserve(en.target);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach(function (el) {
    if (!el.closest(".ring")) ioNum.observe(el); // ring numbers handled in fillRing
  });

  /* donut + rings observers */
  var ioDonut = new IntersectionObserver(function (e) {
    e.forEach(function (en) { if (en.isIntersecting) { drawDonut(en.target); ioDonut.unobserve(en.target); } });
  }, { threshold: 0.4 });
  var donut = document.getElementById("donut");
  if (donut) ioDonut.observe(donut);

  var ioRing = new IntersectionObserver(function (e) {
    e.forEach(function (en) { if (en.isIntersecting) { fillRing(en.target); ioRing.unobserve(en.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll(".ring").forEach(function (r) { ioRing.observe(r); });

  /* ---------- journey bus: subtle sway following the road ---------- */
  var roadBus = document.getElementById("roadBus");
  var road = document.getElementById("road");
  function swayBus() {
    if (reduce || !roadBus || !road) return;
    var r = road.getBoundingClientRect();
    var prog = (window.innerHeight * 0.46 - r.top) / r.height; // 0..1 down the road
    prog = Math.max(0, Math.min(1, prog));
    var tilt = Math.sin(prog * Math.PI * 4) * 6; // gentle weave
    roadBus.style.transform = "rotate(" + tilt + "deg)";
  }

  /* ---------- rAF scroll loop ---------- */
  var ticking = false;
  function loop() {
    onScroll();
    swayBus();
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(loop); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", loop);
  loop();
})();
