// intern.brandmakingtractor.com — Supabase Edge Function "api"
// Deploy as a function named "api". Paste this whole file as its index.ts.
//
// Mirrors the old Apps Script doGet/doPost router 1:1 so the frontend's
// apiCall()/apiGet() helpers barely need to change — same {action, ...}
// request shape, same {success, data|error} response shape.
//
// This copy is kept in the frontend repo for reference/version-control only
// — it is NOT deployed from here. After editing, paste it into the Supabase
// Edge Function editor (or push via the Supabase CLI) and redeploy.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

// ---- Config (mirrors apps-script/Config.gs) ----
const BRAND_NAME = "intern.brandmakingtractor.com";
const BRAND_TAGLINE = "LEARN • CREATE • GROW";
const TEAM_EMAIL = "internship@brandmakingtractor.com";
const UPI_ID = "ramprasath03052004@okicici";
const DURATION_FEES: Record<string, number> = { "4": 1500, "6": 2000, "8": 3000 };
const CERTIFICATE_VALID_YEARS = 2;
const MANAGER_SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const SITE_BASE_URL = "https://intern.brandmakingtractor.com/";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || ""; // set via `supabase secrets set RESEND_API_KEY=...`
// Sends as "internship@brandmakingtractor.com" once that domain is verified in Resend.
// Falls back to Resend's shared test address until the domain is verified.
const RESEND_FROM = Deno.env.get("RESEND_FROM") || "onboarding@resend.dev";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ---- CORS ----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

function jsonSuccess(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
function jsonError(message: string) {
  return new Response(JSON.stringify({ success: false, error: String(message) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ---- Utils ----
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function nextId(prefix: string, pad: number): Promise<string> {
  const { data, error } = await supabase.rpc("next_sequential_id", { p_prefix: prefix, p_pad: pad });
  if (error) throw new Error(error.message);
  return data as string;
}

function money(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

// Escapes user-submitted text before it's interpolated into email HTML —
// applicant name/email/phone go straight into templates below, and without
// this a submitted name like `<a href="...">click</a>` would render as a
// live link/markup inside both the applicant's and the team's inbox.
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildVerificationUrl(credentialId: string) {
  const base = SITE_BASE_URL ? SITE_BASE_URL.replace(/\/$/, "") : "";
  return `${base}/verify-certificate?credentialId=${encodeURIComponent(credentialId)}`;
}
function buildQrCodeUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}
function structureLine(durationStr: string) {
  const totalWeeks = parseInt(String(durationStr).replace(/[^0-9]/g, ""), 10);
  if (!totalWeeks || totalWeeks <= 1) return "1 Week Training + Direct Live Client Project Experience";
  const liveWeeks = totalWeeks - 1;
  return `1 Week Training + ${liveWeeks} Week${liveWeeks === 1 ? "" : "s"} Live Client Project`;
}
function dateOnly(v: any) {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d;
}
function fmtDate(v: any) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// ---- Email (Resend) — awaited by every caller (see submitApplication,
// submitContactQuery, approveCertificate, resendCertificateEmail) so a
// failed send is guaranteed to actually run and log before the request
// finishes, instead of racing the function's shutdown. ----
async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string; attachment?: { filename: string; contentBase64: string } }) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set in this function's secrets — skipping email:", opts.subject, "to:", opts.to);
    return;
  }
  const body: any = {
    from: `${BRAND_NAME} <${RESEND_FROM}>`,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html
  };
  if (opts.replyTo) body.reply_to = opts.replyTo;
  if (opts.attachment) body.attachments = [{ filename: opts.attachment.filename, content: opts.attachment.contentBase64 }];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) console.error("Resend error sending to", opts.to, "status:", res.status, await res.text());
    else console.log("Resend accepted email to", opts.to, "-", opts.subject);
  } catch (err) {
    console.error("Resend send failed for", opts.to, ":", (err as Error).message);
  }
}

// ============================================================
// PUBLIC ACTIONS
// ============================================================

async function getInternships() {
  const { data, error } = await supabase
    .from("internship_openings")
    .select("opening_id,title,department,openings,status");
  if (error) throw new Error(error.message);
  // Frontend (internships.html -> refreshFromBackend) merges by these exact PascalCase keys.
  return (data || []).map((o: any) => ({
    Opening_ID: o.opening_id, Title: o.title, Department: o.department, Openings: o.openings, Status: o.status
  }));
}

function getDurationFee(duration: string | number) {
  const fee = DURATION_FEES[String(duration)];
  if (!fee) throw new Error("Please choose a valid internship duration (4, 6 or 8 weeks).");
  return fee;
}

