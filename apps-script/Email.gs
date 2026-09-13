/**
 * Transactional emails via MailApp.
 *
 * Sent synchronously from a Web App request add real latency (a MailApp
 * call typically costs 1-2s each), so anything on the public submit path
 * is queued to the Email_Queue sheet instead and flushed by a separate
 * time-driven trigger running processEmailQueue_ — the request that saved
 * the data returns fast, and the email goes out within a minute or so.
 */

function queueEmail_(type, payload){
  const sheet = getSheet_(SHEET_NAMES.EMAIL_QUEUE);
  const queueId = generateSequentialId_("EMQ", sheet, "Queue_ID", 6);
  appendRowFromObject_(sheet, {
    Queue_ID: queueId,
    Type: type,
    Payload: JSON.stringify(payload),
    Status: "Pending",
    Created_Date: new Date(),
    Sent_Date: ""
  });
}

/** Run on a time-driven trigger (set up once in the Apps Script editor's Triggers page). */
function processEmailQueue_(){
  const sheet = getSheet_(SHEET_NAMES.EMAIL_QUEUE);
  const pending = sheetToObjects_(sheet).filter(r => r.Status === "Pending");
  pending.forEach(row => {
    try{
      const data = JSON.parse(row.Payload);
      if(row.Type === "applicantConfirmation") sendApplicationConfirmationEmail_(data);
      else if(row.Type === "teamNotification") sendTeamApplicationEmail_(data);
      else if(row.Type === "contactAutoReply") sendContactAutoReplyEmail_(data);

      const rowIdx = findRowIndexByValue_(sheet, "Queue_ID", row.Queue_ID);
      updateRowByColumns_(sheet, rowIdx, { Status: "Sent", Sent_Date: new Date() });
    }catch(err){
      Logger.log("Failed to send queued email " + row.Queue_ID + ": " + err.message);
    }
  });
}

