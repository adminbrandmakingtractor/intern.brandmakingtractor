/**
 * Coupon validation (public, called from the application form) and
 * full CRUD for the Manager Dashboard's Coupons tab.
 *
 * All discount math happens here, server-side, on purpose — the frontend
 * never computes or trusts a discount amount on its own.
 */

function getDurationFee_(duration){
  const weeks = Number(duration);
  const fee = DURATION_FEES[weeks];
  if(!fee) throw new Error("Please choose a valid internship duration (4, 6 or 8 weeks).");
  return fee;
}

/**
 * Looks up a coupon and, if usable, returns the computed discount for the
 * given duration's fee. Throws the exact user-facing message the UI expects.
 * Does NOT increment Used_Count — that only happens on final submission
 * (see Coupons.gs -> incrementCouponUsage_, called from submitApplication_).
 */
function validateCoupon_(couponCode, duration){
  if(!couponCode || !String(couponCode).trim()){
    throw new Error("Please enter a coupon code.");
  }
  const originalFee = getDurationFee_(duration);

  const sheet = getSheet_(SHEET_NAMES.COUPONS);
  const coupon = sheetToObjects_(sheet).find(c =>
    String(c.Coupon_Code).trim().toLowerCase() === String(couponCode).trim().toLowerCase()
  );

  if(!coupon || coupon.Status !== "Active"){
    throw new Error("Invalid or expired coupon code.");
  }

  const today = dateOnly_(new Date());
  if(coupon.Start_Date && today < dateOnly_(coupon.Start_Date)){
    throw new Error("This coupon is not active yet.");
  }
  if(coupon.Expiry_Date && today > dateOnly_(coupon.Expiry_Date)){
    throw new Error("This coupon has expired.");
  }

  const usageLimit = Number(coupon.Usage_Limit) || 0;
  const usedCount = Number(coupon.Used_Count) || 0;
  if(usageLimit > 0 && usedCount >= usageLimit){
    throw new Error("This coupon is no longer available.");
  }

  const discountPercentage = Number(coupon.Discount_Percentage) || 0;
  const discountAmount = Math.round(originalFee * discountPercentage) / 100;
  const finalAmount = Math.round((originalFee - discountAmount) * 100) / 100;

  return {
    valid: true,
    code: coupon.Coupon_Code,
    originalFee,
    discountPercentage,
    discountAmount,
    finalAmount
  };
}

/** Called only from submitApplication_ once an application is actually saved with this coupon. */
function incrementCouponUsage_(couponCode){
  if(!couponCode) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try{
    const sheet = getSheet_(SHEET_NAMES.COUPONS);
    const rowIdx = findRowIndexByValue_(sheet, "Coupon_Code", couponCode);
    if(rowIdx === -1) return;
    const headers = getHeaders_(sheet);
    const colIdx = headers.indexOf("Used_Count");
    const current = Number(sheet.getRange(rowIdx, colIdx + 1).getValue()) || 0;
    sheet.getRange(rowIdx, colIdx + 1).setValue(current + 1);
  } finally {
    lock.releaseLock();
  }
}

/* ---------------------- Admin: Coupon management ---------------------- */

function adminListCoupons_(){
  const sheet = getSheet_(SHEET_NAMES.COUPONS);
  return sheetToObjects_(sheet).sort((a,b) => new Date(b.Created_Date) - new Date(a.Created_Date));
}

function adminCreateCoupon_(body){
  const required = ["couponCode","discountPercentage","startDate","expiryDate","usageLimit"];
  required.forEach(f => { if(body[f] === undefined || body[f] === null || body[f] === "") throw new Error(`Missing required field: ${f}`); });

  const sheet = getSheet_(SHEET_NAMES.COUPONS);
  const existing = sheetToObjects_(sheet).find(c => String(c.Coupon_Code).trim().toLowerCase() === String(body.couponCode).trim().toLowerCase());
  if(existing) throw new Error("A coupon with this code already exists.");

  const discount = Number(body.discountPercentage);
  if(isNaN(discount) || discount <= 0 || discount > 100) throw new Error("Discount percentage must be between 1 and 100.");

  const couponId = generateSequentialId_("CPN", sheet, "Coupon_ID", 4);
  appendRowFromObject_(sheet, {
    Coupon_ID: couponId,
    Coupon_Code: String(body.couponCode).trim().toUpperCase(),
    Discount_Percentage: discount,
    Start_Date: body.startDate,
    Expiry_Date: body.expiryDate,
    Usage_Limit: Number(body.usageLimit) || 0,
    Used_Count: 0,
    Status: body.status || "Active",
    Created_Date: new Date()
  });

  return { couponId };
}

function adminUpdateCoupon_(body){
  if(!body.couponId) throw new Error("Missing couponId.");
  const sheet = getSheet_(SHEET_NAMES.COUPONS);
  const rowIdx = findRowIndexByValue_(sheet, "Coupon_ID", body.couponId);
  if(rowIdx === -1) throw new Error("Coupon not found.");

  const updates = {};
  if(body.couponCode !== undefined) updates.Coupon_Code = String(body.couponCode).trim().toUpperCase();
  if(body.discountPercentage !== undefined) updates.Discount_Percentage = Number(body.discountPercentage);
  if(body.startDate !== undefined) updates.Start_Date = body.startDate;
  if(body.expiryDate !== undefined) updates.Expiry_Date = body.expiryDate;
  if(body.usageLimit !== undefined) updates.Usage_Limit = Number(body.usageLimit);
  if(body.status !== undefined) updates.Status = body.status;

  updateRowByColumns_(sheet, rowIdx, updates);
  return { couponId: body.couponId };
}

function adminToggleCouponStatus_(couponId, status){
  if(!couponId || !status) throw new Error("Missing couponId or status.");
  const sheet = getSheet_(SHEET_NAMES.COUPONS);
  const rowIdx = findRowIndexByValue_(sheet, "Coupon_ID", couponId);
  if(rowIdx === -1) throw new Error("Coupon not found.");
  updateRowByColumns_(sheet, rowIdx, { Status: status });
  return { couponId, status };
}
