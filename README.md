# Live Your Effervescence

The official website for **Live Your Effervescence** — the poetry & art movement of
award-winning poet **Marie-Paul Duwai-Sowa**, promoting *authenticity, self-love, and
self-expression through poetry and art*.

An immersive, "otherworldly" single-page experience built with vanilla HTML, CSS, and
JavaScript — no build step, no dependencies. Just open it and let it rise. ✦

---

## ✨ Highlights

- **Effervescent bubble canvas** — a live, cursor-reactive particle field rendered on `<canvas>`.
- **The Visual Poetry Experience** — the full award-winning poem *Effervescence* reveals itself
  line by line as you scroll (a scroll-driven "visual reading").
- **Manifesto** built around the three brand pillars: Authenticity · Self-Love · Self-Expression.
- **Marie-Paul's story** — bio, credentials, and roles.
- **Productions** — The Visual Poetry Experience, Black is Beautiful, Afrovescence,
  Harnessing Your Child's Special Talent, and the HPL first reading.
- **Connect** — email, Instagram, Linktree, and a contact form (opens the visitor's mail app).
- Champagne-gold / rose / iris palette on a midnight-aubergine cosmos, with an animated aurora,
  shimmering gradient type, magnetic buttons, a custom cursor, scroll progress, and a preloader.
- **Accessible & fast**: semantic HTML, skip link, keyboard support, `prefers-reduced-motion`
  fallbacks, focus states, SEO meta, Open Graph tags, and JSON-LD structured data.

## 📁 Structure

```
Effervescence/
├── index.html          # Markup + SEO/OG/structured data
├── css/styles.css      # Design system + all styles (responsive, a11y)
├── js/main.js          # Bubble canvas, scroll reveals, poem, UI
├── assets/
│   ├── favicon.svg     # Brand mark
│   └── og-image.svg    # Social share card
└── README.md
```

## 🚀 Run it

No build required. Either open `index.html` directly, or serve locally:

```bash
python3 -m http.server 5173
# then visit http://localhost:5173
```

## 🛠 Make it yours

- **Email**: the contact form and links use a placeholder — `liveyoureffervescence@gmail.com`.
  Search/replace it in `index.html` and `js/main.js` with the real inbox.
- **Photos**: the About section uses a styled "MP" monogram frame as a placeholder. Drop
  Marie-Paul's real portrait in `assets/` and swap `.portrait__frame` for an `<img>`.
- **Production links**: cards now point to the real destinations pulled from her Linktree —
  YouTube films (The Visual Poetry Experience, The First Official Reading, Harnessing Your
  Child's Special Talent), the *Black is Beautiful* collection on Issuu, and the HPL poem PDF.
  Video links open in an in-page lightbox.
- **Contact form**: it currently opens the visitor's email client (`mailto:`). To collect
  submissions server-side, wire the form to a service like Formspree, Netlify Forms, or your own
  endpoint.

## 🎨 Palette

| Token        | Hex       | Use                     |
|--------------|-----------|-------------------------|
| Midnight ink | `#0d0616` | Base background         |
| Aubergine    | `#160a24` | Gradient midtone        |
| Champagne    | `#f3d38a` | Primary gold accent     |
| Rose         | `#ed9db4` | Secondary accent        |
| Iris         | `#a68bff` | Tertiary accent         |
| Cream        | `#f7f1ea` | Body text               |

---

*Effervescence — a captured essence, unbottled. Built for Marie-Paul Duwai-Sowa.*
