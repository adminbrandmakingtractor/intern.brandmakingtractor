/**
 * Run setupSheets() ONCE from the Apps Script editor (select it in the
 * function dropdown, click Run). It creates all sheets with headers,
 * seeds the 7 internship openings, 3 starter coupons, and a default
 * manager login.
 *
 * Safe to re-run: it will not duplicate sheets/headers/rows that already
 * exist, but WILL skip re-seeding a sheet that already has rows.
 */
function setupSheets(){
  const ss = getSpreadsheet_();

  // NOTE: duration/fee is chosen at application time (4/6/8 weeks — see
  // Config.gs -> DURATION_FEES), not fixed per internship, so this sheet
  // no longer carries Training_Duration/Live_Project_Duration/Total_Duration.
  createSheetWithHeaders_(ss, SHEET_NAMES.OPENINGS, [
    "Opening_ID","Title","Department","Description","Work_Mode","Skills",
    "Responsibilities","What_You_Will_Learn","Who_Should_Apply",
    "Openings","Status","Created_Date"
  ]);

  createSheetWithHeaders_(ss, SHEET_NAMES.APPLICATIONS, [
    "Application_ID","Timestamp","Full_Name","Email","Phone","City","College",
    "Course","Year","Internship_Role","Opening_ID","Duration","Original_Fee",
    "Coupon_Code","Discount_Percentage","Discount_Amount","Final_Amount",
    "Skills","Portfolio","LinkedIn","Resume","Why_Join","Availability",
    "Application_Status","Payment_Status","Payment_Proof_Status",
    "Manager_Notes","Start_Date","Completion_Date"
  ]);

  createSheetWithHeaders_(ss, SHEET_NAMES.CERTIFICATES, [
    "Certificate_ID","Credential_ID","Application_ID","Intern_ID","Full_Name",
    "Email","Internship_Role","Duration","Start_Date","Completion_Date",
    "Certificate_Issue_Date","Certificate_Valid_Until","Status","Approved_By",
    "Approval_Date","Certificate_URL","Verification_URL","Requested_Date","Request_Notes"
  ]);

  createSheetWithHeaders_(ss, SHEET_NAMES.COUPONS, [
    "Coupon_ID","Coupon_Code","Discount_Percentage","Start_Date","Expiry_Date",
    "Usage_Limit","Used_Count","Status","Created_Date"
  ]);

  createSheetWithHeaders_(ss, SHEET_NAMES.MANAGERS, [
    "Manager_ID","Name","Email","Password_Hash","Role","Created_Date"
  ]);

  createSheetWithHeaders_(ss, SHEET_NAMES.CONTACT, [
    "Query_ID","Full_Name","Email","Phone","Subject","Message","Submitted_Date","Status"
  ]);

  createSheetWithHeaders_(ss, SHEET_NAMES.EMAIL_QUEUE, [
    "Queue_ID","Type","Payload","Status","Created_Date","Sent_Date"
  ]);

  seedInternshipOpenings_();
  seedCoupons_();
  seedDefaultManager_();

  // Remove the default "Sheet1" if it's empty and unused.
  const sheet1 = ss.getSheetByName("Sheet1");
  if(sheet1 && ss.getSheets().length > 1 && sheet1.getLastRow() === 0){
    ss.deleteSheet(sheet1);
  }

  Logger.log("Setup complete.");
}

function createSheetWithHeaders_(ss, name, headers){
  let sheet = ss.getSheetByName(name);
  if(!sheet){
    sheet = ss.insertSheet(name);
  }
  if(sheet.getLastRow() === 0){
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#0d1b2e").setFontColor("#ffffff");
  }
  return sheet;
}

