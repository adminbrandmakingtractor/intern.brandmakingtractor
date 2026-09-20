/**
 * intern.brandmakingtractor — Backend Config
 *
 * Set up:
 * 1. Create a Google Sheet (any name), open Extensions > Apps Script.
 * 2. Paste each .gs file from /apps-script into a matching script file.
 * 3. Run `setupSheets()` once from the Apps Script editor (Setup.gs) to
 *    create all tabs, headers, and seed the 7 internship openings, 3
 *    starter coupons, and a default manager account.
 * 4. Deploy > New deployment > Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the /exec URL into assets/js/config.js -> APPS_SCRIPT_URL.
 */

const SHEET_NAMES = {
  OPENINGS: "Internship_Openings",
  APPLICATIONS: "Applications",
  CERTIFICATES: "Certificates",
  COUPONS: "Coupons",
  MANAGERS: "Managers",
  CONTACT: "Contact_Queries",
  EMAIL_QUEUE: "Email_Queue"
};

const BRAND_NAME = "intern.brandmakingtractor";
const BRAND_TAGLINE = "LEARN • CREATE • GROW";

// Where new-application + payment-proof notifications go. Keep this in
// sync with assets/js/config.js -> BRAND.teamEmail (shown to applicants).
const TEAM_EMAIL = "internships@brandmakingtractor.com";

// UPI ID applicants pay the internship fee to. Shown on the confirmation
// email; applicants reply to that email with their payment screenshot.
const UPI_ID = "ramprasath03052004@okicici";

// Authoritative fee table — NEVER trust a fee/amount sent from the browser.
// Every price shown on the site must always be recomputed from this map.
const DURATION_FEES = {
  4: 1500,
  6: 2000,
  8: 3000
};

// Used to build the public verification link embedded in certificates/emails.
// Set this to wherever the site is hosted (GitHub Pages, Netlify, etc).
// Falls back to a relative reference if left blank.
const SITE_BASE_URL = "https://YOUR-DOMAIN-OR-HOSTING-URL/"; // e.g. https://internbrandmakingtractor.netlify.app/

// Certificate validity window, in years, from issue date.
const CERTIFICATE_VALID_YEARS = 2;

// Session token lifetime for manager logins (seconds). Max allowed by CacheService is 21600 (6 hrs).
const MANAGER_SESSION_TTL_SECONDS = 21600;

function getSpreadsheet_(){
  // Container-bound script: this just works.
  // If instead you're using a standalone script, set SPREADSHEET_ID
  // in Script Properties (Project Settings > Script Properties) and
  // this will pick it up automatically.
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("SPREADSHEET_ID");
  if(id){
    return SpreadsheetApp.openById(id);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name){
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(name);
  if(!sheet){
    throw new Error(`Sheet "${name}" not found. Run setupSheets() first.`);
  }
  return sheet;
}
