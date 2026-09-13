/**
 * Shared helpers: sheet <-> object mapping, ID generation, JSON responses, locking.
 */

function jsonSuccess_(data){
  return ContentService.createTextOutput(JSON.stringify({ success:true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(message){
  return ContentService.createTextOutput(JSON.stringify({ success:false, error: String(message) }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Reads a sheet into an array of objects keyed by the header row. */
function sheetToObjects_(sheet){
  const values = sheet.getDataRange().getValues();
  if(values.length < 2) return [];
  const headers = values[0];
  const rows = values.slice(1);
  return rows
    .filter(r => r.some(cell => cell !== "" && cell !== null))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i]);
      return obj;
    });
}

/** Finds the 1-based row index (including header) for the first row where column `key` equals `value`. Returns -1 if not found. */
function findRowIndexByValue_(sheet, columnName, value){
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const colIdx = headers.indexOf(columnName);
  if(colIdx === -1) return -1;
  for(let i = 1; i < values.length; i++){
    if(String(values[i][colIdx]) === String(value)) return i + 1; // 1-based, includes header offset
  }
  return -1;
}

function getHeaders_(sheet){
  return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
}

/** Appends an object as a row, mapping keys to the sheet's existing header order. Missing keys become "". */
function appendRowFromObject_(sheet, obj){
  const headers = getHeaders_(sheet);
  const row = headers.map(h => (obj[h] !== undefined && obj[h] !== null) ? obj[h] : "");
  sheet.appendRow(row);
}

/** Updates specific columns on a given 1-based row index using a {columnName: value} map. */
function updateRowByColumns_(sheet, rowIndex, updates){
  const headers = getHeaders_(sheet);
  Object.keys(updates).forEach(col => {
    const colIdx = headers.indexOf(col);
    if(colIdx !== -1){
      sheet.getRange(rowIndex, colIdx + 1).setValue(updates[col]);
    }
  });
}

/** Generates BMT-INT-{year}-{0001} style sequential IDs, safe against concurrent writers. */
function generateSequentialId_(prefix, sheet, idColumnName, padLength){
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try{
    const year = new Date().getFullYear();
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const colIdx = headers.indexOf(idColumnName);
    let maxSeq = 0;
    const yearPrefix = `${prefix}-${year}-`;
    for(let i = 1; i < values.length; i++){
      const val = String(values[i][colIdx] || "");
      if(val.indexOf(yearPrefix) === 0){
        const seq = parseInt(val.substring(yearPrefix.length), 10);
        if(!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    }
    const next = String(maxSeq + 1).padStart(padLength, "0");
    return `${yearPrefix}${next}`;
  } finally {
    lock.releaseLock();
  }
}

function formatDateISO_(date){
  if(!date) return "";
  const d = (date instanceof Date) ? date : new Date(date);
  if(isNaN(d)) return "";
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "Etc/UTC", "yyyy-MM-dd");
}

function addYears_(date, years){
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function hashPassword_(password){
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2,"0")).join("");
}

function buildVerificationUrl_(credentialId){
  const base = (typeof SITE_BASE_URL === "string" && SITE_BASE_URL.indexOf("YOUR-DOMAIN") === -1)
    ? SITE_BASE_URL.replace(/\/$/, "")
    : "";
  return `${base}/verify-certificate?credentialId=${encodeURIComponent(credentialId)}`;
}

function buildQrCodeUrl_(data){
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

/**
 * Turns a stored duration string (e.g. "4 Weeks") into the precise
 * "1 Week Training + N Weeks Live Client Project" line. Every duration is
 * always 1 week of training followed directly by the live client project —
 * only the live-project length changes with the chosen duration.
 */
function structureLineFromDuration_(durationStr){
  const totalWeeks = parseInt(String(durationStr).replace(/[^0-9]/g, ""), 10);
  if(!totalWeeks || totalWeeks <= 1) return "1 Week Training + Direct Live Client Project Experience";
  const liveWeeks = totalWeeks - 1;
  return `1 Week Training + ${liveWeeks} Week${liveWeeks === 1 ? "" : "s"} Live Client Project`;
}

/** Midnight-normalized Date, so date-only comparisons ignore time-of-day. */
function dateOnly_(value){
  const d = (value instanceof Date) ? new Date(value) : new Date(value);
  d.setHours(0,0,0,0);
  return d;
}