function money_(amount){
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function sendApplicationConfirmationEmail_(data){
  const { email, fullName, applicationId, internshipTitle, duration, originalFee, couponCode, discountPercentage, discountAmount, finalAmount } = data;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#2e9e3e;font-weight:bold;letter-spacing:1px;margin-bottom:0;">${BRAND_NAME}</p>
      <p style="color:#8996a8;font-size:11px;letter-spacing:2px;margin-top:2px;">${BRAND_TAGLINE}</p>
      <h2 style="color:#0d1b2e;">Application Received!</h2>
      <p>Hello ${fullName},</p>
      <p>Thank you for applying for the <strong>${internshipTitle}</strong> at ${BRAND_NAME}.</p>
      <p>Your application has been successfully received.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#8996a8;">Application Number</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${applicationId}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Internship</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${internshipTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Duration</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${duration}</td></tr>
        ${couponCode ? `<tr><td style="padding:8px 0;color:#8996a8;">Coupon Applied</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${couponCode} (${discountPercentage}% off)</td></tr>` : ""}
        <tr><td style="padding:8px 0;color:#8996a8;">Final Amount</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${money_(finalAmount)}</td></tr>
      </table>
      <p style="font-weight:bold;color:#0d1b2e;">NEXT STEP — PAY VIA UPI:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f6f8fb;border-radius:8px;">
        <tr><td style="padding:12px 14px;color:#8996a8;">Pay to this UPI ID</td><td style="padding:12px 14px;font-weight:bold;color:#0d1b2e;">${UPI_ID}</td></tr>
        <tr><td style="padding:12px 14px;color:#8996a8;">Amount to pay</td><td style="padding:12px 14px;font-weight:bold;color:#0d1b2e;">${money_(finalAmount)}</td></tr>
      </table>
      <p>After paying, <strong>reply to this email</strong> with your payment screenshot attached — our team will verify it and take your application forward from there.</p>
      <p>Please mention your Application Number in your reply:</p>
      <p style="font-size:18px;font-weight:bold;color:#1f5fd6;">${applicationId}</p>
      <p style="font-size:12.5px;color:#8996a8;">This Application Number is important for matching your payment with your application.</p>
      <p style="margin-top:28px;">Regards,<br>${BRAND_NAME}<br>${BRAND_TAGLINE}</p>
    </div>`;

  MailApp.sendEmail({
    to: email,
    replyTo: TEAM_EMAIL,
    subject: `Application Received — ${applicationId} | ${BRAND_NAME}`,
    htmlBody: html
  });
}

function sendTeamApplicationEmail_(data){
  const { fullName, email, phone, applicationId, internshipTitle, duration, originalFee, couponCode, discountPercentage, finalAmount } = data;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#0d1b2e;">NEW INTERNSHIP APPLICATION</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#8996a8;">Application No.</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${applicationId}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Applicant Name</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${fullName}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Email</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Phone</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${phone}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Internship</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${internshipTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Duration</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${duration}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Original Fee</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${money_(originalFee)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Coupon</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${couponCode || "None"}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Discount</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${couponCode ? discountPercentage + "%" : "—"}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Final Amount</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${money_(finalAmount)}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Payment Status</td><td style="padding:8px 0;font-weight:bold;color:#b8720a;">Payment Pending</td></tr>
      </table>
      <p style="font-weight:bold;color:#0d1b2e;">ACTION REQUIRED:</p>
      <p>Applicant has been instructed to pay to UPI ID <strong>${UPI_ID}</strong> and reply to their confirmation email (replies come to this inbox) with the payment screenshot. Use the Application Number above to identify the applicant and update their Payment Status in the Manager Dashboard once verified.</p>
    </div>`;

  MailApp.sendEmail({
    to: TEAM_EMAIL,
    subject: `New Internship Application — ${applicationId} | ${BRAND_NAME}`,
    htmlBody: html
  });
}

function sendContactAutoReplyEmail_(data){
  MailApp.sendEmail({
    to: data.email,
    subject: `We received your message — ${BRAND_NAME}`,
    htmlBody: `
      <p>Hi ${data.fullName},</p>
      <p>Thanks for reaching out to <strong>${BRAND_NAME}</strong>. We've received your message and will get back to you within 1–2 business days.</p>
      <p><strong>Your reference ID:</strong> ${data.queryId}</p>
      <p style="color:#8996a8;font-size:12px;">${BRAND_TAGLINE}</p>
    `
  });
}

function sendCertificateIssuedEmail_(data){
  const qrUrl = buildQrCodeUrl_(data.verificationUrl);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <p style="color:#2e9e3e;font-weight:bold;letter-spacing:1px;margin-bottom:0;">${BRAND_NAME}</p>
      <p style="color:#8996a8;font-size:11px;letter-spacing:2px;margin-top:2px;">${BRAND_TAGLINE}</p>
      <h2 style="color:#0d1b2e;">Congratulations ${data.fullName}!</h2>
      <p>You have successfully completed your internship with ${BRAND_NAME}.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr><td style="padding:8px 0;color:#8996a8;">Internship</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${data.internshipTitle}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Duration</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${data.duration}</td></tr>
        <tr><td style="padding:8px 0;color:#8996a8;">Credential ID</td><td style="padding:8px 0;font-weight:bold;color:#0d1b2e;">${data.credentialId}</td></tr>
      </table>
      <p>Your certificate has been approved and generated.</p>
      <p><strong>Download Certificate:</strong><br><a href="${data.certificateUrl}">${data.certificateUrl}</a></p>
      <p><strong>Verify Certificate:</strong><br><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
      <img src="${qrUrl}" width="140" height="140" alt="QR code to verify certificate">
      <p style="margin-top:28px;">Regards,<br>${BRAND_NAME}<br>${BRAND_TAGLINE}</p>
    </div>`;

  MailApp.sendEmail({
    to: data.email,
    subject: `Your Internship Certificate is Ready — ${data.credentialId}`,
    htmlBody: html,
    attachments: data.pdfBlob ? [data.pdfBlob] : []
  });
}
