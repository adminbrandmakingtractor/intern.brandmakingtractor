/* ==========================================================================
   intern.brandmakingtractor.com — Shared header/footer, nav, API helper, UI utils
   ========================================================================== */

const NAV_LINKS = [
  { href: "/", label: "Home", id: "home" },
  { href: "internships", label: "Internships", id: "internships" },
  { href: "about", label: "About Us", id: "about" },
  { href: "contact", label: "Contact", id: "contact" },
  { href: "verify-certificate", label: "Verify Certificate", id: "verify" }
];

function renderHeader(active){
  const el = document.getElementById("site-header");
  if(!el) return;
  el.innerHTML = `
    <header class="site-header">
      <div class="nav">
        <a class="nav-logo" href="/">
          <img src="assets/img/logo-icon.png" alt="${BRAND.name}">
        </a>
        <nav class="nav-links" id="navLinks">
          ${NAV_LINKS.map(l => `<a href="${l.href}" class="${active===l.id?'active':''}">${l.label}</a>`).join("")}
          <a href="certificate-request" class="mobile-only-link ${active==='certrequest'?'active':''}">Request Certificate</a>
        </nav>
        <div class="nav-actions">
          <a href="certificate-request" class="btn btn-ghost btn-sm">Request Certificate</a>
          <a href="#" class="btn btn-primary btn-sm" onclick="event.preventDefault(); openApplyModal();">Apply Now</a>
          <button class="nav-toggle" id="navToggle" aria-label="Menu">&#9776;</button>
        </div>
      </div>
    </header>`;
  document.getElementById("navToggle")?.addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
  });
}

function renderFooter(){
  const el = document.getElementById("site-footer");
  if(!el) return;
  const year = new Date().getFullYear();
  el.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <img class="footer-logo" src="assets/img/logo.png" alt="${BRAND.name}">
            <p style="color:rgba(255,255,255,.65);max-width:320px;">1 Week Training + Direct Live Client Project Experience. Choose 4, 6 or 8 weeks — real experience, real work with ${BRAND.name}.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="/">Home</a>
            <a href="internships">Internship Openings</a>
            <a href="about">About Us</a>
            <a href="contact">Contact Us</a>
          </div>
          <div>
            <h4>Programs</h4>
            <a href="internship-detail?id=INT-DA-001">Data Analyst</a>
            <a href="internship-detail?id=INT-PM-001">Performance Marketing</a>
            <a href="internship-detail?id=INT-WD-001">Website Dev (Custom Coded)</a>
            <a href="internship-detail?id=INT-GD-001">Graphic Designing</a>
            <a href="internship-detail?id=INT-CC-001">Content Creation</a>
            <a href="internship-detail?id=INT-WP-001">WordPress Development</a>
            <a href="internship-detail?id=INT-VE-001">Video Editing</a>
          </div>
          <div>
            <h4>Verify &amp; Support</h4>
            <a href="verify-certificate">Verify Certificate</a>
            <a href="certificate-request">Request Certificate</a>
            <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a>
            <a href="privacy-policy">Privacy Policy</a>
          </div>
        </div>
        <div class="footer-social">
          <a href="${BRAND.social.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">Instagram</a>
          <a href="${BRAND.social.linkedin}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LinkedIn</a>
          <a href="${BRAND.social.youtube}" target="_blank" rel="noopener noreferrer" aria-label="YouTube">YouTube</a>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${year} ${BRAND.name}. All rights reserved.</span>
          <span>An initiative by Brand Making Tractor</span>
        </div>
      </div>
    </footer>`;
}

/* ---------------- Mobile bottom tab bar (app-style navigation) ---------------- */
const MOBILE_TABS = [
  {
    id: "home", href: "/", label: "Home",
    icon: `<path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" />`
  },
  {
    id: "internships", href: "internships", label: "Internships",
    icon: `<rect x="4" y="7.5" width="16" height="11.5" rx="1.6" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" /><path d="M4 12.5h16" />`
  },
  {
    id: "apply", href: "#", label: "Apply",
    icon: `<path d="M5 12h11" /><path d="M12 5l7 7-7 7" />`,
    onclick: "event.preventDefault(); openApplyModal();"
  },
  {
    id: "verify", href: "verify-certificate", label: "Verify",
    icon: `<path d="M12 3.5 5 6v6c0 4.2 3 7 7 8.5 4-1.5 7-4.3 7-8.5V6z" /><path d="m9 12 2 2 4-4" />`
  }
];

