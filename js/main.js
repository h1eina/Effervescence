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
    let giscusReady = false;
    const showFallback = () => {
      if (giscusReady) return;
      comments.classList.add("is-fallback");
      commentsFallback.hidden = false;
    };
    const hideFallback = () => {
      giscusReady = true;
      comments.classList.remove("is-fallback");
      commentsFallback.hidden = true;
    };
    window.addEventListener("message", (e) => {
      if (e.origin !== "https://giscus.app") return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data || !data.giscus) return;
        if (data.giscus.error) showFallback();
        // Successful resize / load messages mean the widget is alive.
        if (data.giscus.resizeHeight || data.giscus.discussion) hideFallback();
      } catch (_) { /* ignore */ }
    });
    // Only fall back if the iframe never appears and an error string is present.
    setTimeout(() => {
      const frame = giscusMount.querySelector("iframe");
      if (frame) { hideFallback(); return; }
      const errored = /giscus is not installed|An error occurred/i.test(giscusMount.textContent || "");
      if (errored) showFallback();
    }, 5000);
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
     BUTTERFLY CANVAS — slow fluttering wings
     ========================================================= */
  const canvas = $("#fxCanvas");
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, butterflies = [], raf, mouse = { x: -9999, y: -9999 };
    const palette = [
      ["255,215,106", "255,147,189"],
      ["255,147,189", "189,136,255"],
      ["189,136,255", "92,240,216"],
      ["255,125,107", "255,215,106"],
      ["92,240,216", "255,147,189"],
    ];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      const count = Math.round(Math.min(18, Math.max(8, (innerWidth * innerHeight) / 90000)));
      butterflies = Array.from({ length: count }, makeButterfly);
    };

    function makeButterfly() {
      const scale = (Math.random() * 0.55 + 0.45) * dpr;
      const colors = palette[(Math.random() * palette.length) | 0];
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        scale,
        // Slow drift — mostly rising with a soft lateral wander
        vx: (Math.random() * 0.25 - 0.12) * dpr,
        vy: -(Math.random() * 0.18 + 0.08) * dpr,
        flap: Math.random() * Math.PI * 2,
        flapSpeed: 0.04 + Math.random() * 0.03, // slow flutter
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.008 + Math.random() * 0.01,
        angle: (Math.random() * 0.5 - 0.25),
        alpha: 0.28 + Math.random() * 0.35,
        colors,
      };
    }

    function drawButterfly(b) {
      const wingOpen = 0.35 + Math.abs(Math.sin(b.flap)) * 0.65; // 0.35–1.0
      const s = b.scale * 14;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle + Math.sin(b.wobble) * 0.18);
      ctx.globalAlpha = b.alpha;

      // Soft glow behind the butterfly
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.2);
      glow.addColorStop(0, `rgba(${b.colors[0]},0.22)`);
      glow.addColorStop(1, `rgba(${b.colors[1]},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, s * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = `rgba(255,246,239,0.85)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.12, s * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      // Antennae
      ctx.strokeStyle = `rgba(255,246,239,0.55)`;
      ctx.lineWidth = Math.max(1, s * 0.06);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.55);
      ctx.quadraticCurveTo(-s * 0.15, -s * 1.05, -s * 0.35, -s * 1.15);
      ctx.moveTo(0, -s * 0.55);
      ctx.quadraticCurveTo(s * 0.15, -s * 1.05, s * 0.35, -s * 1.15);
      ctx.stroke();

      const drawWingPair = (side) => {
        ctx.save();
        ctx.scale(side * wingOpen, 1);

        // Upper wing
        const ug = ctx.createLinearGradient(0, -s, s * 1.4, s * 0.2);
        ug.addColorStop(0, `rgba(${b.colors[0]},0.85)`);
        ug.addColorStop(1, `rgba(${b.colors[1]},0.55)`);
        ctx.fillStyle = ug;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.1);
        ctx.bezierCurveTo(s * 0.3, -s * 1.15, s * 1.35, -s * 1.05, s * 1.25, -s * 0.15);
        ctx.bezierCurveTo(s * 1.05, s * 0.15, s * 0.35, s * 0.2, 0, s * 0.05);
        ctx.closePath();
        ctx.fill();

        // Lower wing
        const lg = ctx.createLinearGradient(0, 0, s * 1.1, s);
        lg.addColorStop(0, `rgba(${b.colors[1]},0.75)`);
        lg.addColorStop(1, `rgba(${b.colors[0]},0.4)`);
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.05);
        ctx.bezierCurveTo(s * 0.35, s * 0.15, s * 1.05, s * 0.35, s * 0.95, s * 0.85);
        ctx.bezierCurveTo(s * 0.55, s * 1.15, s * 0.15, s * 0.7, 0, s * 0.35);
        ctx.closePath();
        ctx.fill();

        // Delicate wing veins
        ctx.strokeStyle = `rgba(255,255,255,0.28)`;
        ctx.lineWidth = Math.max(0.6, s * 0.04);
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.05);
        ctx.quadraticCurveTo(s * 0.55, -s * 0.55, s * 1.05, -s * 0.35);
        ctx.moveTo(0, s * 0.15);
        ctx.quadraticCurveTo(s * 0.45, s * 0.45, s * 0.8, s * 0.75);
        ctx.stroke();

        ctx.restore();
      };

      drawWingPair(1);
      drawWingPair(-1);

      ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const b of butterflies) {
        b.flap += b.flapSpeed;
        b.wobble += b.wobbleSpeed;
        b.x += b.vx + Math.sin(b.wobble) * 0.35 * dpr;
        b.y += b.vy + Math.cos(b.wobble * 0.7) * 0.2 * dpr;
        b.angle += Math.sin(b.wobble) * 0.002;

        // Gentle cursor avoidance
        const dx = b.x - mouse.x * dpr;
        const dy = b.y - mouse.y * dpr;
        const dist = Math.hypot(dx, dy);
        const reach = 140 * dpr;
        if (dist < reach && dist > 0.001) {
          const f = (1 - dist / reach) * 1.1;
          b.x += (dx / dist) * f;
          b.y += (dy / dist) * f;
        }

        // Wrap softly around the viewport
        if (b.y < -40 * dpr) { b.y = h + 30 * dpr; b.x = Math.random() * w; }
        if (b.y > h + 40 * dpr) { b.y = -30 * dpr; b.x = Math.random() * w; }
        if (b.x < -40 * dpr) b.x = w + 30 * dpr;
        if (b.x > w + 40 * dpr) b.x = -30 * dpr;

        drawButterfly(b);
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
