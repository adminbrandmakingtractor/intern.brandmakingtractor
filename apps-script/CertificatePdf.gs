/**
 * Builds a one-page, A4-landscape PDF certificate using a temporary Google
 * Doc (Apps Script has no direct HTML->PDF conversion, so we assemble the
 * doc programmatically, export it as PDF, save that PDF as its own Drive
 * file for a persistent download link, then discard the intermediate doc).
 *
 * Returns { blob, url, fileId } — blob for emailing as an attachment,
 * url for the Certificates sheet's Certificate_URL / "Download Certificate".
 */
function generateCertificatePdf_(data){
  const doc = DocumentApp.create(`Certificate - ${data.credentialId}`);
  const body = doc.getBody();
  // A4 landscape, in points (A4 = 595 x 842pt).
  body.setPageWidth(842).setPageHeight(595);
  body.setMarginTop(50).setMarginBottom(50).setMarginLeft(60).setMarginRight(60);

  const navy = "#0d1b2e";
  const green = "#2e9e3e";
  const blue = "#1f5fd6";
  const gray = "#8996a8";

  const brand = body.appendParagraph(BRAND_NAME);
  brand.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  brand.editAsText().setForegroundColor(green).setBold(true).setFontSize(14);

  const tagline = body.appendParagraph(BRAND_TAGLINE);
  tagline.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  tagline.editAsText().setForegroundColor(gray).setFontSize(9);
  tagline.setSpacingAfter(18);

  const title = body.appendParagraph("CERTIFICATE OF INTERNSHIP");
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.editAsText().setForegroundColor(navy).setBold(true).setFontSize(26);
  title.setSpacingAfter(20);

  const presented = body.appendParagraph("Presented To");
  presented.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  presented.editAsText().setForegroundColor(gray).setFontSize(11);

  const name = body.appendParagraph(data.fullName);
  name.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  name.editAsText().setForegroundColor(blue).setBold(true).setFontSize(28);
  name.setSpacingAfter(16);

  const forLine = body.appendParagraph("For successfully completing");
  forLine.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  forLine.editAsText().setForegroundColor(gray).setFontSize(11);

  const program = body.appendParagraph(data.internshipTitle);
  program.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  program.editAsText().setForegroundColor(navy).setBold(true).setFontSize(18);
  program.setSpacingAfter(4);

  const durationLine = body.appendParagraph(`Duration: ${data.duration}`);
  durationLine.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  durationLine.editAsText().setForegroundColor(gray).setFontSize(11);

  const periodLine = body.appendParagraph(`Internship Period: ${formatDateISO_(data.startDate)} — ${formatDateISO_(data.completionDate)}`);
  periodLine.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  periodLine.editAsText().setForegroundColor(gray).setFontSize(11);

  const structure = body.appendParagraph(`Program Structure: ${structureLineFromDuration_(data.duration)}`);
  structure.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  structure.editAsText().setForegroundColor(navy).setBold(true).setFontSize(12);
  structure.setSpacingAfter(20);

  const table = body.appendTable([
    ["Credential ID", data.credentialId],
    ["Certificate Issue Date", formatDateISO_(data.issueDate)],
    ["Certificate Valid Until", formatDateISO_(data.validUntil)],
    ["Approved By", data.approvedBy],
    ["Verify At", data.verificationUrl]
  ]);
  for(let r = 0; r < table.getNumRows(); r++){
    const row = table.getRow(r);
    row.getCell(0).setWidth(180);
    row.getCell(0).editAsText().setBold(true).setForegroundColor(navy).setFontSize(10);
    row.getCell(1).editAsText().setForegroundColor(gray).setFontSize(10);
  }

  doc.saveAndClose();

  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs("application/pdf").setName(`Certificate-${data.credentialId}.pdf`);

  // Save the PDF as its own persistent Drive file so we have a stable
  // download link independent of the temporary Doc (which we trash below).
  const pdfFile = DriveApp.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`;

  DriveApp.getFileById(doc.getId()).setTrashed(true);

  return { blob: pdfBlob, url: downloadUrl, fileId: pdfFile.getId() };
}
