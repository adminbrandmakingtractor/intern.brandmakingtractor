/**
 * Certificate requests, admin approval/generation, and public verification.
 */

function internIdFromApplicationId_(applicationId){
  return String(applicationId).replace("BMT-APP-", "BMT-INT-");
}

function requestCertificate_(body){
  const required = ["fullName","email","applicationId"];
  required.forEach(f => {
    if(!body[f] || String(body[f]).trim() === "") throw new Error(`Missing required field: ${f}`);
  });

  const appSheet = getSheet_(SHEET_NAMES.APPLICATIONS);
  const appRowIdx = findRowIndexByValue_(appSheet, "Application_ID", body.applicationId);
  if(appRowIdx === -1){
    throw new Error("We couldn't find that Application Number. Please double-check and try again.");
  }
  const appRow = sheetToObjects_(appSheet).find(a => a.Application_ID === body.applicationId);
  if(String(appRow.Email).toLowerCase() !== String(body.email).toLowerCase()){
    throw new Error("That email doesn't match the one used for this application.");
  }

  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const existing = sheetToObjects_(certSheet).find(c => c.Application_ID === body.applicationId);
  if(existing){
    if(existing.Status === "Approved"){
      throw new Error("A certificate has already been issued for this application.");
    }
    if(existing.Status === "Pending"){
      throw new Error("A certificate request for this application is already pending review.");
    }
  }

  const certificateId = generateSequentialId_("CERTREQ", certSheet, "Certificate_ID", 6);
  const internId = internIdFromApplicationId_(body.applicationId);

  appendRowFromObject_(certSheet, {
    Certificate_ID: certificateId,
    Credential_ID: "",
    Application_ID: body.applicationId,
    Intern_ID: internId,
    Full_Name: appRow.Full_Name,
    Email: appRow.Email,
    Internship_Role: appRow.Internship_Role,
    Duration: appRow.Duration,
    Start_Date: appRow.Start_Date || "",
    Completion_Date: appRow.Completion_Date || "",
    Certificate_Issue_Date: "",
    Certificate_Valid_Until: "",
    Status: "Pending",
    Approved_By: "",
    Approval_Date: "",
    Certificate_URL: "",
    Verification_URL: "",
    Requested_Date: new Date(),
    Request_Notes: body.notes || ""
  });

  updateRowByColumns_(appSheet, appRowIdx, { Application_Status: "Certificate Requested" });

  return { certificateId, applicationId: body.applicationId, status: "Pending" };
}

function approveCertificate_(body){
  const required = ["certificateId","startDate","completionDate"];
  required.forEach(f => { if(!body[f]) throw new Error(`Missing required field: ${f}`); });

  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const rowIdx = findRowIndexByValue_(certSheet, "Certificate_ID", body.certificateId);
  if(rowIdx === -1) throw new Error("Certificate request not found.");

  const record = sheetToObjects_(certSheet).find(c => c.Certificate_ID === body.certificateId);
  if(record.Status === "Approved"){
    throw new Error("This certificate has already been issued.");
  }

  const credentialId = generateSequentialId_("BMT-CRED", certSheet, "Credential_ID", 6);
  const issueDate = new Date();
  const validUntil = addYears_(issueDate, CERTIFICATE_VALID_YEARS);
  const verificationUrl = buildVerificationUrl_(credentialId);
  const approvedBy = body.approvedBy || "Program Manager";
  const approvalDate = new Date();

  const pdfResult = generateCertificatePdf_({
    fullName: record.Full_Name,
    internshipTitle: record.Internship_Role,
    duration: record.Duration,
    credentialId,
    startDate: body.startDate,
    completionDate: body.completionDate,
    issueDate,
    validUntil,
    approvedBy,
    verificationUrl
  });

  updateRowByColumns_(certSheet, rowIdx, {
    Status: "Approved",
    Credential_ID: credentialId,
    Start_Date: body.startDate,
    Completion_Date: body.completionDate,
    Certificate_Issue_Date: issueDate,
    Certificate_Valid_Until: validUntil,
    Approved_By: approvedBy,
    Approval_Date: approvalDate,
    Certificate_URL: pdfResult.url,
    Verification_URL: verificationUrl
  });

  // Reflect completion back on the application record.
  const appSheet = getSheet_(SHEET_NAMES.APPLICATIONS);
  const appRowIdx = findRowIndexByValue_(appSheet, "Application_ID", record.Application_ID);
  if(appRowIdx !== -1){
    updateRowByColumns_(appSheet, appRowIdx, {
      Application_Status: "Certificate Approved",
      Start_Date: body.startDate,
      Completion_Date: body.completionDate
    });
  }

  sendCertificateIssuedEmail_({
    email: record.Email,
    fullName: record.Full_Name,
    internshipTitle: record.Internship_Role,
    duration: record.Duration,
    credentialId,
    startDate: body.startDate,
    completionDate: body.completionDate,
    issueDate,
    validUntil,
    approvedBy,
    verificationUrl,
    certificateUrl: pdfResult.url,
    pdfBlob: pdfResult.blob
  });

  return { credentialId, verificationUrl, certificateUrl: pdfResult.url };
}

