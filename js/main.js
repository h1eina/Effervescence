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

  /* ---------- Vertical scroll chrome ---------- */
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const toTop = $("#toTop");
  let setMenu = () => {};

  const onScrollChrome = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("is-scrolled", y > 12);
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    if (progress) progress.style.width = Math.min(100, (y / max) * 100) + "%";
    if (toTop) toTop.classList.toggle("is-visible", y > window.innerHeight * 0.4);
  };
  window.addEventListener("scroll", onScrollChrome, { passive: true });
  onScrollChrome();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    });
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      const id = href ? href.slice(1) : "";
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      setMenu(false);
    });
  });

  const currentFile = location.pathname.split("/").pop() || "index.html";
  const isHome = currentFile === "index.html" || currentFile === "" || currentFile === "/";
  const navLinks = $$(".nav__links a, #mobileMenu a, .nav__cta");
  const markNav = (matchHref) => {
    navLinks.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const on = matchHref(href);
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  };
  if (!isHome) {
    markNav((href) => {
      const dest = href.split("#")[0];
      return dest === currentFile;
    });
  } else {
    const watched = ["about", "experience", "effervescence", "performances", "comments"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const spy = () => {
      const line = window.scrollY + 140;
      let current = watched[0] ? watched[0].id : "";
      watched.forEach((section) => {
        if (section.offsetTop <= line) current = section.id;
      });
      if (window.scrollY < window.innerHeight * 0.45) current = "";
      markNav((href) => current && (href === "index.html#" + current || href === "#" + current));
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  /* Horizontal deck removed — the site now scrolls vertically. */

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
      "Hello Marie-Paul,\n\nI would like to invite you to speak or feature your work.\n\nOutlet or event: \nDate: \nTopic: \n",
    "Workshop":
      "Hello Marie-Paul,\n\nI would like to enquire about a workshop.\n\nGroup or school: \nAge range: \nNumber of participants: \nPreferred dates: \n",
    "Just Saying Hello":
      "Hello Marie-Paul,\n\nI just wanted to say ",
  };

  const form = $("#contactForm");
  if (form) {
    const reason = $("#cf-subject");
    const messageField = $("#cf-message");

    const setLengthField = $("#setLengthField");
    const setLengthInput = $("#cf-setlength");
    const toggleSetLength = () => {
      const show = reason && reason.value === "Booking / Performance";
      if (setLengthField) setLengthField.classList.toggle("is-on", !!show);
    };

    if (reason && messageField) {
      const applyTemplate = () => {
        const current = messageField.value.trim();
        const isTemplate = Object.values(REASON_TEMPLATES).some((t) => t.trim() === current);
        if (current && !isTemplate) return; // never overwrite something the visitor typed
        messageField.value = REASON_TEMPLATES[reason.value] || "";
        toggleSetLength();
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
      const setLength = setLengthInput && subject === "Booking / Performance"
        ? setLengthInput.value.trim()
        : "";
      const extra = setLength ? `\nLength of set (optional): ${setLength}` : "";
      const body = encodeURIComponent(`${message}${extra}\n\n— ${name} (${email})\nSent from marie-paul.com · ${subject}`);
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

  /* ---------- Guest reflections (no login) ---------- */
  const reflectionForm = $("#reflectionForm");
  const reflectionList = $("#reflectionList");
  const reflectionCount = $("#reflectionCount");
  const reflectionNote = $("#reflectionNote");
  if (reflectionForm && reflectionList) {
    const LIKED_KEY = "mp-liked-reflections";
    const apiRoot = location.hostname.endsWith("github.io")
      ? "https://mariepaul.ca/api/reflections"
      : "/api/reflections";
    const liked = (() => {
      try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || "[]")); }
      catch { return new Set(); }
    })();
    const saveLiked = () => {
      try { localStorage.setItem(LIKED_KEY, JSON.stringify([...liked])); } catch (_) { /* private mode */ }
    };
    const formatWhen = (value) => {
      const d = new Date(/Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    };
    const heartSvg = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.4s-7.2-4.5-9.3-8.4C1.2 9.3 2.4 6 5.7 6c1.9 0 3.1 1.1 3.8 2.2C10.2 7.1 11.4 6 13.3 6c3.3 0 4.5 3.3 3 6-2.1 3.9-9.3 8.4-9.3 8.4z"/></svg>`;
    const setNote = (msg, isError) => {
      if (!reflectionNote) return;
      reflectionNote.textContent = msg || "";
      reflectionNote.classList.toggle("is-error", !!isError);
    };
    const render = (items) => {
      reflectionList.replaceChildren();
      if (reflectionCount) {
        const n = items.length;
        reflectionCount.textContent = n === 0 ? "" : `${n} reflection${n === 1 ? "" : "s"}`;
      }
      if (!items.length) {
        const empty = document.createElement("li");
        empty.className = "reflections__empty";
        empty.textContent = "Be the first to leave a reflection.";
        reflectionList.appendChild(empty);
        return;
      }
      items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "reflection";
        li.dataset.id = String(item.id);
        const meta = document.createElement("div");
        meta.className = "reflection__meta";
        const name = document.createElement("span");
        name.className = "reflection__name";
        name.textContent = item.name || "A reader";
        const time = document.createElement("time");
        time.className = "reflection__time";
        time.dateTime = item.created_at || "";
        time.textContent = formatWhen(item.created_at);
        meta.append(name, time);
        const body = document.createElement("p");
        body.className = "reflection__body";
        body.textContent = item.body || "";
        const likeBtn = document.createElement("button");
        likeBtn.type = "button";
        likeBtn.className = "reflection__like";
        const isOn = liked.has(item.id);
        likeBtn.classList.toggle("is-on", isOn);
        likeBtn.setAttribute("aria-pressed", isOn ? "true" : "false");
        likeBtn.setAttribute("aria-label", isOn ? "Remove like" : "Like this reflection");
        const count = document.createElement("span");
        count.textContent = String(item.likes || 0);
        likeBtn.innerHTML = heartSvg;
        likeBtn.appendChild(count);
        likeBtn.addEventListener("click", async () => {
          const turningOff = liked.has(item.id);
          likeBtn.disabled = true;
          try {
            const res = await fetch(`${apiRoot}/${item.id}/like`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: turningOff ? "unlike" : "like" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not like that just now.");
            item.likes = data.likes;
            count.textContent = String(data.likes);
            if (turningOff) liked.delete(item.id);
            else liked.add(item.id);
            saveLiked();
            const on = liked.has(item.id);
            likeBtn.classList.toggle("is-on", on);
            likeBtn.setAttribute("aria-pressed", on ? "true" : "false");
            likeBtn.setAttribute("aria-label", on ? "Remove like" : "Like this reflection");
          } catch (err) {
            setNote(err.message || "Could not like that just now.", true);
          } finally {
            likeBtn.disabled = false;
          }
        });
        li.append(meta, body, likeBtn);
        reflectionList.appendChild(li);
      });
    };
    const load = async () => {
      try {
        const res = await fetch(apiRoot);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load reflections.");
        render(data.reflections || []);
      } catch {
        reflectionList.replaceChildren();
        const err = document.createElement("li");
        err.className = "reflections__error";
        err.textContent = "Reflections will appear here once this page is live.";
        reflectionList.appendChild(err);
      }
    };
    reflectionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("#rf-name")?.value || "";
      const body = $("#rf-body")?.value || "";
      const website = reflectionForm.querySelector("[name=website]")?.value || "";
      const btn = reflectionForm.querySelector("button[type=submit]");
      setNote("");
      if (body.trim().length < 2) {
        setNote("A reflection needs a few words.", true);
        return;
      }
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(apiRoot, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, body, website }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not share that just now.");
        reflectionForm.reset();
        setNote("Thank you!");
        await load();
      } catch (err) {
        setNote(err.message || "Could not share that just now.", true);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
    load();
  }

  /* ---------- Share a production / page ---------- */
  $$("[data-share]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const payload = {
        title: btn.dataset.shareTitle || document.title,
        text: btn.dataset.shareText || "Effervescence — a poetry and arts movement by Marie-Paul.",
        url: btn.dataset.shareUrl || location.href,
      };
      try {
        if (navigator.share) {
          await navigator.share(payload);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(payload.url);
          btn.textContent = "Link copied";
        }
      } catch (_) { /* visitor cancelled */ }
    });
  });

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
      note.textContent = "You’re subscribed to Marie-Paul’s Newsletter ✦";
      communityForm.reset();
    });
  }
})();