async function validateCoupon(couponCode: string, duration: string | number) {
  if (!couponCode || !String(couponCode).trim()) throw new Error("Please enter a coupon code.");
  const originalFee = getDurationFee(duration);

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .ilike("coupon_code", String(couponCode).trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!coupon || coupon.status !== "Active") throw new Error("Invalid or expired coupon code.");

  const today = dateOnly(new Date());
  if (coupon.start_date && today < dateOnly(coupon.start_date)) throw new Error("This coupon is not active yet.");
  if (coupon.expiry_date && today > dateOnly(coupon.expiry_date)) throw new Error("This coupon has expired.");

  const usageLimit = Number(coupon.usage_limit) || 0;
  const usedCount = Number(coupon.used_count) || 0;
  if (usageLimit > 0 && usedCount >= usageLimit) throw new Error("This coupon is no longer available.");

  const discountPercentage = Number(coupon.discount_percentage) || 0;
  const discountAmount = Math.round(originalFee * discountPercentage) / 100;
  const finalAmount = Math.round((originalFee - discountAmount) * 100) / 100;

  return { valid: true, code: coupon.coupon_code, originalFee, discountPercentage, discountAmount, finalAmount };
}

// NOTE (flagged, not changed here): this is a read-then-write increment, not
// an atomic one. Two applications submitted in the same instant with the
// same coupon code could both read the same used_count and each write
// used_count+1 — the count would undercount by one instead of reflecting
// both uses. Low real-world impact at this traffic volume, but the
// authoritative fix is an atomic SQL RPC (same pattern as next_sequential_id)
// rather than a JS-side read+write. Flagging instead of guessing at a new
// RPC signature I can't test against your actual schema.
async function incrementCouponUsage(couponCode: string) {
  if (!couponCode) return;
  const { data: coupon } = await supabase.from("coupons").select("coupon_id,used_count").ilike("coupon_code", couponCode).maybeSingle();
  if (!coupon) return;
  await supabase.from("coupons").update({ used_count: (Number(coupon.used_count) || 0) + 1 }).eq("coupon_id", coupon.coupon_id);
}

async function submitApplication(body: any) {
  const required = ["fullName", "email", "phone", "city", "college", "course", "year", "selectedInternshipId", "duration", "skills", "whyJoin", "availability"];
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || String(body[f]).trim() === "") throw new Error(`Missing required field: ${f}`);
  }
  if (!/^\S+@\S+\.\S+$/.test(body.email)) throw new Error("Please enter a valid email address.");

  const { data: opening, error: openingErr } = await supabase
    .from("internship_openings").select("*").eq("opening_id", body.selectedInternshipId).maybeSingle();
  if (openingErr) throw new Error(openingErr.message);
  if (!opening) throw new Error("Selected internship not found.");

  const originalFee = getDurationFee(body.duration);
  let couponCode = "", discountPercentage = 0, discountAmount = 0, finalAmount = originalFee;

  if (body.couponCode && String(body.couponCode).trim()) {
    const result = await validateCoupon(body.couponCode, body.duration);
    couponCode = result.code; discountPercentage = result.discountPercentage;
    discountAmount = result.discountAmount; finalAmount = result.finalAmount;
  }

  const applicationId = await nextId("BMT-APP", 6);

  const { error: insertErr } = await supabase.from("applications").insert({
    application_id: applicationId,
    full_name: body.fullName, email: body.email, phone: body.phone, city: body.city,
    college: body.college, course: body.course, year: body.year,
    internship_role: opening.title, opening_id: opening.opening_id,
    duration: `${body.duration} Weeks`, original_fee: originalFee,
    coupon_code: couponCode, discount_percentage: discountPercentage,
    discount_amount: discountAmount, final_amount: finalAmount,
    skills: body.skills, portfolio: body.portfolioUrl || "", linkedin: body.linkedinUrl || "",
    resume: body.resumeUrl || "", why_join: body.whyJoin, availability: body.availability,
    application_status: "New", payment_status: "Payment Pending", payment_proof_status: "Not Received"
  });
  if (insertErr) throw new Error(insertErr.message);

  if (couponCode) await incrementCouponUsage(couponCode);

  // Awaited (not fire-and-forget) so a Resend failure is guaranteed to run
  // to completion and show up in the function's logs before the response
  // returns — sendEmail() already catches its own errors internally, so a
  // failed send here never breaks the application submission itself.
  await sendApplicationConfirmationEmail({
    email: body.email, fullName: body.fullName, applicationId,
    internshipTitle: opening.title, duration: `${body.duration} Weeks`,
    finalAmount
  });
  await sendTeamApplicationEmail({
    fullName: body.fullName, email: body.email, phone: body.phone, applicationId,
    internshipTitle: opening.title, duration: `${body.duration} Weeks`,
    originalFee, couponCode, discountPercentage, finalAmount
  });

  return { applicationId, originalFee, couponCode, discountPercentage, discountAmount, finalAmount };
}

