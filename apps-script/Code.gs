/**
 * Main entry points — routes every request from the frontend to the
 * right handler. GET is used for read-only/public lookups, POST for
 * anything that writes data or needs a JSON body.
 */

function doGet(e){
  try{
    const action = e.parameter.action;
    switch(action){
      case "getInternships":
        return jsonSuccess_(getInternships_());
      case "verifyCertificate":
        return jsonSuccess_(verifyCertificate_(e.parameter.credentialId));
      default:
        return jsonError_("Unknown or missing action: " + action);
    }
  }catch(err){
    return jsonError_(err.message);
  }
}

function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch(action){
      // ---- public actions ----
      case "submitApplication":
        return jsonSuccess_(submitApplication_(body));
      case "validateCoupon":
        return jsonSuccess_(validateCoupon_(body.couponCode, body.duration));
      case "requestCertificate":
        return jsonSuccess_(requestCertificate_(body));
      case "submitContactQuery":
        return jsonSuccess_(submitContactQuery_(body));
      case "managerLogin":
        return jsonSuccess_(managerLogin_(body.email, body.password));

      // ---- authenticated manager actions ----
      case "getManagerDashboard":
        requireManagerAuth_(body.token);
        return jsonSuccess_(getManagerDashboard_());

      case "updateApplicationStatus":
        requireManagerAuth_(body.token);
        return jsonSuccess_(updateApplicationStatus_(body));

      case "createCoupon":
        requireManagerAuth_(body.token);
        return jsonSuccess_(adminCreateCoupon_(body));
      case "updateCoupon":
        requireManagerAuth_(body.token);
        return jsonSuccess_(adminUpdateCoupon_(body));
      case "toggleCouponStatus":
        requireManagerAuth_(body.token);
        return jsonSuccess_(adminToggleCouponStatus_(body.couponId, body.status));

      case "approveCertificate":
        requireManagerAuth_(body.token);
        return jsonSuccess_(approveCertificate_(body));
      case "rejectCertificateRequest":
        requireManagerAuth_(body.token);
        return jsonSuccess_(rejectCertificateRequest_(body.certificateId, body.notes));
      case "revokeCertificate":
        requireManagerAuth_(body.token);
        return jsonSuccess_(revokeCertificate_(body.certificateId));
      case "resendCertificateEmail":
        requireManagerAuth_(body.token);
        return jsonSuccess_(resendCertificateEmail_(body.certificateId));

      default:
        return jsonError_("Unknown action: " + action);
    }
  }catch(err){
    return jsonError_(err.message);
  }
}