function seedInternshipOpenings_(){
  const sheet = getSheet_(SHEET_NAMES.OPENINGS);
  if(sheet.getLastRow() > 1) return; // already seeded

  const now = new Date();
  const rows = [
    ["INT-DA-001","Data Analyst Internship","Analytics & Growth",
     "Work with real project data to clean, organize, analyze and visualize business and marketing performance.",
     "Remote",
     "Data Cleaning, Excel/Sheets, Dashboards, Reporting, Data Visualization",
     "Clean & organize datasets; build dashboards & reports; analyze marketing/business data; generate insights under supervision",
     "Data cleaning & organization; Excel/Google Sheets; data visualization & dashboards; marketing data analysis & reporting; business insight and performance analysis",
     "Students/grads comfortable with spreadsheets who are detail-oriented and curious about numbers.",
     3, "Open", now],

    ["INT-PM-001","Performance Marketing Internship","Performance Marketing",
     "Get hands-on with Google Ads and Meta Ads — campaign structure, audience research and performance reporting on real client accounts.",
     "Hybrid",
     "Google Ads, Meta Ads, Audience Research, Conversion Tracking, ROAS/CPA Analysis",
     "Assist building/structuring campaigns; support keyword & audience research; help design ad creatives; track conversions & report performance",
     "Google Ads & Meta Ads; campaign structure & audience research; keyword research & ad creatives; conversion tracking & optimization; ROAS/CPA/CPL analysis",
     "Aspiring digital marketers who are analytical and comfortable working with platforms and numbers.",
     4, "Open", now],

    ["INT-WD-001","Website Development Internship — Custom Coded","Website Development",
     "Build responsive, custom-coded websites from scratch using HTML, CSS and JavaScript on real client projects. Custom code focus — not WordPress.",
     "Remote",
     "HTML, CSS, JavaScript, Responsive Design, API Integration",
     "Build responsive pages with HTML/CSS/JS; implement forms & basic API integrations; optimize performance; support deployment",
     "HTML, CSS & JavaScript fundamentals; responsive & frontend development; website structure & forms; API integrations; performance optimization & basic deployment",
     "Students who enjoy writing code from scratch and want to master custom frontend development.",
     3, "Open", now],

    ["INT-GD-001","Graphic Designing Internship","Creative & Branding",
     "Design real social media and digital advertising creatives for live brands.",
     "Remote",
     "Social Media Creatives, Typography, Layout, Brand Design, Visual Hierarchy",
     "Design creatives for social/digital ads; maintain brand consistency; collaborate on creative concepts; iterate on feedback",
     "Social media & digital ad creatives; typography, layout & visual hierarchy; brand design & consistency; creative concepts; marketing & social media design",
     "Creative thinkers with an eye for visual detail wanting real brand work for their portfolio.",
     3, "Open", now],

    ["INT-CC-001","Content Creation Internship","Content & Social Media",
     "Plan and write real content for client brands — captions, calendars, copywriting and strategy.",
     "Remote",
     "Copywriting, Content Strategy, Content Calendars, Social Captions, Brand Voice",
     "Write captions/copy for client social media; support content planning & calendars; research trends; maintain brand tone",
     "Content strategy & planning; social media content & copywriting; content calendars; brand communication & creative concepts; captions & content research",
     "Strong writers with a feel for tone and trends who love turning ideas into content.",
     3, "Open", now],

    ["INT-WP-001","WordPress Website Development Internship","Website Development",
     "Build and customize real client websites on WordPress — themes, plugins, page builders and on-page SEO. Separate track from Custom Coded Development.",
     "Remote",
     "WordPress, Page Builders, Themes & Plugins, Basic SEO, Website Optimization",
     "Build/customize WordPress sites for clients; configure themes/plugins/page builders; implement basic SEO; set up forms & integrations",
     "WordPress fundamentals, themes & plugins; page builders & customization; responsive website development; basic SEO implementation; website optimization, forms & integrations",
     "Students interested in fast, practical website building using WordPress rather than raw code.",
     3, "Open", now],

    ["INT-VE-001","Video Editing Internship","Creative & Content",
     "Edit real short-form videos and reels for client brands — pacing, captions, transitions, audio and basic motion graphics.",
     "Remote",
     "Video Editing, Reels, Captions, Transitions, Motion Graphics",
     "Edit short-form videos & Reels for clients; add captions/transitions/audio; support basic motion graphics; optimize for platforms",
     "Video editing & short-form storytelling; Instagram Reels & social videos; captions, transitions & audio; basic motion graphics; video optimization for platforms",
     "Students with an eye for pacing/storytelling who enjoy editing software.",
     3, "Open", now]
  ];

  sheet.getRange(2,1,rows.length, rows[0].length).setValues(rows);
}

function seedCoupons_(){
  const sheet = getSheet_(SHEET_NAMES.COUPONS);
  if(sheet.getLastRow() > 1) return; // already seeded

  const now = new Date();
  const oneYearOut = addYears_(now, 1);
  const rows = [
    ["CPN-0001","BMT10",10, now, oneYearOut, 100, 0, "Active", now],
    ["CPN-0002","BMT20",20, now, oneYearOut, 100, 0, "Active", now],
    ["CPN-0003","BMT30",30, now, oneYearOut,  50, 0, "Active", now]
  ];
  sheet.getRange(2,1,rows.length, rows[0].length).setValues(rows);
}

function seedDefaultManager_(){
  const sheet = getSheet_(SHEET_NAMES.MANAGERS);
  if(sheet.getLastRow() > 1) return; // already seeded

  // CHANGE THIS PASSWORD after first login. Default: Manager@123
  const defaultPassword = "Manager@123";
  sheet.appendRow([
    "MGR-0001",
    "Program Manager",
    "manager@brandmakingtractor.com",
    hashPassword_(defaultPassword),
    "Admin",
    new Date()
  ]);
  Logger.log("Default manager created — email: manager@brandmakingtractor.com / password: " + defaultPassword);
}