async function requestCertificate(body: any) {
  const required = ["fullName", "applicationId"];
  for (const f of required) if (!body[f] || String(body[f]).trim() === "") throw new Error(`Missing required field: ${f}`);

  const { data: app } = await supabase.from("applications").select("*").eq("application_id", body.applicationId).maybeSingle();
  if (!app) throw new Error("We couldn't find that Application Number. Please double-check and try again.");
  if (String(app.full_name).trim().toLowerCase() !== String(body.fullName).trim().toLowerCase()) throw new Error("That name doesn't match the one used for this application.");

  const { data: existing } = await supabase.from("certificates").select("status").eq("application_id", body.applicationId).maybeSingle();
  if (existing) {
    if (existing.status === "Approved") throw new Error("A certificate has already been issued for this application.");
    if (existing.status === "Pending") throw new Error("A certificate request for this application is already pending review.");
  }

  const certificateId = await nextId("CERTREQ", 6);
  const internId = String(body.applicationId).replace("BMT-APP-", "BMT-INT-");

  const { error } = await supabase.from("certificates").insert({
    certificate_id: certificateId, application_id: body.applicationId, intern_id: internId,
    full_name: app.full_name, email: app.email, internship_role: app.internship_role, duration: app.duration,
    start_date: app.start_date, completion_date: app.completion_date, status: "Pending", request_notes: body.notes || ""
  });
  if (error) throw new Error(error.message);

  await supabase.from("applications").update({ application_status: "Certificate Requested" }).eq("application_id", body.applicationId);

  return { certificateId, applicationId: body.applicationId, status: "Pending" };
}

async function verifyCertificate(credentialId: string) {
  if (!credentialId || !credentialId.trim()) return { valid: false };
  const { data: record } = await supabase.from("certificates").select("*")
    .ilike("credential_id", credentialId.trim()).eq("status", "Approved").maybeSingle();
  if (!record) return { valid: false };

  const now = new Date();
  const validUntil = new Date(record.certificate_valid_until);
  const status = now > validUntil ? "EXPIRED" : "VALID";

  return {
    valid: true, name: record.full_name, internshipTitle: record.internship_role, duration: record.duration,
    startDate: record.start_date, completionDate: record.completion_date, issueDate: record.certificate_issue_date,
    validUntil: record.certificate_valid_until, credentialId: record.credential_id, status
  };
}

async function submitContactQuery(body: any) {
  const required = ["fullName", "email", "subject", "message"];
  for (const f of required) if (!body[f] || String(body[f]).trim() === "") throw new Error(`Missing required field: ${f}`);

  const queryId = await nextId("BMT-QRY", 4);
  const { error } = await supabase.from("contact_queries").insert({
    query_id: queryId, full_name: body.fullName, email: body.email, phone: body.phone || "",
    subject: body.subject, message: body.message, status: "New"
  });
  if (error) throw new Error(error.message);

  await sendEmail({
    to: body.email,
    subject: `We received your message — ${BRAND_NAME}`,
    html: `<p>Hi ${escapeHtml(body.fullName)},</p><p>Thanks for reaching out to <strong>${BRAND_NAME}</strong>. We've received your message and will get back to you within 1–2 business days.</p><p><strong>Your reference ID:</strong> ${queryId}</p><p style="color:#8996a8;font-size:12px;">${BRAND_TAGLINE}</p>`
  });

  return { queryId };
}

async function managerLogin(email: string, password: string) {
  if (!email || !password) throw new Error("Email and password are required.");
  const { data: manager } = await supabase.from("managers").select("*").ilike("email", email).maybeSingle();
  if (!manager) throw new Error("Invalid email or password.");
  const hash = await hashPassword(password);
  if (hash !== manager.password_hash) throw new Error("Invalid email or password.");

  const { data: session, error } = await supabase.from("manager_sessions").insert({
    manager_id: manager.manager_id, email: manager.email, name: manager.name,
    expires_at: new Date(Date.now() + MANAGER_SESSION_TTL_MS).toISOString()
  }).select("token").single();
  if (error) throw new Error(error.message);

  return { token: session.token, name: manager.name, email: manager.email };
}

async function requireManagerAuth(token: string) {
  if (!token) throw new Error("UNAUTHORIZED");
  const { data: session } = await supabase.from("manager_sessions").select("*").eq("token", token).maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) throw new Error("SESSION_EXPIRED");
  return session;
}

// ============================================================
// MANAGER ACTIONS
// ============================================================

