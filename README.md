# intern.brandmakingtractor.com

**LEARN • CREATE • GROW**

The internship program website for Brand Making Tractor. Every internship runs on the same structure — **1 Week Training + 3 Weeks Live Client Project** — across 7 tracks: Data Analyst, Performance Marketing, Website Development (Custom Coded), Graphic Designing, Content Creation, WordPress Website Development, and Video Editing.

> Note: "We Build Brands That Grow" is the **parent company's** tagline and is never used as the internship brand's tagline. This site's tagline is always **LEARN • CREATE • GROW**.

## Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (no framework, no build step)
- **Backend:** a Supabase Edge Function (`assets/js/config.js` → `SUPABASE_FUNCTION_URL`). Its source is not part of this repository — it lives in the linked Supabase project.
- **Database:** Supabase (Postgres)
- **Transactional email:** Resend

> **Legacy code notice:** the `apps-script/` folder and `docs/SETUP_GUIDE.md` describe an **earlier** Google Apps Script + Google Sheets backend that has since been replaced by the Supabase Edge Function above. They are kept only for historical reference and are **not used in production** — do not follow `docs/SETUP_GUIDE.md` to deploy this site. See `apps-script/README-LEGACY.md`.

## Project structure

```
index.html                   Home
internships.html              All 7 internship openings (filterable)
internship-detail.html         Single internship detail (?id=INT-XX-001)
apply.html                     Application form (?id=INT-XX-001 to preselect)
about.html                     About Us
contact.html                   Contact Us
verify-certificate.html        Public certificate verification
certificate-request.html       Intern-facing certificate request
manager-login.html             Manager login
manager-dashboard.html         Manager dashboard (certificate approvals, applications, openings)

assets/css/style.css           Full design system (brand colors, components)
assets/js/config.js            Brand info + static internship catalogue + Apps Script URL
assets/js/main.js              Shared header/footer, API helper, UI utilities
assets/img/logo.svg            Logo (recreated in code from the supplied artwork)

apps-script/                   LEGACY — superseded Google Apps Script backend, kept for reference only
docs/SETUP_GUIDE.md            LEGACY — describes the old Apps Script deployment, not the live Supabase backend
```

## Getting started

1. **Backend:** the live backend is an external Supabase Edge Function. To point this frontend at your own instance, set `SUPABASE_FUNCTION_URL` and `SUPABASE_ANON_KEY` in `assets/js/config.js` (the anon key is a public/publishable key — safe to expose client-side — never put a Supabase **service-role** key here).
2. **Email:** transactional emails (application confirmation, certificate, etc.) are sent by that same Edge Function via Resend — configure the Resend API key and verified sending domain there, not in this repo.
3. Open `index.html` in a browser (or run `python dev-server.py` for clean URLs locally), or host the folder on any static host — the whole frontend is ready.

## Core message

> 1 Week Training. 3 Weeks Live Client Project. Real Experience. Real Work. Learn • Create • Grow.
