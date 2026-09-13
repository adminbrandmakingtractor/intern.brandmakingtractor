# ⚠️ LEGACY — not used in production

This folder implements the **original** Google Apps Script + Google Sheets backend
for intern.brandmakingtractor.com. It has been **replaced** by a Supabase Edge Function
(see `assets/js/config.js` → `SUPABASE_FUNCTION_URL` / `SUPABASE_ANON_KEY`).

The current frontend (`main.js` → `apiCall()` / `apiGet()`) talks to that Supabase
Edge Function directly and never calls anything in this folder.

Nothing here is deployed or reachable in production today. It is kept only as a
historical reference for the data model and business rules (application flow,
coupon validation, certificate approval) that the Supabase function is expected
to mirror. Do not follow `docs/SETUP_GUIDE.md` to deploy this site — it documents
this legacy path, not the live one.

If you are auditing or extending the **real** backend, you need access to the
Supabase project (dashboard) and the Resend account — neither is included in
this repository.

One known drift worth noting if this code is ever revived: `Config.gs` here uses
`internships@brandmakingtractor.com` (plural) while every live frontend surface
uses `internship@brandmakingtractor.com` (singular) — confirm which mailbox is
actually monitored before trusting either.