async function getManagerDashboard() {
  const [{ data: applications }, { data: certRequests }, { data: coupons }, { data: openings }] = await Promise.all([
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("certificates").select("*").order("requested_date", { ascending: false }),
    supabase.from("coupons").select("*").order("created_date", { ascending: false }),
    supabase.from("internship_openings").select("opening_id,title,department,openings,status")
  ]);

  const apps = applications || [];
  const certificateRequests = (certRequests || []).map((c: any) => {
    const app = apps.find((a: any) => a.application_id === c.application_id);
    const status = app?.application_status;
    return {
      ...c,
      Training_Completed: ["Live Project", "Completed", "Certificate Requested", "Certificate Approved"].includes(status),
      Live_Project_Completed: ["Completed", "Certificate Requested", "Certificate Approved"].includes(status)
    };
  });

  const stats = {
    pendingCertificates: certificateRequests.filter((c: any) => c.status === "Pending").length,
    issuedCertificates: certificateRequests.filter((c: any) => c.status === "Approved").length,
    totalApplications: apps.length,
    paymentPending: apps.filter((a: any) => a.payment_status === "Payment Pending").length,
    paymentVerified: apps.filter((a: any) => a.payment_status === "Payment Verified").length,
    openSlots: (openings || []).filter((o: any) => o.status === "Open").reduce((s: number, o: any) => s + (Number(o.openings) || 0), 0)
  };

  // Re-shape to the exact PascalCase keys the existing dashboard HTML/JS expects.
  return {
    applications: apps.map(reshapeApplication),
    certificateRequests: certificateRequests.map(reshapeCertificate),
    coupons: (coupons || []).map(reshapeCoupon),
    openings: (openings || []).map((o: any) => ({ Opening_ID: o.opening_id, Title: o.title, Department: o.department, Openings: o.openings, Status: o.status })),
    stats
  };
}

function reshapeApplication(a: any) {
  return {
    Application_ID: a.application_id, Timestamp: a.created_at, Full_Name: a.full_name, Email: a.email, Phone: a.phone,
    Internship_Role: a.internship_role, Duration: a.duration, Original_Fee: a.original_fee, Coupon_Code: a.coupon_code,
    Discount_Percentage: a.discount_percentage, Final_Amount: a.final_amount, Payment_Status: a.payment_status,
    Application_Status: a.application_status, Resume: a.resume
  };
}
function reshapeCertificate(c: any) {
  return {
    Certificate_ID: c.certificate_id, Application_ID: c.application_id, Intern_ID: c.intern_id, Full_Name: c.full_name,
    Email: c.email, Internship_Role: c.internship_role, Duration: c.duration, Start_Date: c.start_date,
    Completion_Date: c.completion_date, Status: c.status, Credential_ID: c.credential_id, Certificate_URL: c.certificate_url,
    Training_Completed: c.Training_Completed, Live_Project_Completed: c.Live_Project_Completed, Request_Notes: c.request_notes
  };
}
function reshapeCoupon(c: any) {
  return {
    Coupon_ID: c.coupon_id, Coupon_Code: c.coupon_code, Discount_Percentage: c.discount_percentage,
    Start_Date: c.start_date, Expiry_Date: c.expiry_date, Usage_Limit: c.usage_limit, Used_Count: c.used_count, Status: c.status
  };
}

async function updateApplicationStatus(body: any) {
  if (!body.applicationId) throw new Error("Missing applicationId.");
  const updates: any = {};
  if (body.fullName !== undefined && body.fullName !== "") updates.full_name = body.fullName;
  if (body.email !== undefined && body.email !== "") updates.email = body.email;
  if (body.phone !== undefined && body.phone !== "") updates.phone = body.phone;
  if (body.applicationStatus !== undefined) updates.application_status = body.applicationStatus;
  if (body.paymentStatus !== undefined) updates.payment_status = body.paymentStatus;
  if (body.paymentProofStatus !== undefined) updates.payment_proof_status = body.paymentProofStatus;
  if (body.managerNotes !== undefined) updates.manager_notes = body.managerNotes;
  if (body.startDate !== undefined) updates.start_date = body.startDate || null;
  if (body.completionDate !== undefined) updates.completion_date = body.completionDate || null;

  const { error } = await supabase.from("applications").update(updates).eq("application_id", body.applicationId);
  if (error) throw new Error(error.message);
  return { applicationId: body.applicationId, updated: true };
}

async function adminCreateCoupon(body: any) {
  const required = ["couponCode", "discountPercentage", "startDate", "expiryDate", "usageLimit"];
  for (const f of required) if (body[f] === undefined || body[f] === null || body[f] === "") throw new Error(`Missing required field: ${f}`);

  const { data: existing } = await supabase.from("coupons").select("coupon_id").ilike("coupon_code", body.couponCode).maybeSingle();
  if (existing) throw new Error("A coupon with this code already exists.");

  const discount = Number(body.discountPercentage);
  if (isNaN(discount) || discount <= 0 || discount > 100) throw new Error("Discount percentage must be between 1 and 100.");

  const couponId = await nextId("CPN", 4);
  const { error } = await supabase.from("coupons").insert({
    coupon_id: couponId, coupon_code: String(body.couponCode).trim().toUpperCase(), discount_percentage: discount,
    start_date: body.startDate, expiry_date: body.expiryDate, usage_limit: Number(body.usageLimit) || 0,
    used_count: 0, status: body.status || "Active"
  });
  if (error) throw new Error(error.message);
  return { couponId };
}

