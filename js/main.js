// King Plastic Industries — static site behaviour
(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.querySelector(".mobile-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in-view"); });
      return;
    }

    // Elements sharing a [data-reveal-parent] ancestor fade in together,
    // staggered, the first time any one of them enters the viewport.
    var groupEls = {};
    var solo = [];
    els.forEach(function (el) {
      var group = el.closest("[data-reveal-parent]");
      if (group) {
        if (!groupEls[groupHash(group)]) groupEls[groupHash(group)] = { group: group, items: [] };
        groupEls[groupHash(group)].items.push(el);
      } else {
        solo.push(el);
      }
    });

    var revealed = new WeakSet();
    function revealItems(items) {
      items.forEach(function (item, i) {
        if (revealed.has(item)) return;
        revealed.add(item);
        setTimeout(function () {
          item.classList.add("in-view");
        }, i * 90);
      });
    }

    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          revealItems([entry.target]);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    Object.keys(groupEls).forEach(function (key) {
      var entry = groupEls[key];
      var groupObserver = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            revealItems(entry.items);
            obs.disconnect();
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );
      groupObserver.observe(entry.group);
    });

    solo.forEach(function (el) { io.observe(el); });
  }

  var groupHashCounter = 0;
  var groupHashMap = typeof WeakMap !== "undefined" ? new WeakMap() : null;
  function groupHash(el) {
    if (!groupHashMap) return el;
    if (!groupHashMap.has(el)) groupHashMap.set(el, ++groupHashCounter);
    return groupHashMap.get(el);
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-counter]");
    if (!els.length) return;
    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-counter"));
      var suffix = el.getAttribute("data-suffix") || "";
      var start = null;
      var duration = 1600;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var val = Math.round(eased * target);
        el.textContent = val.toLocaleString("en-US") + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) {
      els.forEach(run);
      return;
    }
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero carousel ---------- */
  function initHeroCarousel() {
    var root = document.querySelector(".hero-carousel");
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dots button"));
    var prevBtn = root.querySelector(".hero-arrow.prev");
    var nextBtn = root.querySelector(".hero-arrow.next");
    var index = 0;
    var timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, si) {
        var active = si === index;
        s.hidden = !active;
        s.classList.toggle("active", active);
      });
      dots.forEach(function (d, di) {
        d.classList.toggle("active", di === index);
      });
    }

    function next() { show(index + 1); }
    function prev() { show(index - 1); }

    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(next, 6000);
    }

    dots.forEach(function (d, di) {
      d.addEventListener("click", function () {
        show(di);
        restart();
      });
    });
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });
    root.addEventListener("mouseenter", function () { if (timer) clearInterval(timer); });
    root.addEventListener("mouseleave", restart);

    show(0);
    restart();
  }

  /* ---------- Generic image switcher ----------
     Any element with [data-switcher] containing:
       - buttons with [data-switch-target="ID"] [data-image] (and optional
         [data-fit], [data-title], [data-desc])
       - a target element with [data-switch-image="ID"]
       - optional panel with [data-switch-panel="ID"] containing
         [data-panel-title] / [data-panel-desc]
  */
  function initSwitchers() {
    document.querySelectorAll("[data-switcher]").forEach(function (root) {
      var buttons = root.querySelectorAll("[data-image]");
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          var targetId = btn.getAttribute("data-switch-target");
          var img = root.querySelector('[data-switch-image="' + targetId + '"]');
          if (img) {
            img.style.backgroundImage = "url('" + btn.getAttribute("data-image") + "')";
            img.style.opacity = "0.15";
            requestAnimationFrame(function () {
              img.style.transition = "opacity 0.4s ease";
              img.style.opacity = "1";
            });
          }
          buttons.forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");

          var panel = root.querySelector('[data-switch-panel="' + targetId + '"]');
          if (panel) {
            var titleEl = panel.querySelector("[data-panel-title]");
            var descEl = panel.querySelector("[data-panel-desc]");
            if (titleEl && btn.getAttribute("data-title")) titleEl.textContent = btn.getAttribute("data-title");
            if (descEl && btn.getAttribute("data-desc")) descEl.textContent = btn.getAttribute("data-desc");
          }
        });
      });
    });
  }

  /* ---------- Size picker (Milli / BlockBottom detail pages) ----------
     [data-size-toggle] shows/hides [data-size-table]
     rows [data-size-image] + [data-size-label] update [data-size-hero]
     and [data-size-caption]
  */
  function initSizePickers() {
    document.querySelectorAll("[data-size-toggle]").forEach(function (btn) {
      var targetId = btn.getAttribute("data-size-toggle");
      var table = document.querySelector('[data-size-table="' + targetId + '"]');
      if (!table) return;
      btn.addEventListener("click", function () {
        var open = table.classList.toggle("open");
        btn.classList.toggle("open", open);
        var actionEl = btn.querySelector("[data-toggle-label]");
        if (actionEl) actionEl.textContent = open ? "Hide" : "View";
      });
    });

    document.querySelectorAll("[data-size-hero]").forEach(function (heroWrap) {
      var id = heroWrap.getAttribute("data-size-hero");
      var caption = document.querySelector('[data-size-caption="' + id + '"]');
      var rows = document.querySelectorAll('[data-size-row="' + id + '"]');
      rows.forEach(function (row) {
        if (row.classList.contains("disabled")) return;
        row.addEventListener("click", function () {
          var image = row.getAttribute("data-size-image");
          if (!image) return;
          heroWrap.style.backgroundImage = "url('" + image + "')";
          heroWrap.style.backgroundSize = "contain";
          heroWrap.style.backgroundColor = "#FFFDF8";
          heroWrap.style.opacity = "0.2";
          heroWrap.style.transform = "scale(0.98)";
          requestAnimationFrame(function () {
            heroWrap.style.transition = "opacity 0.45s ease, transform 0.45s ease";
            heroWrap.style.opacity = "1";
            heroWrap.style.transform = "scale(1)";
          });
          rows.forEach(function (r) { r.classList.remove("active"); });
          row.classList.add("active");
          if (caption && row.getAttribute("data-size-caption-text")) {
            caption.textContent = row.getAttribute("data-size-caption-text");
          }
        });
      });
    });
  }

  function safe(fn, name) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.error) console.error("main.js: " + name + " failed", err);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    safe(initMobileMenu, "initMobileMenu");
    safe(initReveal, "initReveal");
    safe(initCounters, "initCounters");
    safe(initHeroCarousel, "initHeroCarousel");
    safe(initSwitchers, "initSwitchers");
    safe(initSizePickers, "initSizePickers");
  });
})();
