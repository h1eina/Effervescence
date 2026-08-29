/* =========================================================
   LIVE YOUR EFFERVESCENCE — interactions
   Scroll reveals · poem experience · UI
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  /* ---------- Year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Horizontal page deck (transform, exactly one page per gesture) ---------- */
  const deck = $("#deck");
  const track = $("#deckTrack");
  const panels = $$(".panel", track || deck || document);
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  const deckPrev = $("#deckPrev");
  const deckNext = $("#deckNext");
  const deckDots = $("#deckDots");
  let pageIndex = 0;
  let isAnimating = false;
  let animTimer = 0;
  let gestureLocked = false;
  let gestureIdleTimer = 0;
  let setMenu = () => {};

  const clampIndex = (i) => Math.max(0, Math.min(panels.length - 1, i));
  const ANIM_MS = prefersReduced ? 0 : 780;
  // Ignore leftover trackpad inertia after a page change until the gesture goes quiet
  const GESTURE_IDLE_MS = 420;
  const WHEEL_THRESHOLD = 28;
  // After you reach the end of a page, a little extra intent turns it
  const FLOW_EDGE_THRESHOLD = 72;
  const isSnap = (p) => !p || p.classList.contains("hero");

  const updateDeckUI = () => {
    if (!panels.length) return;
    if (nav) nav.classList.add("is-scrolled");
    if (progress) progress.style.width = ((pageIndex / Math.max(panels.length - 1, 1)) * 100) + "%";
    if (toTop) toTop.classList.toggle("is-visible", pageIndex > 0);
    if (deckPrev) deckPrev.disabled = pageIndex <= 0;
    if (deckNext) deckNext.disabled = pageIndex >= panels.length - 1;
    if (deckDots) {
      $$("button", deckDots).forEach((b, n) => {
        b.classList.toggle("is-active", n === pageIndex);
        b.setAttribute("aria-current", n === pageIndex ? "true" : "false");
      });
    }
    const id = panels[pageIndex] && panels[pageIndex].id;
    $$(".nav__links a, .nav__cta, .footer__nav a").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  };

  const applyTransform = (instant) => {
    const x = -(pageIndex * deck.clientWidth);
    if (instant || prefersReduced) {
      deck.classList.add("is-instant");
      track.style.transform = "translate3d(" + x + "px, 0, 0)";
      void track.offsetHeight;
      deck.classList.remove("is-instant");
      isAnimating = false;
    } else {
      isAnimating = true;
      track.style.transform = "translate3d(" + x + "px, 0, 0)";
      window.clearTimeout(animTimer);
      animTimer = window.setTimeout(() => { isAnimating = false; }, ANIM_MS);
    }
  };

  const updateFlowHint = (panel) => {
    if (!panel || isSnap(panel)) {
      panel && panel.classList.remove("has-more");
      return;
    }
    const more = panel.scrollHeight > panel.clientHeight + 8 &&
      panel.scrollTop + panel.clientHeight < panel.scrollHeight - 10;
    panel.classList.toggle("has-more", more);
  };

  const panelCanScroll = (panel, dy) => {
    if (!panel || isSnap(panel)) return false;
    if (panel.scrollHeight <= panel.clientHeight + 2) return false;
    const atTop = panel.scrollTop <= 2;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
    if (dy > 0 && !atBottom) return true;
    if (dy < 0 && !atTop) return true;
    return false;
  };

  const goToPage = (i, instant, opts) => {
    if (!track || !panels.length) return;
    const next = clampIndex(i);
    const align = opts && opts.align;
    if (next === pageIndex && !instant && !align) return;

    const changed = next !== pageIndex;
    pageIndex = next;
    const panel = panels[pageIndex];
    if (changed) {
      if (!isSnap(panel) && align === "end") {
        panel.scrollTo({ top: panel.scrollHeight, behavior: "auto" });
      } else {
        panel.scrollTo({ top: 0, behavior: "auto" });
      }
    }
    applyTransform(instant);
    updateDeckUI();
    updateFlowHint(panel);
    // Keep the home URL clean — no #hero on first load or when returning home
    if (panel.id === "hero") {
      history.replaceState(null, "", location.pathname + location.search);
    } else if (panel.id) {
      history.replaceState(null, "", "#" + panel.id);
    }
  };

  const lockGesture = () => {
    gestureLocked = true;
    window.clearTimeout(gestureIdleTimer);
    gestureIdleTimer = window.setTimeout(() => {
      gestureLocked = false;
    }, GESTURE_IDLE_MS);
  };

  const bumpGestureIdle = () => {
    if (!gestureLocked) return;
    window.clearTimeout(gestureIdleTimer);
    gestureIdleTimer = window.setTimeout(() => {
      gestureLocked = false;
    }, GESTURE_IDLE_MS);
  };

  const goNext = () => {
    if (isAnimating || pageIndex >= panels.length - 1) return;
    lockGesture();
    goToPage(pageIndex + 1);
  };
  const goPrev = () => {
    if (isAnimating || pageIndex <= 0) return;
    lockGesture();
    goToPage(pageIndex - 1, false, { align: "end" });
  };

  if (deck && track && panels.length) {
    if (deckDots) {
      deckDots.innerHTML = "";
      panels.forEach((p, n) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute(
          "aria-label",
          "Go to " + (p.getAttribute("aria-label") || p.id || ("page " + (n + 1)))
        );
        btn.addEventListener("click", () => {
          if (isAnimating) return;
          lockGesture();
          goToPage(n);
        });
        deckDots.appendChild(btn);
      });
    }

    if (deckPrev) deckPrev.addEventListener("click", goPrev);
    if (deckNext) deckNext.addEventListener("click", goNext);
    if (toTop) toTop.addEventListener("click", () => {
      if (isAnimating) return;
      lockGesture();
      goToPage(0);
    });

    // Wheel / trackpad: scroll the page first; at an edge, a little more turns it
    let accumX = 0;
    let accumY = 0;

    const canScrollFurther = (el, dy) => {
      let node = el;
      while (node && node !== deck) {
        if (node instanceof HTMLElement) {
          const style = window.getComputedStyle(node);
          const oy = style.overflowY;
          if ((oy === "auto" || oy === "scroll" || oy === "overlay") &&
              node.scrollHeight > node.clientHeight + 2) {
            const atTop = node.scrollTop <= 1;
            const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 2;
            if ((dy > 0 && !atBottom) || (dy < 0 && !atTop)) return true;
          }
        }
        node = node.parentElement;
      }
      return false;
    };

    const onWheel = (e) => {
      const panel = panels[pageIndex];
      if (!panel) return;

      const dx = e.deltaX;
      const dy = e.deltaY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // While locked (animation or leftover inertia), kill native motion
      // and keep the lock alive until the gesture goes quiet
      if (gestureLocked || isAnimating) {
        e.preventDefault();
        bumpGestureIdle();
        accumX = 0;
        accumY = 0;
        return;
      }

      // Content pages: let the page scroll until it reaches an edge
      if (!isSnap(panel) && absY >= absX &&
          (canScrollFurther(e.target, dy) || panelCanScroll(panel, dy))) {
        accumX = 0;
        accumY = 0;
        window.requestAnimationFrame(() => updateFlowHint(panel));
        return;
      }

      // Page change — never let the browser scroll the deck
      e.preventDefault();

      // Normalize delta across pixel / line / page modes (mouse wheels vs trackpads)
      let scale = 1;
      if (e.deltaMode === 1) scale = 16;
      else if (e.deltaMode === 2) scale = deck.clientHeight;

      const need = isSnap(panel) || absX > absY ? WHEEL_THRESHOLD : FLOW_EDGE_THRESHOLD;

      // Prefer the dominant axis so diagonal flicks don't double-fire
      if (absX > absY) {
        accumX += dx * scale;
        accumY = 0;
        if (Math.abs(accumX) < need) return;
        const dir = accumX > 0 ? 1 : -1;
        accumX = 0;
        if (dir > 0) goNext();
        else goPrev();
      } else {
        accumY += dy * scale;
        accumX = 0;
        if (Math.abs(accumY) < need) return;
        const dir = accumY > 0 ? 1 : -1;
        accumY = 0;
        if (dir > 0) goNext();
        else goPrev();
      }
    };

    deck.addEventListener("wheel", onWheel, { passive: false });

    panels.forEach((p) => {
      if (isSnap(p)) return;
      p.addEventListener("scroll", () => {
        if (p === panels[pageIndex]) updateFlowHint(p);
      }, { passive: true });
    });

    // Touch: vertical swipe scrolls a page, then turns it at the edge; sideways always pages
    let touchX = 0;
    let touchY = 0;
    let touching = false;
    deck.addEventListener("touchstart", (e) => {
      if (!e.touches[0]) return;
      touching = true;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener("touchend", (e) => {
      if (!touching || !e.changedTouches[0]) return;
      touching = false;
      if (isAnimating || gestureLocked) return;
      const panel = panels[pageIndex];
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) goNext();
        else goPrev();
        return;
      }
      if (Math.abs(dy) < 80) return;
      // Finger up (dy < 0) is a downward read; only page if the page is done
      const scrollDir = dy < 0 ? 1 : -1;
      if (!isSnap(panel) && panelCanScroll(panel, scrollDir)) return;
      if (dy < 0) goNext();
      else goPrev();
    }, { passive: true });

    const scrollPanelOrPage = (dir) => {
      const panel = panels[pageIndex];
      if (!isSnap(panel) && panelCanScroll(panel, dir)) {
        panel.scrollBy({
          top: Math.round(panel.clientHeight * 0.72) * dir,
          behavior: prefersReduced ? "auto" : "smooth",
        });
        return;
      }
      if (dir > 0) goNext();
      else goPrev();
    };

    document.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); scrollPanelOrPage(1); }
      if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); scrollPanelOrPage(-1); }
      if (e.key === "Home") { e.preventDefault(); lockGesture(); goToPage(0); }
      if (e.key === "End") { e.preventDefault(); lockGesture(); goToPage(panels.length - 1); }
    });

    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href").slice(1);
        if (!id) return;
        const idx = panels.findIndex((p) => p.id === id);
        if (idx >= 0) {
          e.preventDefault();
          if (!isAnimating) {
            lockGesture();
            goToPage(idx);
          }
          setMenu(false);
        }
      });
    });

    const hashId = (location.hash || "").replace(/^#/, "");
    const startIdx = hashId ? panels.findIndex((p) => p.id === hashId) : 0;
    goToPage(startIdx >= 0 ? startIdx : 0, true);
    window.addEventListener("resize", () => {
      applyTransform(true);
      updateDeckUI();
      updateFlowHint(panels[pageIndex]);
    });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $("#navToggle");
  const menu = $("#mobileMenu");
  setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
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
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Poem: line-by-line illumination ---------- */
  const poemLines = $$(".stanza .pl");
  const poemPanel = $("#poem");
  if (poemLines.length) {
    if ("IntersectionObserver" in window && !prefersReduced) {
      const pio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("is-lit"); pio.unobserve(entry.target); }
        });
      }, { root: poemPanel || null, threshold: 0.55, rootMargin: "0px 0px -10% 0px" });
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
  const CONTACT_EMAIL = "mariepaul.poet@gmail.com";

  // Each reason pre-fills its own prompt so the message arrives with the details
  // Marie-Paul needs to reply straight away.
  const REASON_TEMPLATES = {
    "Booking / Performance":
      "Hello Marie-Paul,\n\nI would love to book you for a performance.\n\nEvent: \nDate: \nLocation: \nAudience: \nLength of set: \n",
    "Collaboration / Publication":
      "Hello Marie-Paul,\n\nI have a collaboration in mind and would love to work with you.\n\nProject: \nMy role / organisation: \nTimeline: \n",
    "Press / Speaking Engagement":
      "Hello Marie-Paul,\n\nI would like to invite you to speak or feature your work.\n\nOutlet or event: \nDate: \nTopic: \nDeadline: \n",
    "Workshop":
      "Hello Marie-Paul,\n\nI would like to enquire about a workshop.\n\nGroup or school: \nAge range: \nNumber of participants: \nPreferred dates: \n",
    "Just Saying Hello":
      "Hello Marie-Paul,\n\nI just wanted to say ",
  };

  const form = $("#contactForm");
  if (form) {
    const reason = $("#cf-subject");
    const messageField = $("#cf-message");

    if (reason && messageField) {
      const applyTemplate = () => {
        const current = messageField.value.trim();
        const isTemplate = Object.values(REASON_TEMPLATES).some((t) => t.trim() === current);
        if (current && !isTemplate) return; // never overwrite something the visitor typed
        messageField.value = REASON_TEMPLATES[reason.value] || "";
      };
      applyTemplate();
      reason.addEventListener("change", applyTemplate);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = $("#formNote");
      const name = $("#cf-name").value.trim();
      const email = $("#cf-email").value.trim();
      const subject = reason ? reason.value : "Enquiry";
      const message = messageField.value.trim();
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name || !validEmail || !message) {
        note.textContent = "Please add your name, a valid email, and a message.";
        note.classList.add("is-error");
        return;
      }
      note.classList.remove("is-error");
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})\nSent from marie-paul.com · ${subject}`);
      const mailSubject = encodeURIComponent(`${subject} — ${name}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${body}`;
      note.textContent = "Opening your email app… thank you for reaching out ✦";
      form.reset();
      if (reason && messageField) messageField.value = REASON_TEMPLATES[reason.value] || "";
    });
  }

  /* ---------- Magazine spread viewer ---------- */
  const mag = $("#mag");
  if (mag) {
    const magClose = $("#magClose");
    const magCover = $("#magCover");
    const magMeta = $("#magMeta");
    const magTitle = $("#magTitle");
    const magDesc = $("#magDesc");
    const magCta = $("#magCta");
    let magReturnFocus = null;

    const openMag = (el) => {
      magReturnFocus = el;
      magCover.src = el.dataset.spreadCover || "";
      magCover.alt = el.dataset.spreadTitle ? el.dataset.spreadTitle + " — cover" : "";
      magMeta.textContent = el.dataset.spreadMeta || "";
      magTitle.textContent = el.dataset.spreadTitle || "";
      magDesc.textContent = el.dataset.spreadDesc || "";
      magCta.href = el.dataset.spreadHref || "#";
      magCta.textContent = el.dataset.spreadCta || "Read the full spread";
      mag.classList.add("is-open");
      mag.setAttribute("aria-hidden", "false");
      magClose.focus();
    };
    const closeMag = () => {
      mag.classList.remove("is-open");
      mag.setAttribute("aria-hidden", "true");
      if (magReturnFocus) magReturnFocus.focus();
    };

    $$("[data-spread-title]").forEach((el) => el.addEventListener("click", () => openMag(el)));
    magClose.addEventListener("click", closeMag);
    mag.addEventListener("click", (e) => { if (e.target === mag) closeMag(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mag.classList.contains("is-open")) closeMag();
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
    lbClose.focus();
  };
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lbFrame.innerHTML = "";
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
      note.textContent = "You’re subscribed to Marie-Paul’s Musings ✦";
      communityForm.reset();
    });
  }
})();