async function adminUpdateCoupon(body: any) {
  if (!body.couponId) throw new Error("Missing couponId.");
  const updates: any = {};
  if (body.couponCode !== undefined) updates.coupon_code = String(body.couponCode).trim().toUpperCase();
  if (body.discountPercentage !== undefined) updates.discount_percentage = Number(body.discountPercentage);
  if (body.startDate !== undefined) updates.start_date = body.startDate;
  if (body.expiryDate !== undefined) updates.expiry_date = body.expiryDate;
  if (body.usageLimit !== undefined) updates.usage_limit = Number(body.usageLimit);
  if (body.status !== undefined) updates.status = body.status;

  const { error } = await supabase.from("coupons").update(updates).eq("coupon_id", body.couponId);
  if (error) throw new Error(error.message);
  return { couponId: body.couponId };
}

async function adminToggleCouponStatus(couponId: string, status: string) {
  if (!couponId || !status) throw new Error("Missing couponId or status.");
  const { error } = await supabase.from("coupons").update({ status }).eq("coupon_id", couponId);
  if (error) throw new Error(error.message);
  return { couponId, status };
}

async function updateOpeningStatus(openingId: string, status: string) {
  if (!openingId || !status) throw new Error("Missing openingId or status.");
  const { error } = await supabase.from("internship_openings").update({ status }).eq("opening_id", openingId);
  if (error) throw new Error(error.message);
  return { openingId, status };
}

// ---- Certificate PDF (pdf-lib, pure JS — no headless browser needed) ----
const LOGO_URL = "https://wqtxsssegtjedobddtlq.supabase.co/storage/v1/object/public/certificates/assets/logo.png";

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

async function generateCertificatePdf(data: any): Promise<{ url: string; base64: string }> {
  const W = 842, H = 595; // A4 landscape, points
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.05, 0.11, 0.18);
  const green = rgb(0.18, 0.62, 0.24);
  const blue = rgb(0.12, 0.37, 0.84);
  const gold = rgb(0.78, 0.62, 0.18);
  const gray = rgb(0.54, 0.59, 0.66);
  const paleGray = rgb(0.93, 0.94, 0.96);

  const centerText = (text: string, y: number, size: number, f: any, color: any) => {
    const width = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (W - width) / 2, y, size, font: f, color });
  };

  // ---- Background + border frame ----
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 16, y: 16, width: W - 32, height: H - 32, borderColor: navy, borderWidth: 2 });
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: gold, borderWidth: 1 });
  // Corner accents
  [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]].forEach(([cx, cy]) => {
    page.drawEllipse({ x: cx, y: cy, xScale: 4, yScale: 4, color: gold });
  });

  // ---- Header: logo + brand ----
  try {
    const logoBytes = await fetchBytes(LOGO_URL);
    const logoImg = await doc.embedPng(logoBytes);
    const logoSize = 54;
    page.drawImage(logoImg, { x: (W - logoSize) / 2, y: H - 92, width: logoSize, height: logoSize });
  } catch (_e) { /* logo optional — certificate still renders fine without it */ }

  centerText("intern.brandmakingtractor.com", H - 108, 15, bold, green);
  centerText(BRAND_TAGLINE, H - 122, 9, reg, gray);

  // ---- Title ----
  centerText("CERTIFICATE OF INTERNSHIP", H - 168, 27, bold, navy);
  page.drawLine({ start: { x: W / 2 - 90, y: H - 180 }, end: { x: W / 2 + 90, y: H - 180 }, thickness: 1.5, color: gold });

  // ---- Body ----
  centerText("This is to certify that", H - 212, 11.5, italic, gray);
  centerText(data.fullName, H - 250, 30, bold, blue);
  page.drawLine({ start: { x: W / 2 - 140, y: H - 258 }, end: { x: W / 2 + 140, y: H - 258 }, thickness: 0.75, color: paleGray });

  centerText("has successfully completed the internship program in", H - 280, 11.5, reg, gray);
  centerText(data.internshipTitle, H - 306, 18, bold, navy);
  centerText(`${structureLine(data.duration)}  ·  ${fmtDate(data.startDate)} — ${fmtDate(data.completionDate)}`, H - 328, 10.5, reg, gray);

  // ---- Footer: credential block (left) + signature (center) + QR (right) ----
  const footerY = 92;
  page.drawLine({ start: { x: 70, y: footerY + 46 }, end: { x: W - 70, y: footerY + 46 }, thickness: 0.75, color: paleGray });

  // Left — credential details
  const rows: [string, string][] = [
    ["Credential ID", data.credentialId],
    ["Issue Date", fmtDate(data.issueDate)],
    ["Valid Until", fmtDate(data.validUntil)]
  ];
  let ry = footerY + 20;
  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), { x: 70, y: ry, size: 7.5, font: bold, color: gray });
    page.drawText(String(value), { x: 70, y: ry - 12, size: 10.5, font: bold, color: navy });
    ry -= 30;
  }

  // Center — verified seal + signature.
  // A plain checkmark-in-a-circle read as flat/generic, so this draws an
  // actual seal: a ring of gold "sunburst" rays (drawn first, then the navy
  // disc painted on top so only their outer tips peek out — the same
  // draw-then-cover layering already used for the ring below), a bigger/
  // bolder checkmark, and a small letter-spaced "VERIFIED" label above the
  // signature line. All done with the same primitives (drawLine/drawEllipse/
  // drawText) already used elsewhere in this function — no new dependency,
  // and no reliance on drawSvgPath's coordinate quirks.
  const sealCx = W / 2, sealCy = footerY + 34;
  const rayCount = 16, rInner = 20, rOuter = 31;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * 2 * Math.PI) / rayCount;
    page.drawLine({
      start: { x: sealCx + rInner * Math.cos(angle), y: sealCy + rInner * Math.sin(angle) },
      end: { x: sealCx + rOuter * Math.cos(angle), y: sealCy + rOuter * Math.sin(angle) },
      thickness: 1.3, color: gold
    });
  }
  page.drawEllipse({ x: sealCx, y: sealCy, xScale: 24, yScale: 24, color: navy });
  page.drawEllipse({ x: sealCx, y: sealCy, xScale: 19, yScale: 19, borderColor: gold, borderWidth: 1.2 });
  // Checkmark — vector lines, standard PDF fonts can't encode the ✓ glyph.
  page.drawLine({ start: { x: sealCx - 10, y: sealCy - 1 }, end: { x: sealCx - 3, y: sealCy - 9 }, thickness: 3, color: gold });
  page.drawLine({ start: { x: sealCx - 3, y: sealCy - 9 }, end: { x: sealCx + 11, y: sealCy + 10 }, thickness: 3, color: gold });

  centerText("V E R I F I E D", footerY - 4 + 4, 6.5, bold, gold);
  page.drawLine({ start: { x: sealCx - 60, y: footerY - 4 }, end: { x: sealCx + 60, y: footerY - 4 }, thickness: 0.75, color: navy });
  centerText(data.approvedBy || "Program Manager", footerY - 16, 10, bold, navy);
  centerText("Program Manager", footerY - 27, 8, reg, gray);

  // Right — QR code to verify
  try {
    const qrBytes = await fetchBytes(buildQrCodeUrl(data.verificationUrl));
    const qrImg = await doc.embedPng(qrBytes);
    const qrSize = 62;
    page.drawImage(qrImg, { x: W - 70 - qrSize, y: footerY - 8, width: qrSize, height: qrSize });
    centerAt(page, W - 70 - qrSize / 2, footerY - 20, "Scan to Verify", 7.5, reg, gray);
  } catch (_e) { /* QR optional */ }

  const bytes = await doc.save();
  const base64 = btoa(String.fromCharCode(...bytes));

  const path = `Certificate-${data.credentialId}.pdf`;
  const { error: upErr } = await supabase.storage.from("certificates").upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (upErr) throw new Error(upErr.message);
  const { data: pub } = supabase.storage.from("certificates").getPublicUrl(path);

  return { url: pub.publicUrl, base64 };
}

