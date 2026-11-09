/* =========================================================
   Amaya Devindi — shared site behaviour
   Theme toggle, mobile nav, scroll-reveal, lightbox, contact form.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var THEME_KEY = "site-theme";
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }
  function currentTheme() {
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (stored) return stored;
    return null; // follow system preference
  }
  applyTheme(currentTheme());

  function initThemeToggle() {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var active = document.documentElement.getAttribute("data-theme") || (systemDark ? "dark" : "light");
      var next = active === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------- Mobile nav ---------- */
  function initNavToggle() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var links = document.querySelector("[data-nav-links]");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      links.classList.toggle("is-open");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("is-open"); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  // Auto-tag common content blocks as reveal targets if the page didn't already.
  function autoReveal() {
    document.querySelectorAll("[data-reveal] > *").forEach(function (el, i) {
      if (!el.classList.contains("reveal")) {
        el.classList.add("reveal");
        el.style.transitionDelay = Math.min(i * 60, 300) + "ms";
      }
    });
  }

  /* ---------- Lightbox (used by gallery pages) ---------- */
  window.SiteLightbox = {
    open: function (url, isVideo) {
      var box = document.getElementById("site-lightbox");
      if (!box) return;
      var area = box.querySelector(".lightbox-media");
      area.innerHTML = isVideo
        ? '<video src="' + url + '" controls autoplay playsinline></video>'
        : '<img src="' + url + '" alt="">';
      box.classList.add("is-active");
      document.body.style.overflow = "hidden";
    },
    close: function () {
      var box = document.getElementById("site-lightbox");
      if (!box) return;
      var video = box.querySelector("video");
      if (video) video.pause();
      box.classList.remove("is-active");
      box.querySelector(".lightbox-media").innerHTML = "";
      document.body.style.overflow = "";
    }
  };

  function initLightboxShell() {
    if (document.getElementById("site-lightbox")) return;
    var div = document.createElement("div");
    div.id = "site-lightbox";
    div.className = "lightbox";
    div.innerHTML = '<span class="lightbox-close">&times;</span><div class="lightbox-media"></div>';
    div.addEventListener("click", function (e) {
      if (e.target === div || e.target.classList.contains("lightbox-close")) {
        window.SiteLightbox.close();
      }
    });
    document.body.appendChild(div);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") window.SiteLightbox.close();
    });
  }

  /* ---------- Contact form ---------- */
  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;
    var endpoint = form.getAttribute("data-endpoint");
    var status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (e) {
      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var message = form.querySelector('[name="message"]').value.trim();
      var mailTo = form.getAttribute("data-mailto");

      // No Formspree (or similar) endpoint configured yet -> fall back to mailto,
      // which needs no sign-up and always works.
      if (!endpoint || endpoint.indexOf("YOUR_FORM_ID") !== -1) {
        e.preventDefault();
        var subject = encodeURIComponent("Portfolio contact from " + (name || "your website"));
        var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
        window.location.href = "mailto:" + mailTo + "?subject=" + subject + "&body=" + body;
        if (status) status.textContent = "Opening your email app…";
        return;
      }

      // Formspree-style endpoint configured: submit via fetch so the page doesn't reload.
      e.preventDefault();
      if (status) status.textContent = "Sending…";
      fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      }).then(function (res) {
        if (res.ok) {
          if (status) status.textContent = "Thanks! Your message is on its way.";
          form.reset();
        } else {
          if (status) status.textContent = "Something went wrong — please email me directly instead.";
        }
      }).catch(function () {
        if (status) status.textContent = "Something went wrong — please email me directly instead.";
      });
    });
  }

  /* ---------- Generic filter/search (projects, galleries, resources) ---------- */
  window.SiteFilter = {
    init: function (opts) {
      var items = Array.prototype.slice.call(document.querySelectorAll(opts.itemSelector));
      var chips = Array.prototype.slice.call(document.querySelectorAll(opts.chipSelector));
      var search = opts.searchSelector ? document.querySelector(opts.searchSelector) : null;
      var emptyState = opts.emptySelector ? document.querySelector(opts.emptySelector) : null;
      var activeChip = "all";

      function apply() {
        var q = search ? search.value.trim().toLowerCase() : "";
        var visible = 0;
        items.forEach(function (item) {
          var cats = (item.getAttribute(opts.dataAttr) || "").toLowerCase().split("|");
          var matchesChip = activeChip === "all" || cats.indexOf(activeChip) !== -1;
          var text = item.textContent.toLowerCase();
          var matchesSearch = !q || text.indexOf(q) !== -1;
          var show = matchesChip && matchesSearch;
          item.style.display = show ? "" : "none";
          if (show) visible++;
        });
        if (emptyState) emptyState.style.display = visible === 0 ? "" : "none";
      }

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          chips.forEach(function (c) { c.classList.remove("is-active"); });
          chip.classList.add("is-active");
          activeChip = (chip.getAttribute("data-filter") || "all").toLowerCase();
          apply();
        });
      });
      if (search) search.addEventListener("input", apply);
      apply();
    }
  };

  /* ---------- Gallery lightbox binding (event delegation) ---------- */
  window.SiteGallery = {
    bind: function (containerSelector) {
      var root = document.querySelector(containerSelector);
      if (!root) return;
      root.addEventListener("click", function (e) {
        var item = e.target.closest("[data-lightbox-url]");
        if (!item) return;
        window.SiteLightbox.open(
          item.getAttribute("data-lightbox-url"),
          item.getAttribute("data-lightbox-type") === "video"
        );
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    initThemeToggle();
    initNavToggle();
    initLightboxShell();
    autoReveal();
    initReveal();
    initContactForm();
  });

  // Expose a re-run hook for pages that render cards dynamically after load.
  window.SiteUI = { refreshReveal: function () { autoReveal(); initReveal(); } };
})();