function renderMobileNav(active){
  if(document.getElementById("mobileNav")) return;
  if(active === "managerlogin" || active === "managerdashboard") return;
  const bar = document.createElement("nav");
  bar.id = "mobileNav";
  bar.className = "mobile-nav";
  bar.innerHTML = MOBILE_TABS.map(t => `
    <a href="${t.href}" class="mobile-nav-tab ${active === t.id ? "active" : ""}" ${t.onclick ? `onclick="${t.onclick}"` : ""}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg>
      <span>${t.label}</span>
    </a>
  `).join("");
  document.body.appendChild(bar);
}

/* ==========================================================================
   GTM conversion tracking — captures UTM params + gclid/fbclid on landing,
   persists them (first-touch) across the whole visit since this is a
   multi-page site, and attaches them to every conversion event pushed to
   GTM's dataLayer so Google Ads / Meta / GA4 can attribute conversions
   back to the original campaign/click.
   ========================================================================== */
const ATTRIBUTION_KEYS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid"];

function captureAttribution(){
  const params = new URLSearchParams(window.location.search);
  const incoming = {};
  ATTRIBUTION_KEYS.forEach(k => { const v = params.get(k); if(v) incoming[k] = v; });

  if(Object.keys(incoming).length){
    // First-touch attribution: once a source is captured, keep it for the
    // rest of the visit even if the user later lands on a page with no params.
    try{
      const existing = JSON.parse(localStorage.getItem("bmt_attribution") || "{}");
      localStorage.setItem("bmt_attribution", JSON.stringify(Object.assign({}, existing, incoming)));
    }catch(e){ /* localStorage unavailable — attribution just won't persist */ }
  }
}

function getAttribution(){
  try{
    return JSON.parse(localStorage.getItem("bmt_attribution") || "{}");
  }catch(e){
    return {};
  }
}

/** Pushes a named event to GTM's dataLayer with the visit's ad-click/UTM attribution attached. */
function pushConversionEvent(eventName, extra = {}){
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: eventName }, getAttribution(), extra));
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page || "";
  captureAttribution();
  renderHeader(page);
  renderFooter();
  renderMobileNav(page);
  renderApplyModal();
  initFadeUp();
  initHeaderShrink();
  initScrollProgress();
  initCountUp();
  initConsentBanner();
});

/* ==========================================================================
   Consent banner — pairs with the Google Consent Mode "default: denied"
   snippet at the top of every page's <head> (must run before GTM loads).
   Analytics/ad tags configured inside GTM (GA4, Google Ads, Meta) read this
   consent state and stay inactive until the visitor accepts.
   ========================================================================== */
const CONSENT_STORAGE_KEY = "bmt_consent_choice"; // "granted" | "denied"

function pushConsentUpdate(state){
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  gtag("consent", "update", {
    ad_storage: state,
    analytics_storage: state,
    ad_user_data: state,
    ad_personalization: state
  });
}

function initConsentBanner(){
  let stored;
  try{ stored = localStorage.getItem(CONSENT_STORAGE_KEY); }catch(e){ stored = null; }

  if(stored === "granted" || stored === "denied"){
    pushConsentUpdate(stored);
    return;
  }
  if(document.getElementById("consentBanner")) return;

  const bar = document.createElement("div");
  bar.id = "consentBanner";
  bar.className = "consent-banner";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Cookie consent");
  bar.innerHTML = `
    <p>We use cookies for analytics and to measure how visitors find this site. See our <a href="privacy-policy">Privacy Policy</a>.</p>
    <div class="consent-actions">
      <button type="button" class="btn btn-ghost btn-sm" id="consentReject">Reject Non-Essential</button>
      <button type="button" class="btn btn-primary btn-sm" id="consentAccept">Accept</button>
    </div>`;
  document.body.appendChild(bar);

  const setChoice = (state) => {
    try{ localStorage.setItem(CONSENT_STORAGE_KEY, state); }catch(e){ /* localStorage unavailable — choice just won't persist */ }
    pushConsentUpdate(state);
    bar.remove();
  };
  document.getElementById("consentAccept").addEventListener("click", () => setChoice("granted"));
  document.getElementById("consentReject").addEventListener("click", () => setChoice("denied"));
}