function centerAt(page: any, cx: number, y: number, text: string, size: number, f: any, color: any) {
  const width = f.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - width / 2, y, size, font: f, color });
}

async function approveCertificate(body: any) {
  const required = ["certificateId", "startDate", "completionDate"];
  for (const f of required) if (!body[f]) throw new Error(`Missing required field: ${f}`);

  const { data: record } = await supabase.from("certificates").select("*").eq("certificate_id", body.certificateId).maybeSingle();
  if (!record) throw new Error("Certificate request not found.");
  if (record.status === "Approved") throw new Error("This certificate has already been issued.");

  const credentialId = await nextId("BMT-CRED", 6);
  const issueDate = new Date();
  const validUntil = new Date(issueDate); validUntil.setFullYear(validUntil.getFullYear() + CERTIFICATE_VALID_YEARS);
  const verificationUrl = buildVerificationUrl(credentialId);
  const approvedBy = body.approvedBy || "Program Manager";

  const pdf = await generateCertificatePdf({
    fullName: record.full_name, internshipTitle: record.internship_role, duration: record.duration,
    credentialId, startDate: body.startDate, completionDate: body.completionDate,
    issueDate, validUntil, approvedBy, verificationUrl
  });

  await supabase.from("certificates").update({
    status: "Approved", credential_id: credentialId, start_date: body.startDate, completion_date: body.completionDate,
    certificate_issue_date: issueDate.toISOString(), certificate_valid_until: validUntil.toISOString(),
    approved_by: approvedBy, approval_date: new Date().toISOString(), certificate_url: pdf.url, verification_url: verificationUrl
  }).eq("certificate_id", body.certificateId);

  await supabase.from("applications").update({
    application_status: "Certificate Approved", start_date: body.startDate, completion_date: body.completionDate
  }).eq("application_id", record.application_id);

  await sendCertificateIssuedEmail({
    email: record.email, fullName: record.full_name, internshipTitle: record.internship_role, duration: record.duration,
    credentialId, certificateUrl: pdf.url, verificationUrl, pdfBase64: pdf.base64
  });

  return { credentialId, verificationUrl, certificateUrl: pdf.url };
}

