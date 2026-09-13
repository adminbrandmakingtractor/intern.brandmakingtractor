/**
 * Manager authentication (session tokens held in CacheService — no
 * external auth provider needed) and the dashboard data aggregator.
 */

function managerLogin_(email, password){
  if(!email || !password) throw new Error("Email and password are required.");

  const sheet = getSheet_(SHEET_NAMES.MANAGERS);
  const manager = sheetToObjects_(sheet).find(m => String(m.Email).toLowerCase() === String(email).toLowerCase());
  if(!manager){
    throw new Error("Invalid email or password.");
  }
  if(hashPassword_(password) !== manager.Password_Hash){
    throw new Error("Invalid email or password.");
  }

  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  cache.put("session_" + token, JSON.stringify({ email: manager.Email, name: manager.Name, managerId: manager.Manager_ID }), MANAGER_SESSION_TTL_SECONDS);

  return { token, name: manager.Name, email: manager.Email };
}

/** Throws if the token is missing/expired. Returns the session object otherwise. */
function requireManagerAuth_(token){
  if(!token) throw new Error("UNAUTHORIZED");
  const cache = CacheService.getScriptCache();
  const raw = cache.get("session_" + token);
  if(!raw) throw new Error("SESSION_EXPIRED");
  return JSON.parse(raw);
}

function getManagerDashboard_(){
  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const appSheet = getSheet_(SHEET_NAMES.APPLICATIONS);
  const openingsSheet = getSheet_(SHEET_NAMES.OPENINGS);

  const applications = sheetToObjects_(appSheet)
    .sort((a,b) => new Date(b.Timestamp) - new Date(a.Timestamp));

  const certificateRequests = sheetToObjects_(certSheet)
    .sort((a,b) => new Date(b.Requested_Date) - new Date(a.Requested_Date))
    .map(c => {
      const app = applications.find(a => a.Application_ID === c.Application_ID) || {};
      return Object.assign({}, c, {
        Training_Completed: ["Live Project","Completed","Certificate Requested","Certificate Approved"].indexOf(app.Application_Status) !== -1,
        Live_Project_Completed: ["Completed","Certificate Requested","Certificate Approved"].indexOf(app.Application_Status) !== -1
      });
    });

  const coupons = adminListCoupons_();

  const openings = sheetToObjects_(openingsSheet).map(o => ({
    Opening_ID: o.Opening_ID,
    Title: o.Title,
    Department: o.Department,
    Openings: o.Openings,
    Status: o.Status
  }));

  const stats = {
    pendingCertificates: certificateRequests.filter(c => c.Status === "Pending").length,
    issuedCertificates: certificateRequests.filter(c => c.Status === "Approved").length,
    totalApplications: applications.length,
    paymentPending: applications.filter(a => a.Payment_Status === "Payment Pending").length,
    paymentVerified: applications.filter(a => a.Payment_Status === "Payment Verified").length,
    openSlots: openings.filter(o => o.Status === "Open").reduce((sum,o) => sum + (Number(o.Openings) || 0), 0)
  };

  return { applications, certificateRequests, coupons, openings, stats };
}

function updateApplicationStatus_(body){
  if(!body.applicationId) throw new Error("Missing applicationId.");
  const appSheet = getSheet_(SHEET_NAMES.APPLICATIONS);
  const rowIdx = findRowIndexByValue_(appSheet, "Application_ID", body.applicationId);
  if(rowIdx === -1) throw new Error("Application not found.");

  const updates = {};
  if(body.applicationStatus !== undefined) updates.Application_Status = body.applicationStatus;
  if(body.paymentStatus !== undefined) updates.Payment_Status = body.paymentStatus;
  if(body.paymentProofStatus !== undefined) updates.Payment_Proof_Status = body.paymentProofStatus;
  if(body.managerNotes !== undefined) updates.Manager_Notes = body.managerNotes;
  if(body.startDate !== undefined) updates.Start_Date = body.startDate;
  if(body.completionDate !== undefined) updates.Completion_Date = body.completionDate;

  updateRowByColumns_(appSheet, rowIdx, updates);
  return { applicationId: body.applicationId, updated: true };
}
