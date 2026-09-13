/**
 * Internship openings + application submission (with duration fee &
 * coupon discount, both recomputed authoritatively on the server).
 */

function getInternships_(){
  const sheet = getSheet_(SHEET_NAMES.OPENINGS);
  return sheetToObjects_(sheet).map(o => ({
    Opening_ID: o.Opening_ID,
    Title: o.Title,
    Department: o.Department,
    Openings: o.Openings,
    Status: o.Status
  }));
}

function submitApplication_(body){
  const required = ["fullName","email","phone","city","college","course","year","selectedInternshipId","duration","skills","whyJoin","availability"];
  required.forEach(f => {
    if(body[f] === undefined || body[f] === null || String(body[f]).trim() === ""){
      throw new Error(`Missing required field: ${f}`);
    }
  });

  if(!/^\S+@\S+\.\S+$/.test(body.email)){
    throw new Error("Please enter a valid email address.");
  }

  const openingsSheet = getSheet_(SHEET_NAMES.OPENINGS);
  const opening = sheetToObjects_(openingsSheet).find(o => o.Opening_ID === body.selectedInternshipId);
  if(!opening){
    throw new Error("Selected internship not found.");
  }

  // Authoritative pricing — never trust a fee/amount sent from the browser.
  const originalFee = getDurationFee_(body.duration);
  let couponCode = "";
  let discountPercentage = 0;
  let discountAmount = 0;
  let finalAmount = originalFee;

  if(body.couponCode && String(body.couponCode).trim()){
    const result = validateCoupon_(body.couponCode, body.duration); // throws if invalid/expired/exhausted
    couponCode = result.code;
    discountPercentage = result.discountPercentage;
    discountAmount = result.discountAmount;
    finalAmount = result.finalAmount;
  }

  const appSheet = getSheet_(SHEET_NAMES.APPLICATIONS);
  const applicationId = generateSequentialId_("BMT-APP", appSheet, "Application_ID", 6);
  const appliedDate = new Date();

  appendRowFromObject_(appSheet, {
    Application_ID: applicationId,
    Timestamp: appliedDate,
    Full_Name: body.fullName,
    Email: body.email,
    Phone: body.phone,
    City: body.city,
    College: body.college,
    Course: body.course,
    Year: body.year,
    Internship_Role: opening.Title,
    Opening_ID: opening.Opening_ID,
    Duration: `${body.duration} Weeks`,
    Original_Fee: originalFee,
    Coupon_Code: couponCode,
    Discount_Percentage: discountPercentage,
    Discount_Amount: discountAmount,
    Final_Amount: finalAmount,
    Skills: body.skills,
    Portfolio: body.portfolioUrl || "",
    LinkedIn: body.linkedinUrl || "",
    Resume: body.resumeUrl,
    Why_Join: body.whyJoin,
    Availability: body.availability,
    Application_Status: "New",
    Payment_Status: "Payment Pending",
    Payment_Proof_Status: "Not Received",
    Manager_Notes: "",
    Start_Date: "",
    Completion_Date: ""
  });

  if(couponCode){
    incrementCouponUsage_(couponCode);
  }

  const emailData = {
    email: body.email,
    fullName: body.fullName,
    applicationId,
    internshipTitle: opening.Title,
    duration: `${body.duration} Weeks`,
    phone: body.phone,
    originalFee, couponCode, discountPercentage, discountAmount, finalAmount
  };

  queueEmail_("applicantConfirmation", emailData);
  queueEmail_("teamNotification", emailData);

  return { applicationId, originalFee, couponCode, discountPercentage, discountAmount, finalAmount };
}