async function rejectCertificateRequest(certificateId: string, notes?: string) {
  if (!certificateId) throw new Error("Missing certificateId.");
  const { data: record } = await supabase.from("certificates").select("application_id,request_notes").eq("certificate_id", certificateId).maybeSingle();
  if (!record) throw new Error("Certificate request not found.");

  await supabase.from("certificates").update({ status: "Rejected", request_notes: notes || record.request_notes }).eq("certificate_id", certificateId);
  await supabase.from("applications").update({ application_status: "Completed" }).eq("application_id", record.application_id);
  return { certificateId, status: "Rejected" };
}

async function revokeCertificate(certificateId: string) {
  if (!certificateId) throw new Error("Missing certificateId.");
  const { error } = await supabase.from("certificates").update({ status: "Revoked" }).eq("certificate_id", certificateId);
  if (error) throw new Error(error.message);
  return { certificateId, status: "Revoked" };
}

async function resendCertificateEmail(certificateId: string) {
  if (!certificateId) throw new Error("Missing certificateId.");
  const { data: record } = await supabase.from("certificates").select("*").eq("certificate_id", certificateId).maybeSingle();
  if (!record) throw new Error("Certificate not found.");
  if (record.status !== "Approved") throw new Error("This certificate has not been approved yet.");

  await sendCertificateIssuedEmail({
    email: record.email, fullName: record.full_name, internshipTitle: record.internship_role, duration: record.duration,
    credentialId: record.credential_id, certificateUrl: record.certificate_url, verificationUrl: record.verification_url
  });
  return { certificateId, resent: true };
}

// ---- Email templates (content matches the old Apps Script emails) ----
async function sendApplicationConfirmationEmail(data: any) {
  const html = `
  <div style="background:#f1f4f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(13,27,46,.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#0d1b2e,#15304f);padding:28px 32px;text-align:center;">
          <p style="margin:0;color:#4ade80;font-weight:800;letter-spacing:1.5px;font-size:15px;">${BRAND_NAME.toUpperCase()}</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,.6);font-size:11px;letter-spacing:2px;">${BRAND_TAGLINE}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <div style="display:inline-block;background:#e8f9ec;color:#1a9448;font-size:12px;font-weight:700;padding:5px 12px;border-radius:20px;margin-bottom:14px;">✓ APPLICATION RECEIVED</div>
          <h2 style="margin:0 0 4px;color:#0d1b2e;font-size:22px;">Hi ${escapeHtml(data.fullName)},</h2>
          <p style="margin:0 0 20px;color:#4b5563;font-size:14.5px;line-height:1.6;">Thanks for applying to the <strong style="color:#0d1b2e;">${escapeHtml(data.internshipTitle)}</strong> at ${BRAND_NAME}. Here's a quick summary:</p>

          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;margin-bottom:22px;">
            <tr><td style="padding:12px 16px;color:#8996a8;font-size:13px;">Application Number</td><td style="padding:12px 16px;font-weight:700;color:#0d1b2e;font-size:13px;text-align:right;">${escapeHtml(data.applicationId)}</td></tr>
            <tr><td style="padding:0 16px 12px;color:#8996a8;font-size:13px;border-top:1px solid #eef1f5;">Duration</td><td style="padding:0 16px 12px;font-weight:700;color:#0d1b2e;font-size:13px;text-align:right;border-top:1px solid #eef1f5;">${escapeHtml(data.duration)}</td></tr>
            <tr><td style="padding:0 16px 12px;color:#8996a8;font-size:13px;">Amount Due</td><td style="padding:0 16px 12px;font-weight:800;color:#1f5fd6;font-size:15px;text-align:right;">${money(data.finalAmount)}</td></tr>
          </table>

          <div style="background:#fff8ec;border:1.5px dashed #f0b429;border-radius:12px;padding:20px 22px;margin-bottom:22px;">
            <p style="margin:0 0 12px;font-weight:800;color:#8a5a00;font-size:13.5px;letter-spacing:.3px;">💳 NEXT STEP — PAY VIA UPI</p>
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#8996a8;font-size:13px;">UPI ID</td><td style="padding:6px 0;font-weight:800;color:#0d1b2e;font-size:15px;text-align:right;font-family:monospace;">${UPI_ID}</td></tr>
              <tr><td style="padding:6px 0;color:#8996a8;font-size:13px;">Amount</td><td style="padding:6px 0;font-weight:800;color:#0d1b2e;font-size:15px;text-align:right;">${money(data.finalAmount)}</td></tr>
            </table>
          </div>

          <p style="margin:0 0 8px;color:#4b5563;font-size:14px;line-height:1.6;">Once you've paid, <strong style="color:#0d1b2e;">reply directly to this email</strong> with your payment screenshot attached — our team will verify it and move your application forward.</p>
          <p style="margin:0 0 4px;color:#8996a8;font-size:12.5px;">Please keep your Application Number in the reply:</p>
          <p style="margin:0 0 24px;font-size:17px;font-weight:800;color:#1f5fd6;">${escapeHtml(data.applicationId)}</p>

          <p style="margin:0;color:#8996a8;font-size:12.5px;line-height:1.6;">Questions? Just reply to this email — we're happy to help.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px;background:#f8fafc;text-align:center;border-top:1px solid #eef1f5;">
          <p style="margin:0;color:#8996a8;font-size:11.5px;">${BRAND_NAME} · ${BRAND_TAGLINE}</p>
        </td>
      </tr>
    </table>
  </div>`;
  await sendEmail({ to: data.email, replyTo: TEAM_EMAIL, subject: `Application Received — ${data.applicationId} | ${BRAND_NAME}`, html });
}