/* ---------------- Scroll reveal (staggered) ---------------- */
function initFadeUp(){
  const items = document.querySelectorAll(".fade-up");
  if(!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        // Stagger siblings that reveal together so cards/steps cascade in.
        const siblings = Array.from(e.target.parentElement.children).filter(c => c.classList.contains("fade-up"));
        const i = siblings.indexOf(e.target);
        e.target.style.transitionDelay = `${Math.min(i, 8) * 70}ms`;
        e.target.classList.add("in");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(i => obs.observe(i));
}

/* Re-run for content injected after the initial DOMContentLoaded pass
   (card grids rendered from JS on home/internships pages). */
function refreshFadeUp(){ initFadeUp(); }

/* ---------------- Header shrink-on-scroll ---------------- */
function initHeaderShrink(){
  const header = document.querySelector(".site-header");
  if(!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
  document.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
}

/* ---------------- Top scroll progress bar ---------------- */
function initScrollProgress(){
  const bar = document.createElement("div");
  bar.id = "scrollProgress";
  document.body.appendChild(bar);
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    bar.style.width = height > 0 ? `${(scrolled / height) * 100}%` : "0%";
  };
  document.addEventListener("scroll", onScroll, { passive:true });
  onScroll();
}

/* ---------------- Animated count-up numbers ----------------
   Usage: <b class="count-up" data-count-to="7">0</b>
------------------------------------------------------------- */
function initCountUp(){
  const els = document.querySelectorAll("[data-count-to]");
  if(!els.length) return;
  const animate = (el) => {
    const target = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.countSuffix || "";
    const duration = 900;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if(p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ animate(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach(el => obs.observe(el));
}

/* ---------------- API helper (Supabase Edge Function) ---------------- */
async function apiCall(action, payload = {}){
  if(!SUPABASE_FUNCTION_URL){
    return { success:false, error:"Backend not connected yet." };
  }
  try{
    const res = await fetch(SUPABASE_FUNCTION_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization": "Bearer " + SUPABASE_ANON_KEY },
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  }catch(err){
    return { success:false, error: "Network error: " + err.message };
  }
}

async function apiGet(action, params = {}){
  if(!SUPABASE_FUNCTION_URL){
    return { success:false, error:"Backend not connected yet." };
  }
  try{
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${SUPABASE_FUNCTION_URL}?${qs}`, { method:"GET", headers:{ "Authorization": "Bearer " + SUPABASE_ANON_KEY } });
    return await res.json();
  }catch(err){
    return { success:false, error: "Network error: " + err.message };
  }
}

/* ---------------- Small UI helpers ---------------- */
function showMsg(el, type, text){
  if(!el) return;
  el.className = "form-msg show " + type;
  el.textContent = text;
  el.scrollIntoView({ behavior:"smooth", block:"center" });
}

function setBtnLoading(btn, loading, labelWhenLoading = "Please wait"){
  if(!btn) return;
  if(loading){
    btn.dataset.originalLabel = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${labelWhenLoading}`;
    btn.disabled = true;
  }else{
    btn.innerHTML = btn.dataset.originalLabel || btn.innerHTML;
    btn.disabled = false;
  }
}

function qs(name){
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(d){
  if(!d) return "—";
  const date = (d instanceof Date) ? d : new Date(d);
  if(isNaN(date)) return d;
  return date.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

/**
 * The single canonical "Choose Your Internship Duration" block — used on
 * internship-detail and apply pages so the duration/fee table and the
 * training-vs-live-project explanation are worded identically everywhere.
 */
function renderDurationStructureBlock(){
  return `
    <h2 style="margin-bottom:6px;">Choose Your Internship Duration</h2>
    <p style="margin-bottom:18px;">Every duration follows the same learning structure: <strong>1 Week Structured Training → Directly into Live Client Project.</strong></p>
    <div class="table-wrap" style="margin-bottom:22px;">
      <table class="data-table">
        <thead><tr><th>Duration</th><th>Fee</th><th>Structure</th></tr></thead>
        <tbody>
          ${DURATIONS.map(d => {
            const s = getDurationStructure(d.weeks);
            return `<tr><td><strong>${s.weeks} Weeks</strong></td><td>₹${d.fee.toLocaleString("en-IN")}</td><td>${s.label}</td></tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
    <h3 style="font-size:16px;margin-bottom:10px;">Important Structure</h3>
    <ul>
      <li><strong>Week 1 → Structured Training.</strong> Learn the required tools, fundamentals, workflows and practical skills for your selected internship track.</li>
      <li><strong>Remaining Weeks → Live Client Project.</strong> Immediately after training, you move directly into a real, live client project and work under supervision.</li>
    </ul>
    <p style="font-size:13px;color:var(--gray-500);margin-top:6px;">There is no separate training period for longer durations — only the live-project portion grows: 4 Weeks = 1 Week Training + 3 Weeks Live Project · 6 Weeks = 1 Week Training + 5 Weeks Live Project · 8 Weeks = 1 Week Training + 7 Weeks Live Project.</p>
  `;
}

/** Compact chip row for cards — e.g. "4–8 Weeks · From ₹1,500 · 1 Week Training + Live Project". */
function renderDurationChipRow(){
  const minFee = Math.min(...DURATIONS.map(d => d.fee));
  const minW = Math.min(...DURATIONS.map(d => d.weeks));
  const maxW = Math.max(...DURATIONS.map(d => d.weeks));
  return `
    <span class="duration-chip">${minW}–${maxW} Weeks</span>
    <span class="duration-chip">From ₹${minFee.toLocaleString("en-IN")}</span>
    <span class="duration-chip total">1 Week Training + Live Project</span>
  `;
}

/** Escapes user-submitted text before it goes into innerHTML (applicant names, notes, coupon codes, etc.). */
function escapeHtml(str){
  if(str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusBadgeClass(status){
  switch((status||"").toLowerCase()){
    case "open": return "badge-open";
    case "closing soon": return "badge-closing";
    case "closed": return "badge-closed";
    default: return "badge-navy";
  }
}

/* ==========================================================================
   Apply Modal — one popup form used site-wide (header, internship cards,
   detail pages) so applying never navigates away from the page you're on
   and the URL never changes. Mirrors apply.html's form/logic exactly, just
   scoped to "am"-prefixed element IDs so it can be injected on every page.
   ========================================================================== */
let amSelectedDuration = null;
let amAppliedCoupon = null;

function renderApplyModal(){
  if(document.getElementById("applyModalOverlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "applyModalOverlay";
  overlay.innerHTML = `
    <div class="modal-card" style="max-width:760px;position:relative;">
      <button class="modal-close" type="button" id="amCloseBtn">&times;</button>

      <form id="amApplyForm">
        <h3 style="margin-bottom:2px;">Apply for an Internship</h3>
        <p style="font-size:13.5px;color:var(--gray-500);margin-bottom:18px;">Choose your internship, pick a duration, and apply a coupon if you have one.</p>
        <div id="amFormMsg" class="form-msg"></div>
        <div class="field hp-field" aria-hidden="true"><label for="amWebsite">Leave blank</label><input type="text" id="amWebsite" name="website" tabindex="-1" autocomplete="off"></div>

        <div class="field full">
          <label>Selected Internship <span class="req">*</span></label>
          <select id="amSelectedInternship" required></select>
        </div>

        <h3 style="margin:10px 0 4px;">Choose Your Internship Duration <span class="req">*</span></h3>
        <div class="duration-grid" id="amDurationGrid"></div>
        <div id="amDurationStructureNote" style="display:none;background:var(--green-pale);border-radius:10px;padding:12px 16px;margin-bottom:22px;font-size:13.5px;font-weight:600;color:var(--green);"></div>

        <h3 style="margin-bottom:16px;">Personal Details</h3>
        <div class="form-grid">
          <div class="field"><label>Full Name <span class="req">*</span></label><input type="text" id="amFullName" autocomplete="name" required></div>
          <div class="field"><label>Email <span class="req">*</span></label><input type="email" id="amEmail" autocomplete="email" required></div>
          <div class="field"><label>Phone <span class="req">*</span></label><input type="tel" id="amPhone" autocomplete="tel" required></div>
          <div class="field"><label>City <span class="req">*</span></label><input type="text" id="amCity" autocomplete="address-level2" required></div>
        </div>

        <h3 style="margin:10px 0 16px;">Education</h3>
        <div class="form-grid">
          <div class="field"><label>College / University <span class="req">*</span></label><input type="text" id="amCollege" required></div>
          <div class="field"><label>Course / Degree <span class="req">*</span></label><input type="text" id="amCourse" required></div>
          <div class="field"><label>Year / Semester <span class="req">*</span></label><input type="text" id="amYear" placeholder="e.g. 3rd Year / 6th Semester" required></div>
          <div class="field"><label>Availability <span class="req">*</span></label>
            <select id="amAvailability" required>
              <option value="">Select availability</option>
              <option>Immediately</option>
              <option>Within 1 Week</option>
              <option>Within 2 Weeks</option>
              <option>Within 1 Month</option>
            </select>
          </div>
        </div>

        <h3 style="margin:10px 0 16px;">Skills &amp; Portfolio</h3>
        <div class="form-grid">
          <div class="field full"><label>Skills <span class="req">*</span></label><input type="text" id="amSkills" placeholder="Comma separated, e.g. Excel, Canva, HTML" required></div>
          <div class="field"><label>Portfolio URL</label><input type="url" id="amPortfolioUrl" autocomplete="url" placeholder="https://..."></div>
          <div class="field"><label>LinkedIn URL</label><input type="url" id="amLinkedinUrl" autocomplete="url" placeholder="https://linkedin.com/in/..."></div>
          <div class="field full"><label>Resume Link</label>
            <input type="url" id="amResumeUrl" autocomplete="url" placeholder="https://drive.google.com/... (shareable link)">
            <small>Upload your resume to Google Drive / Dropbox, set sharing to "Anyone with the link", and paste the URL here.</small>
          </div>
        </div>

        <h3 style="margin:10px 0 16px;">A Little About You</h3>
        <div class="field full">
          <label>Why do you want to join this internship? <span class="req">*</span></label>
          <textarea id="amWhyJoin" required placeholder="Tell us in a few sentences..."></textarea>
        </div>

        <div class="coupon-box">
          <h3 style="margin-bottom:10px;">Have a Coupon Code?</h3>
          <div class="coupon-row">
            <input type="text" id="amCouponCode" placeholder="Enter Coupon Code" style="text-transform:uppercase;">
            <button type="button" class="btn btn-secondary" id="amApplyCouponBtn">Apply Coupon</button>
          </div>
          <div id="amCouponMsg" class="coupon-msg"></div>
        </div>

        <div class="summary-box" id="amSummaryBox" style="display:none;">
          <h3>Application Summary</h3>
          <div class="summary-row"><span>Name</span><span id="amSumName">—</span></div>
          <div class="summary-row"><span>Internship</span><span id="amSumInternship">—</span></div>
          <div class="summary-row"><span>Duration</span><span id="amSumDuration">—</span></div>
          <div class="summary-row"><span>Structure</span><span id="amSumStructure">—</span></div>
          <div class="summary-row"><span>Original Fee</span><span id="amSumOriginal">—</span></div>
          <div class="summary-row"><span>Coupon</span><span id="amSumCoupon">None</span></div>
          <div class="summary-row discount"><span>Discount</span><span id="amSumDiscountPct">0%</span></div>
          <div class="summary-row discount"><span>Discount Amount</span><span id="amSumDiscountAmt">₹0</span></div>
          <div class="summary-row total"><span>FINAL AMOUNT</span><span id="amSumFinal">₹0</span></div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" id="amSubmitBtn" style="margin-top:10px;">Submit Application</button>
        <p style="text-align:center;font-size:12.5px;color:var(--gray-500);margin-top:14px;">By submitting, you agree to be contacted by ${BRAND.name} regarding this application.</p>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  // ---- Populate internship dropdown ----
  const sel = document.getElementById("amSelectedInternship");
  sel.innerHTML = `<option value="">Select an internship</option>` +
    INTERNSHIPS.map(i => `<option value="${i.Opening_ID}">${escapeHtml(i.Title)}</option>`).join("");
  sel.addEventListener("change", amUpdateSummary);

  // ---- Duration options ----
  const grid = document.getElementById("amDurationGrid");
  grid.innerHTML = DURATIONS.map(d => {
    const s = getDurationStructure(d.weeks);
    return `
    <label class="duration-option" data-weeks="${d.weeks}">
      <input type="radio" name="amDuration" value="${d.weeks}">
      <div class="weeks">${d.weeks} Weeks</div>
      <div class="fee">₹${d.fee.toLocaleString("en-IN")}</div>
      <div style="font-size:11.5px;color:var(--gray-500);margin-top:6px;">1 Wk Training + ${s.liveWeeks} Wks Live Project</div>
    </label>`;
  }).join("");

  grid.querySelectorAll(".duration-option").forEach(opt => {
    opt.addEventListener("click", () => {
      const weeks = Number(opt.dataset.weeks);
      amSelectedDuration = DURATIONS.find(d => d.weeks === weeks);
      grid.querySelectorAll(".duration-option").forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      opt.querySelector("input").checked = true;

      const structureNote = document.getElementById("amDurationStructureNote");
      const s = getDurationStructure(weeks);
      structureNote.style.display = "block";
      structureNote.textContent = `✅ You selected ${weeks} Weeks = ${s.label}.`;

      if(amAppliedCoupon){
        amAppliedCoupon = null;
        document.getElementById("amCouponMsg").className = "coupon-msg";
        document.getElementById("amCouponMsg").textContent = "Duration changed — please re-apply your coupon.";
      }
      amUpdateSummary();
    });
  });

  document.getElementById("amApplyCouponBtn").addEventListener("click", async () => {
    const codeInput = document.getElementById("amCouponCode");
    const msgEl = document.getElementById("amCouponMsg");
    const code = codeInput.value.trim();

    if(!amSelectedDuration){
      msgEl.className = "coupon-msg error";
      msgEl.textContent = "Please choose an internship duration first.";
      return;
    }
    if(!code){
      msgEl.className = "coupon-msg error";
      msgEl.textContent = "Please enter a coupon code.";
      return;
    }

    const btn = document.getElementById("amApplyCouponBtn");
    setBtnLoading(btn, true, "Checking...");
    const res = await apiCall("validateCoupon", { couponCode: code, duration: amSelectedDuration.weeks });
    setBtnLoading(btn, false);

    if(res.success && res.data && res.data.valid){
      amAppliedCoupon = res.data;
      msgEl.className = "coupon-msg success";
      msgEl.textContent = `Coupon "${res.data.code}" applied — ${res.data.discountPercentage}% off!`;
    }else{
      amAppliedCoupon = null;
      msgEl.className = "coupon-msg error";
      msgEl.textContent = res.error || "Invalid or expired coupon code.";
    }
    amUpdateSummary();
  });

  document.getElementById("amFullName").addEventListener("input", amUpdateSummary);

  document.getElementById("amApplyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("amFormMsg");
    const btn = document.getElementById("amSubmitBtn");
    const internship = getInternshipById(document.getElementById("amSelectedInternship").value);

    // Honeypot: real visitors never see or fill this field — a filled value means a bot.
    if(document.getElementById("amWebsite").value.trim()){
      return;
    }

    if(!internship){
      showMsg(msg, "error", "Please select an internship.");
      return;
    }
    if(!amSelectedDuration){
      showMsg(msg, "error", "Please choose an internship duration.");
      return;
    }

    const payload = {
      fullName: document.getElementById("amFullName").value.trim(),
      email: document.getElementById("amEmail").value.trim(),
      phone: document.getElementById("amPhone").value.trim(),
      city: document.getElementById("amCity").value.trim(),
      college: document.getElementById("amCollege").value.trim(),
      course: document.getElementById("amCourse").value.trim(),
      year: document.getElementById("amYear").value.trim(),
      selectedInternshipId: internship.Opening_ID,
      duration: amSelectedDuration.weeks,
      skills: document.getElementById("amSkills").value.trim(),
      portfolioUrl: document.getElementById("amPortfolioUrl").value.trim(),
      linkedinUrl: document.getElementById("amLinkedinUrl").value.trim(),
      resumeUrl: document.getElementById("amResumeUrl").value.trim(),
      whyJoin: document.getElementById("amWhyJoin").value.trim(),
      availability: document.getElementById("amAvailability").value,
      couponCode: amAppliedCoupon ? amAppliedCoupon.code : ""
    };

    setBtnLoading(btn, true, "Submitting...");
    msg.className = "form-msg";

    const res = await apiCall("submitApplication", payload);

    setBtnLoading(btn, false);

    if(res.success){
      pushConversionEvent("application_submitted", {
        application_id: res.data.applicationId,
        internship_id: internship.Opening_ID,
        internship_title: internship.Title,
        duration_weeks: amSelectedDuration.weeks,
        coupon_code: amAppliedCoupon ? amAppliedCoupon.code : "",
        value: res.data.finalAmount,
        currency: "INR"
      });
      // Redirect to a dedicated Thank You URL (not just an inline panel) so ad
      // platforms (Google Ads / Meta) can use a simple "visited this URL"
      // conversion trigger instead of needing custom dataLayer event triggers.
      window.location.href = `thank-you?applicationId=${encodeURIComponent(res.data.applicationId)}&amount=${encodeURIComponent(res.data.finalAmount)}`;
      return;
    }else{
      showMsg(msg, "error", res.error || "Something went wrong. Please try again.");
    }
  });

  document.getElementById("amCloseBtn").addEventListener("click", closeApplyModal);
  overlay.addEventListener("click", (e) => { if(e.target === overlay) closeApplyModal(); });
}

function amUpdateSummary(){
  const box = document.getElementById("amSummaryBox");
  const internship = getInternshipById(document.getElementById("amSelectedInternship").value);

  if(!amSelectedDuration){
    box.style.display = "none";
    return;
  }
  box.style.display = "block";

  const originalFee = amSelectedDuration.fee;
  const discountPercentage = amAppliedCoupon ? amAppliedCoupon.discountPercentage : 0;
  const discountAmount = amAppliedCoupon ? amAppliedCoupon.discountAmount : 0;
  const finalAmount = amAppliedCoupon ? amAppliedCoupon.finalAmount : originalFee;

  document.getElementById("amSumStructure").textContent = getDurationStructure(amSelectedDuration.weeks).label;
  document.getElementById("amSumName").textContent = document.getElementById("amFullName").value.trim() || "—";
  document.getElementById("amSumInternship").textContent = internship ? internship.Title : "—";
  document.getElementById("amSumDuration").textContent = `${amSelectedDuration.weeks} Weeks`;
  document.getElementById("amSumOriginal").textContent = `₹${originalFee.toLocaleString("en-IN")}`;
  document.getElementById("amSumCoupon").textContent = amAppliedCoupon ? amAppliedCoupon.code : "None";
  document.getElementById("amSumDiscountPct").textContent = `${discountPercentage}%`;
  document.getElementById("amSumDiscountAmt").textContent = `₹${discountAmount.toLocaleString("en-IN")}`;
  const finalEl = document.getElementById("amSumFinal");
  const newFinalText = `₹${finalAmount.toLocaleString("en-IN")}`;
  if(finalEl.textContent !== newFinalText){
    finalEl.textContent = newFinalText;
    finalEl.classList.remove("pulse-update");
    void finalEl.offsetWidth;
    finalEl.classList.add("pulse-update");
  }
}

/** Opens the site-wide Apply popup, optionally preselecting one internship (e.g. from a card's "Apply Now"). */
function openApplyModal(internshipId){
  renderApplyModal();
  pushConversionEvent("apply_click", internshipId ? { internship_id: internshipId } : {});

  // Reset to a clean form every time it opens.
  amSelectedDuration = null;
  amAppliedCoupon = null;
  document.getElementById("amApplyForm").reset();
  document.getElementById("amApplyForm").style.display = "block";
  document.getElementById("amFormMsg").className = "form-msg";
  document.getElementById("amCouponMsg").className = "coupon-msg";
  document.getElementById("amCouponMsg").textContent = "";
  document.getElementById("amDurationStructureNote").style.display = "none";
  document.getElementById("amSummaryBox").style.display = "none";
  document.querySelectorAll("#amDurationGrid .duration-option").forEach(o => o.classList.remove("selected"));

  if(internshipId && getInternshipById(internshipId)){
    document.getElementById("amSelectedInternship").value = internshipId;
  }

  document.getElementById("applyModalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeApplyModal(){
  const overlay = document.getElementById("applyModalOverlay");
  if(!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}
