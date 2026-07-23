/* =========================================================
   LIVE YOUR EFFERVESCENCE — interactions
   Bubble canvas · scroll reveals · poem experience · UI
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  /* ---------- Preloader ---------- */
  window.addEventListener("load", () => {
    const pre = $("#preloader");
    if (pre) setTimeout(() => pre.classList.add("is-done"), 1100);
  });

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav scroll state + progress ---------- */
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle("is-scrolled", y > 40);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $("#navToggle");
  const menu = $("#mobileMenu");
  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  if (toggle) toggle.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || "0", 10);
          setTimeout(() => el.classList.add("is-visible"), delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Poem: line-by-line illumination ---------- */
  const poemLines = $$(".stanza .pl");
  if (poemLines.length) {
    if ("IntersectionObserver" in window && !prefersReduced) {
      const pio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("is-lit"); pio.unobserve(entry.target); }
        });
      }, { threshold: 0.6, rootMargin: "0px 0px -12% 0px" });
      poemLines.forEach((l) => pio.observe(l));
    } else {
      poemLines.forEach((l) => l.classList.add("is-lit"));
    }
  }

  /* ---------- Pillars: pointer-follow glow ---------- */
  $$(".pillar").forEach((p) => {
    p.addEventListener("pointermove", (e) => {
      const r = p.getBoundingClientRect();
      p.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      p.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !prefersReduced) {
    $$(".magnetic").forEach((btn) => {
      const strength = 18;
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- Custom cursor bubble ---------- */
  if (finePointer && !prefersReduced) {
    const cursor = document.createElement("div");
    cursor.className = "cursor-bubble";
    document.body.appendChild(cursor);
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    const loop = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, .pillar, .card").forEach((el) => {
      el.addEventListener("pointerenter", () => { cursor.style.width = "48px"; cursor.style.height = "48px"; cursor.style.background = "rgba(243,211,138,0.10)"; });
      el.addEventListener("pointerleave", () => { cursor.style.width = "26px"; cursor.style.height = "26px"; cursor.style.background = "transparent"; });
    });
  }

  /* ---------- Contact form (client-side, no backend) ---------- */
  const form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#formNote");
      const name = $("#cf-name").value.trim();
      const email = $("#cf-email").value.trim();
      const subject = $("#cf-subject").value;
      const message = $("#cf-message").value.trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !validEmail || !message) {
        note.textContent = "Please add your name, a valid email, and a message.";
        note.classList.add("is-error");
        return;
      }
      note.classList.remove("is-error");
      // Opens the visitor's email client addressed to the brand inbox.
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      const to = "liveyoureffervescence@gmail.com";
      window.location.href = `mailto:${to}?subject=${encodeURIComponent("[LYE] " + subject + " — " + name)}&body=${body}`;
      note.textContent = "Opening your email app… thank you for reaching out ✦";
      form.reset();
    });
  }

  /* ---------- Video lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbFrame = $("#lightboxFrame");
  const lbTitle = $("#lightboxTitle");
  const lbClose = $("#lightboxClose");
  let lastFocused = null;

  const openLightbox = (id, title) => {
    if (!lightbox || !lbFrame) return;
    lastFocused = document.activeElement;
    lbFrame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0&modestbranding=1" title="' + (title || "Video") +
      '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
    lbTitle.textContent = title || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lbClose.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lbFrame.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  };

  $$("[data-video]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openLightbox(el.dataset.video, el.dataset.videoTitle || el.textContent.trim());
    });
  });
  // Make whole video card clickable
  $$(".card--video").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return; // let the link handler run
      const link = card.querySelector("[data-video]");
      if (link) openLightbox(link.dataset.video, link.dataset.videoTitle);
    });
  });
  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lightbox) lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) closeLightbox(); });

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");
  if (toTop) {
    window.addEventListener("scroll", () => {
      toTop.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.9);
    }, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" }));
  }

  /* ---------- Scrollspy (active nav link) ---------- */
  const navLinks = $$(".nav__links a");
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Giscus comments fallback ---------- */
  const comments = $("#comments");
  const giscusMount = $("#giscusMount");
  const commentsFallback = $("#commentsFallback");
  if (comments && giscusMount && commentsFallback) {
    const showFallback = () => {
      comments.classList.add("is-fallback");
      commentsFallback.hidden = false;
    };
    // If giscus posts an error (or never mounts a frame), offer the Discussion link.
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://giscus.app") return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data && data.giscus && data.giscus.error) showFallback();
      } catch (_) { /* ignore */ }
    });
    setTimeout(() => {
      const frame = giscusMount.querySelector("iframe.giscus-frame");
      const errored = /giscus is not installed|Error/i.test(giscusMount.textContent || "");
      if (!frame || errored) showFallback();
    }, 3500);
  }

  /* ---------- Hero slideshow (moving images) ---------- */
  const slides = $$(".hero__slide");
  if (slides.length > 1 && !prefersReduced) {
    let si = 0;
    setInterval(() => {
      slides[si].classList.remove("is-active");
      si = (si + 1) % slides.length;
      slides[si].classList.add("is-active");
    }, 4200);
  }

  /* ---------- Poems flip-book ---------- */
  const book = $(".book");
  if (book) {
    const tabs = $$(".book__tab", book);
    const pages = $$(".page", book);
    const prev = $("#pagePrev");
    const next = $("#pageNext");
    const num = $("#pageNum");
    let idx = 0;
    const show = (i) => {
      idx = Math.max(0, Math.min(pages.length - 1, i));
      pages.forEach((p, n) => {
        const active = n === idx;
        p.classList.toggle("is-active", active);
        if (active) p.removeAttribute("hidden");
        else p.setAttribute("hidden", "");
      });
      tabs.forEach((t, n) => {
        const active = n === idx;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
      });
      if (num) num.textContent = String(idx + 1);
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === pages.length - 1;
    };
    tabs.forEach((t, n) => t.addEventListener("click", () => show(n)));
    if (prev) prev.addEventListener("click", () => show(idx - 1));
    if (next) next.addEventListener("click", () => show(idx + 1));
    show(0);
  }

  /* ---------- Community sign-up (client-side) ---------- */
  const communityForm = $("#communityForm");
  if (communityForm) {
    communityForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#communityNote");
      const email = $("#communityEmail").value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        note.textContent = "Please enter a valid email address.";
        note.classList.add("is-error");
        return;
      }
      note.classList.remove("is-error");
      note.textContent = "Welcome to the House of Effervescence ✦ You’re on the list.";
      communityForm.reset();
    });
  }

  /* =========================================================
     BUBBLE CANVAS — the effervescence
     ========================================================= */
  const canvas = $("#fxCanvas");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, bubbles = [], raf, mouse = { x: -9999, y: -9999 };
    const palette = ["255,215,106", "255,147,189", "189,136,255", "92,240,216", "255,125,107"];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.round(Math.min(70, (innerWidth * innerHeight) / 26000));
      bubbles = Array.from({ length: count }, makeBubble);
    };

    function makeBubble(_, i) {
      const r = (Math.random() * 26 + 4) * dpr;
      return {
        x: Math.random() * w,
        y: Math.random() * h + (i !== undefined ? 0 : h),
        r,
        speed: (Math.random() * 0.4 + 0.15) * dpr,
        drift: Math.random() * 0.6 - 0.3,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.35 + 0.1,
        color: palette[(Math.random() * palette.length) | 0],
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const b of bubbles) {
        b.phase += 0.01;
        b.y -= b.speed;
        b.x += Math.sin(b.phase) * b.drift;

        // gentle repulsion from cursor
        const dx = b.x - mouse.x * dpr;
        const dy = b.y - mouse.y * dpr;
        const dist = Math.hypot(dx, dy);
        const reach = 120 * dpr;
        if (dist < reach) {
          const f = (1 - dist / reach) * 1.6;
          b.x += (dx / (dist || 1)) * f;
          b.y += (dy / (dist || 1)) * f;
        }

        if (b.y + b.r < 0) { Object.assign(b, makeBubble()); b.y = h + b.r; }

        const grad = ctx.createRadialGradient(
          b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1,
          b.x, b.y, b.r
        );
        grad.addColorStop(0, `rgba(255,255,255,${b.alpha * 0.9})`);
        grad.addColorStop(0.4, `rgba(${b.color},${b.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${b.color},0)`);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // rim highlight
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.96, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${b.alpha * 0.35})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    window.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else draw();
    });

    resize();
    draw();
  }
})();