async function sendTeamApplicationEmail(data: any) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0d1b2e;">NEW INTERNSHIP APPLICATION</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#8996a8;">Application No.</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${escapeHtml(data.applicationId)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Applicant Name</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${escapeHtml(data.fullName)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Email</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${escapeHtml(data.email)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Phone</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${escapeHtml(data.phone)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Internship</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${escapeHtml(data.internshipTitle)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Final Amount</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${money(data.finalAmount)}</td></tr>
      </table>
      <p style="font-weight:bold;color:#0d1b2e;">ACTION REQUIRED:</p>
      <p>Applicant has been instructed to pay to UPI ID <strong>${UPI_ID}</strong> and reply to their confirmation email with the payment screenshot. Update their Payment Status in the Manager Dashboard once verified.</p>
    </div>`;
  await sendEmail({ to: TEAM_EMAIL, subject: `New Internship Application — ${data.applicationId} | ${BRAND_NAME}`, html });
}

async function sendCertificateIssuedEmail(data: any) {
  const qrUrl = buildQrCodeUrl(data.verificationUrl);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0d1b2e;">Congratulations ${escapeHtml(data.fullName)}!</h2>
      <p>You have successfully completed your internship with ${BRAND_NAME}.</p>
      <p><strong>Download Certificate:</strong><br><a href="${data.certificateUrl}">${data.certificateUrl}</a></p>
      <p><strong>Verify Certificate:</strong><br><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
      <img src="${qrUrl}" width="140" height="140" alt="QR code to verify certificate">
    </div>`;
  await sendEmail({
    to: data.email, subject: `Your Internship Certificate is Ready — ${data.credentialId}`, html,
    attachment: data.pdfBase64 ? { filename: `Certificate-${data.credentialId}.pdf`, contentBase64: data.pdfBase64 } : undefined
  });
}

// ============================================================
// ROUTER
// ============================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");
      switch (action) {
        case "getInternships": return jsonSuccess(await getInternships());
        case "verifyCertificate": return jsonSuccess(await verifyCertificate(url.searchParams.get("credentialId") || ""));
        default: return jsonError("Unknown or missing action: " + action);
      }
    }

    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "submitApplication": return jsonSuccess(await submitApplication(body));
      case "validateCoupon": return jsonSuccess(await validateCoupon(body.couponCode, body.duration));
      case "requestCertificate": return jsonSuccess(await requestCertificate(body));
      case "submitContactQuery": return jsonSuccess(await submitContactQuery(body));
      case "managerLogin": return jsonSuccess(await managerLogin(body.email, body.password));

      case "getManagerDashboard": await requireManagerAuth(body.token); return jsonSuccess(await getManagerDashboard());
      case "updateApplicationStatus": await requireManagerAuth(body.token); return jsonSuccess(await updateApplicationStatus(body));
      case "createCoupon": await requireManagerAuth(body.token); return jsonSuccess(await adminCreateCoupon(body));
      case "updateCoupon": await requireManagerAuth(body.token); return jsonSuccess(await adminUpdateCoupon(body));
      case "toggleCouponStatus": await requireManagerAuth(body.token); return jsonSuccess(await adminToggleCouponStatus(body.couponId, body.status));
      case "updateOpeningStatus": await requireManagerAuth(body.token); return jsonSuccess(await updateOpeningStatus(body.openingId, body.status));
      case "approveCertificate": await requireManagerAuth(body.token); return jsonSuccess(await approveCertificate(body));
      case "rejectCertificateRequest": await requireManagerAuth(body.token); return jsonSuccess(await rejectCertificateRequest(body.certificateId, body.notes));
      case "revokeCertificate": await requireManagerAuth(body.token); return jsonSuccess(await revokeCertificate(body.certificateId));
      case "resendCertificateEmail": await requireManagerAuth(body.token); return jsonSuccess(await resendCertificateEmail(body.certificateId));

      default: return jsonError("Unknown action: " + action);
    }
  } catch (err) {
    return jsonError((err as Error).message);
  }
});