function rejectCertificateRequest_(certificateId, notes){
  if(!certificateId) throw new Error("Missing certificateId.");
  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const rowIdx = findRowIndexByValue_(certSheet, "Certificate_ID", certificateId);
  if(rowIdx === -1) throw new Error("Certificate request not found.");

  const record = sheetToObjects_(certSheet).find(c => c.Certificate_ID === certificateId);
  updateRowByColumns_(certSheet, rowIdx, { Status: "Rejected", Request_Notes: notes || record.Request_Notes });

  const appSheet = getSheet_(SHEET_NAMES.APPLICATIONS);
  const appRowIdx = findRowIndexByValue_(appSheet, "Application_ID", record.Application_ID);
  if(appRowIdx !== -1){
    updateRowByColumns_(appSheet, appRowIdx, { Application_Status: "Completed" });
  }

  return { certificateId, status: "Rejected" };
}

function revokeCertificate_(certificateId){
  if(!certificateId) throw new Error("Missing certificateId.");
  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const rowIdx = findRowIndexByValue_(certSheet, "Certificate_ID", certificateId);
  if(rowIdx === -1) throw new Error("Certificate not found.");
  updateRowByColumns_(certSheet, rowIdx, { Status: "Revoked" });
  return { certificateId, status: "Revoked" };
}

function resendCertificateEmail_(certificateId){
  if(!certificateId) throw new Error("Missing certificateId.");
  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const record = sheetToObjects_(certSheet).find(c => c.Certificate_ID === certificateId);
  if(!record) throw new Error("Certificate not found.");
  if(record.Status !== "Approved") throw new Error("This certificate has not been approved yet.");

  sendCertificateIssuedEmail_({
    email: record.Email,
    fullName: record.Full_Name,
    internshipTitle: record.Internship_Role,
    duration: record.Duration,
    credentialId: record.Credential_ID,
    startDate: record.Start_Date,
    completionDate: record.Completion_Date,
    issueDate: record.Certificate_Issue_Date,
    validUntil: record.Certificate_Valid_Until,
    approvedBy: record.Approved_By,
    verificationUrl: record.Verification_URL,
    certificateUrl: record.Certificate_URL,
    pdfBlob: null
  });

  return { certificateId, resent: true };
}

/**
 * Public verification — deliberately returns ONLY what's needed to confirm
 * validity. No email, phone, resume, or other private applicant data.
 */
function verifyCertificate_(credentialId){
  if(!credentialId || !credentialId.trim()){
    return { valid:false };
  }
  const certSheet = getSheet_(SHEET_NAMES.CERTIFICATES);
  const record = sheetToObjects_(certSheet).find(c =>
    String(c.Credential_ID).trim().toLowerCase() === credentialId.trim().toLowerCase() && c.Status === "Approved"
  );
  if(!record){
    return { valid:false };
  }
  const now = new Date();
  const validUntil = new Date(record.Certificate_Valid_Until);
  let status = "VALID";
  if(now > validUntil) status = "EXPIRED";

  return {
    valid: true,
    name: record.Full_Name,
    internshipTitle: record.Internship_Role,
    duration: record.Duration,
    startDate: record.Start_Date,
    completionDate: record.Completion_Date,
    issueDate: record.Certificate_Issue_Date,
    validUntil: record.Certificate_Valid_Until,
    credentialId: record.Credential_ID,
    status
  };
}
