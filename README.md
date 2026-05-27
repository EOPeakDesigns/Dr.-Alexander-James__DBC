# Dr. Alexander James — Digital Business Card

Premium, mobile-first **PWA digital business card** for business development consultants. Built with vanilla **HTML, CSS, and JavaScript** (no frameworks, no build step). Bilingual **English / Arabic**, installable, offline-capable, and ready for **GitHub + Vercel**.

---

## Live demo checklist

After deploy, confirm on your production URL (HTTPS required for PWA):

| Check | How |
|--------|-----|
| Page loads | Open `/` |
| Card data | Contact rows and social icons populate |
| Share / vCard | Share button and “Save contact” download `.vcf` |
| QR modal | Opens, download works |
| Theme & language | Light / dark / auto + EN ↔ AR |
| Install prompt | Chrome/Android: “Add to Home Screen” (not in private mode) |
| Offline | Reload once online, then toggle airplane mode and refresh |

---

## Tech stack

- **Static site** — served as-is from repository root
- **Data-driven** — `data/card.json` is the single source of truth
- **PWA** — `manifest.webmanifest` + `sw.js` (cache `digital-card-v6`)
- **i18n** — EN / AR copy, RTL layout for Arabic contact rows
- **a11y** — skip link, ARIA on modals, keyboard (Escape closes modals)

---

## Project structure

```text
├── index.html              # Shell, modals, install banner
├── style.css               # Mobile-first layout, themes, RTL
├── script.js               # ES module logic (type="module")
├── sw.js                   # Service worker (offline shell)
├── manifest.webmanifest    # PWA manifest
├── vercel.json             # Vercel headers & static config
├── data/
│   └── card.json           # Profile, contact, labels, assets paths
└── assets/
    ├── favicon.svg
    ├── favicon-16x16.png / favicon-32x32.png
    ├── favicon-192x192.png / favicon-512x512.png
    ├── apple-touch-icon.png
    ├── Inversment_icon.png
    ├── MYQR.png
    └── owner.png           # Optional — add your headshot here
```

---

## Customize content

Edit **`data/card.json`** only (no need to touch HTML for copy):

1. **Profile** — `profile.name`, `profile.i18n.en` / `profile.i18n.ar`
2. **Contact** — phone, email, website, address, maps, WhatsApp
3. **Socials** — array of `{ name, url }`
4. **Assets** — `assets.avatar`, `assets.qr`, paths under `/assets`
5. **Video modal** — `featureVideo.src` (YouTube embed URL)
6. **Share fallback** — `shareFallbackUrl` for local `file://` previews only; leave `""` on Vercel (live URL is detected automatically)

Replace placeholder phone, email, and video URL before going live.

### Recommended asset updates

- Add **`assets/owner.png`** (square, ≥400×400) for the profile photo
- Replace **`assets/MYQR.png`** after deploy: set `shareFallbackUrl` in `data/card.json` to your live Vercel URL, then run `npm run build:brand`
- Brand mark source files: `assets/brand-mark.svg` (master), `assets/favicon.svg` (small-size optimized), `assets/brand-mark-qr.svg` (QR center with white safe zone)

---

## Local preview

> ES modules and the service worker require **HTTP**, not `file://`.

**Option A — VS Code / Cursor:** Live Server extension → open project folder → “Go Live”.

**Option B — Node (one-off):**

```bash
npx --yes serve .
```

Then open `http://localhost:3000` (or the port shown).

---

## Deploy to GitHub

```bash
cd design__3
git init
git add .
git commit -m "Initial commit: digital business card PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Use `.gitignore` as committed — it excludes `.vercel/` and local design exports in `business card/`.

---

## Deploy to Vercel

1. Sign in at [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Framework preset: **Other**
4. **Build command:** leave empty  
5. **Output directory:** `.` (root)  
6. Deploy

`vercel.json` already configures:

- Static output from repo root (no build)
- Service worker cache headers + `Service-Worker-Allowed: /`
- Manifest `Content-Type` and security headers

### Custom domain

Vercel → Project → **Settings → Domains** → add your domain. HTTPS is automatic.

After first deploy, optional: set `shareFallbackUrl` in `card.json` to your production URL if you share vCard/links from a local copy.

---

## Environment notes

| Topic | Detail |
|--------|--------|
| HTTPS | Required for service worker, install prompt, and secure context APIs |
| Cache updates | Bump `CACHE_NAME` in `sw.js` when you ship asset changes |
| OG / Twitter cards | `script.js` sets absolute `og:image` and `og:url` on HTTPS |
| iOS | Add to Home Screen via Safari share sheet; uses `apple-touch-icon` |

---

## Browser support

Chrome, Edge, Firefox, Safari 15+ (mobile and desktop). PWA install is strongest on Chromium Android and desktop Chrome.

---

## License

Content and branding are for the card owner. Use and redistribute according to your client agreement.

---

**Repository description (≤150 characters, for GitHub / Vercel):**

