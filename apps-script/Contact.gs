/**
 * Public contact form submissions.
 */

function submitContactQuery_(body){
  const required = ["fullName","email","subject","message"];
  required.forEach(f => { if(!body[f] || String(body[f]).trim() === "") throw new Error(`Missing required field: ${f}`); });

  const sheet = getSheet_(SHEET_NAMES.CONTACT);
  const queryId = generateSequentialId_("BMT-QRY", sheet, "Query_ID", 4);

  appendRowFromObject_(sheet, {
    Query_ID: queryId,
    Full_Name: body.fullName,
    Email: body.email,
    Phone: body.phone || "",
    Subject: body.subject,
    Message: body.message,
    Submitted_Date: new Date(),
    Status: "New"
  });

  queueEmail_("contactAutoReply", { email: body.email, fullName: body.fullName, queryId });

  return { queryId };
}
