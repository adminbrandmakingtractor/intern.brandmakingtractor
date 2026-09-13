# intern.brandmakingtractor.com — Setup & Deployment Guide

> ⚠️ **LEGACY DOCUMENT — describes a superseded backend, not the live one.**
> The site now runs on a **Supabase Edge Function** (see `assets/js/config.js` →
> `SUPABASE_FUNCTION_URL`), not the Google Apps Script + Google Sheets backend
> described below. This guide is kept for historical reference only — following
> it will not deploy anything the live frontend actually talks to. See
> `apps-script/README-LEGACY.md`.

Stack (as originally built, no longer live): **HTML / CSS / Vanilla JS** frontend → **Google Apps Script** API → **Google Sheets** database.

```
HTML/CSS/JS  →  Google Apps Script (Web App)  →  Google Sheets
                          ↓
                       MailApp → Intern Email
```

---

## 1. Create the Google Sheet database

1. Go to [sheets.google.com](https://sheets.google.com) → create a new blank spreadsheet.
2. Name it, e.g. **"intern.brandmakingtractor.com — Database"**.
3. Open **Extensions → Apps Script**. This opens the bound script editor for that sheet.

## 2. Add the backend code

1. In the Apps Script editor, delete the default empty `Code.gs`.
2. For every file in the `/apps-script` folder of this project, create a matching script file (**File → New → Script file**, name it exactly the same, e.g. `Config`, `Utils`, `Setup`, `Code`, `Applications`, `Coupons`, `Certificates`, `CertificatePdf`, `Managers`, `Contact`, `Email`) and paste in its contents.
3. Open **Project Settings** (gear icon) → check "Show `appsscript.json` manifest file in editor" → replace its contents with `apps-script/appsscript.json` from this project.

## 3. Run the one-time setup

1. In the Apps Script editor, open `Setup.gs`.
2. In the function dropdown (top toolbar), select **`setupSheets`**.
3. Click **Run**. The first run will ask you to authorize the script (choose your Google account → "Advanced" → "Go to project (unsafe)" → Allow). This is expected for any Apps Script project you own.
4. Check your spreadsheet — you should now see 6 tabs: `Internship_Openings`, `Applications`, `Certificates`, `Coupons`, `Managers`, `Contact_Queries`, with the 7 internships and 3 starter coupons (`BMT10`, `BMT20`, `BMT30`) pre-seeded.
5. Open the **Managers** tab — a default manager login was created:
   - Email: `manager@brandmakingtractor.com`
   - Password: `Manager@123`
   - **Change this password** by adding a new manager row with a fresh password hash, or ask the AI/developer to add a "change password" flow if you need one — for now, edit the `Password_Hash` cell using the `hashPassword_("your-new-password")` function run once from the script editor's execution log.

## 4. Configure the site URL and team email

Open `Config.gs` and set:

```js
const SITE_BASE_URL = "https://your-actual-domain-or-hosting-url/";
const TEAM_EMAIL = "internships@brandmakingtractor.com"; // where payment-proof emails go
```

`SITE_BASE_URL` builds the QR code + verification link embedded in the certificate PDF and email (left as the placeholder, links fall back to relative paths). `TEAM_EMAIL` is where new-application notifications are sent, and what applicants are told to send their payment screenshot to — **keep it in sync with `assets/js/config.js` → `BRAND.teamEmail`**, since that's what's shown on-screen after submission.

Also review the authoritative fee table — this is the ONLY place internship fees are defined; the frontend's copy in `assets/js/config.js` is just for instant display and is never trusted:

```js
const DURATION_FEES = { 4: 1500, 6: 2000, 8: 3000 };
```

## 5. Deploy the Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Settings:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
4. Click **Deploy**, authorize again if prompted.
5. Copy the **Web app URL** (ends in `/exec`).

## 6. Connect the frontend

1. Open `assets/js/config.js` in this project.
2. Paste your Web app URL into:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXXXXXX/exec";
```

3. Save. That's it — every page (applications, certificate requests, manager dashboard, certificate verification) now talks to your Sheet.

> **Re-deploying:** any time you change the `.gs` files, you must create a **new deployment version** (Deploy → Manage deployments → edit → "New version") for the changes to go live on the existing `/exec` URL.

## 7. Host the static site

Every internal link in this project is a **clean URL** — `internships`, `about`, `apply?id=...` — with no `.html` on the end, so the site reads like a real web app instead of a stack of static files.

- **Netlify / Vercel**: clean URLs work automatically out of the box (they transparently serve `about.html` for a request to `/about`). Just upload/connect the folder — no extra config needed.
- **GitHub Pages / a plain web server**: these do **not** rewrite extensionless URLs by default. Either add rewrite rules for your host (e.g. a `_redirects` file on Netlify-style hosts, or `.htaccess` `RewriteRule` on Apache), or keep testing locally the way this project already does — see `dev-server.py` below.
- **Local testing**: run `python dev-server.py` (or use the `static-site` launch config) instead of the plain `python -m http.server`. It's a small wrapper that serves `/about` from `about.html` transparently, matching production clean-URL behavior.

Update `SITE_BASE_URL` in `Config.gs` to match your final hosting URL, then redeploy the web app (step 6's note above) — it also builds the certificate verification link as a clean URL (`/verify-certificate?credentialId=...`).

## 8. The logo

`assets/img/logo.png` is your real exported logo (background made transparent, resized for fast loading) and `assets/img/logo-icon.png` is the mark cropped out on its own (no wordmark), used at a larger size in the header where the full lockup would be too small to read. To swap either file, just replace it in place — same filename, same folder — no code changes needed as long as the new file keeps a transparent background so it drops in cleanly on both light and dark sections.

---

## How each Google Sheet is used

| Sheet | Purpose |
|---|---|
| `Internship_Openings` | The 7 programs. Edit `Openings`/`Status` here anytime — the site picks it up on next load. |
| `Applications` | Every submitted application — fee, coupon, discount, payment status and the full intern journey all live on one row, keyed by a unique `Application_ID` (e.g. `BMT-APP-2026-000001`). |
| `Coupons` | Discount codes. Admin creates/edits these from the Manager Dashboard's **Coupons** tab; `Used_Count` increments automatically whenever an application is submitted with that code. |
| `Certificates` | Both certificate **requests** (Status = Pending/Rejected) and **issued certificates** (Status = Approved, with `Credential_ID`). This is what public verification reads. |
| `Managers` | Login accounts for the Manager Dashboard. Add more rows to add more managers (hash new passwords the same way as step 3). |
| `Contact_Queries` | Messages submitted via the Contact Us page. |

## Application & payment flow

1. Applicant picks an internship, then a duration (4/6/8 weeks — fee shown instantly from `assets/js/config.js`, but always **recomputed server-side** from `Config.gs → DURATION_FEES`).
2. Optionally enters a coupon code → **Apply Coupon** calls the `validateCoupon` action, which looks the code up in the `Coupons` sheet and returns the real discount (or one of the exact error strings: *"Invalid or expired coupon code."*, *"This coupon has expired."*, *"This coupon is no longer available."*). Nothing is calculated on the frontend.
3. The live Application Summary (Original Fee, Discount %, Discount Amount, Final Amount) is shown before submission.
4. On **Submit Application**, the backend re-validates everything, generates a unique `Application_ID`, saves the row with `Application_Status = New` and `Payment_Status = Payment Pending`, increments the coupon's `Used_Count`, and sends **two emails**: one to the applicant (with the Application Number and payment instructions) and one to `TEAM_EMAIL` (full application details, flagged "Payment Pending").
5. The applicant pays the fee manually and emails a payment screenshot to `TEAM_EMAIL`, mentioning their Application Number in the subject (`Payment Proof — BMT-APP-...`) as instructed on-screen and in their confirmation email.
6. A manager checks the inbox and manually updates **Payment Status** (and **Payment Proof Status**) for that application from the **Manager Dashboard → Applications** tab — nothing is ever auto-marked as verified.
7. Once payment is verified, the manager moves `Application_Status` through Selected → Training → Live Project → Completed as the internship progresses.

## Certificate approval flow

1. Once `Application_Status = Completed`, the intern submits a **Certificate Request** (`certificate-request.html`) with their Application Number + email.
2. A row appears in `Certificates` with `Status = Pending`, and the application's status flips to `Certificate Requested`.
3. Manager logs in (`manager-login.html`) → **Manager Dashboard** → **Certificate Requests** tab → **View** to see full intern/application details (including computed Training/Live-Project completion flags), then **Approve & Generate Certificate** with start/completion dates.
4. The backend does all of this automatically: verifies the record, generates a unique `Credential_ID` (e.g. `BMT-CRED-2026-000001`), builds an A4-landscape PDF certificate, saves it as a shareable Drive file (`Certificate_URL`), builds the QR/verification URL, updates the `Certificates` row to `Approved`, updates the application to `Certificate Approved`, and emails the intern a download link + verification link + the PDF attached.
5. Anyone can verify that certificate at `verify-certificate.html` using the Credential ID — only public-safe fields are ever returned (name, program, duration, dates, status — never email/phone/resume). A manager can also **Reject** a pending request, **Revoke** an issued certificate, or **Resend** the certificate email at any time from the same tab.

## Security notes (read before going live)

- Manager passwords are stored as SHA-256 hashes, and login sessions use short-lived tokens (`CacheService`, 6-hour TTL) — this is adequate for a small internal tool, but **not** a substitute for a real auth provider if you scale this up.
- The Apps Script Web App is deployed "Execute as: Me" so it can write to your Sheet regardless of who calls it — meaning **anyone with the `/exec` URL can call the public actions** (submit application, validate coupon, verify certificate, contact form). This is expected/necessary for a public-facing form, but don't put anything in `Config.gs`/the sheet you wouldn't want technically reachable by a determined user hitting the API directly.
- Payment is never auto-verified. `Payment_Status` only ever changes when a manager updates it from the dashboard after checking the emailed screenshot — treat that as a hard rule if you extend this system.
- Certificate PDFs are saved to the Drive of whichever account the script runs as ("Execute as: Me"), shared as "Anyone with the link — Viewer". The first `setupSheets()`/certificate approval run will prompt for Drive authorization — that's expected.
- Consider adding Google reCAPTCHA or a simple honeypot field if spam submissions become an issue.
