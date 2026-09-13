/* ==========================================================================
   intern.brandmakingtractor.com — Global config
   ========================================================================== */

// Supabase Edge Function URL (replaces the old Google Apps Script backend).
const SUPABASE_FUNCTION_URL = "https://wqtxsssegtjedobddtlq.supabase.co/functions/v1/quick-worker";
// Publishable/anon key — safe to expose in frontend code.
const SUPABASE_ANON_KEY = "sb_publishable_OyWoszOtF-l8S4sVPgVm6A_pjzdLi4l";

const BRAND = {
  name: "intern.brandmakingtractor.com",
  tagline: "LEARN • CREATE • GROW",
  parentPositioning: "We Build Brands That Grow", // parent company only — never used as the internship tagline
  supportEmail: "internship@brandmakingtractor.com",
  // Payment-proof replies go here. Keep this in sync with the Supabase Edge Function's TEAM_EMAIL constant.
  teamEmail: "internship@brandmakingtractor.com",
  // Keep in sync with the Supabase Edge Function's UPI_ID constant.
  upiId: "tabishejaz2267-3@okaxis",
  supportPhone: "+91 97917 18488",
  address: "Brand Making Tractor, Bengaluru, India",
  social: {
    instagram: "#",
    linkedin: "#",
    youtube: "#"
  }
};

// Displayed instantly on the application form. The backend NEVER trusts
// these numbers — apps-script/Config.gs -> DURATION_FEES is the real source
// of truth and recomputes every fee/discount server-side. Keep both in sync.
//
// Every duration follows the SAME structure: 1 Week Structured Training,
// then straight into the Live Client Project for the rest of the program.
// There is no separate/longer training period for longer durations — only
// the live-project portion grows. See getDurationStructure() below.
const DURATIONS = [
  { weeks: 4, fee: 1500 },
  { weeks: 6, fee: 2000 },
  { weeks: 8, fee: 3000 }
];

/** { weeks, trainingWeeks, liveWeeks, label } for a given total duration. */
function getDurationStructure(weeks){
  const totalWeeks = Number(weeks);
  const trainingWeeks = 1;
  const liveWeeks = totalWeeks - trainingWeeks;
  return {
    weeks: totalWeeks,
    trainingWeeks,
    liveWeeks,
    label: `1 Week Training + ${liveWeeks} Weeks Live Client Project`
  };
}

// Core positioning lines, used consistently across the site.
const MESSAGING = {
  structureShort: "1 Week Training + Direct Live Client Project Experience",
  brandLineLong: "Learn on Real Projects. Build Real Skills. Earn Real Credibility. Create Your Next Opportunity.",
  brandLineShort: "Learn. Create. Get Recommended. Get Hired. Grow."
};

// Static catalogue of the 7 internship openings.
// This mirrors the "Internship_Openings" Google Sheet exactly (same Opening_ID values)
// so pages render instantly; live Status/Openings counts are refreshed from the
// Apps Script API when available (see main.js -> loadInternships()).
const INTERNSHIPS = [
  {
    Opening_ID: "INT-DA-001",
    Title: "Data Analyst Internship",
    Department: "Analytics & Growth",
    Description: "Work with real project data to clean, organize, analyze and visualize business and marketing performance — turning raw numbers into insights that guide real decisions.",
    Work_Mode: "Remote",
    Skills: ["Excel / Google Sheets", "SQL", "Data Cleaning", "Power BI", "Google Looker Studio", "Dashboards & Reporting"],
    Responsibilities: [
      "Clean and organize raw datasets for analysis",
      "Build dashboards and visual reports",
      "Analyze marketing and business performance data",
      "Generate insights and recommendations under supervision"
    ],
    What_You_Will_Learn: [
      "Data cleaning & organization",
      "Excel / Google Sheets for analysis",
      "Data visualization & dashboard creation",
      "Marketing data analysis & reporting",
      "Business insight and performance analysis"
    ],
    Who_Should_Apply: "Students/grads curious about numbers, comfortable with spreadsheets, and eager to learn analysis tools with a detail-oriented mindset.",
    Openings: 3,
    Status: "Open",
    icon: "📊"
  },
  {
    Opening_ID: "INT-PM-001",
    Title: "Performance Marketing Internship",
    Department: "Performance Marketing",
    Description: "Get hands-on with Google Ads and Meta Ads — from campaign structure and audience research to optimization and performance reporting on real client accounts.",
    Work_Mode: "Hybrid",
    Skills: ["Google Search Ads", "Google Display Ads", "YouTube Ads", "Meta Ads", "Audience Targeting", "Conversion Tracking"],
    Responsibilities: [
      "Assist in building and structuring ad campaigns",
      "Support keyword and audience research",
      "Help design and test ad creatives",
      "Track conversions and report on campaign performance"
    ],
    What_You_Will_Learn: [
      "Google Ads & Meta Ads fundamentals",
      "Campaign structure & audience research",
      "Keyword research & ad creatives",
      "Conversion tracking & optimization",
      "ROAS / CPA / CPL performance analysis"
    ],
    Who_Should_Apply: "Aspiring digital marketers who are analytical, curious about consumer behaviour, and comfortable working with numbers and platforms.",
    Openings: 4,
    Status: "Open",
    icon: "📈"
  },
  {
    Opening_ID: "INT-WD-001",
    Title: "Website Development Internship — Custom Coded",
    Department: "Website Development",
    Description: "Build responsive, custom-coded websites from scratch using HTML, CSS and JavaScript — working on real client sites, forms and API integrations. (Custom code focus — not WordPress.)",
    Work_Mode: "Remote",
    Skills: ["HTML", "CSS", "JavaScript", "Responsive Web Design", "Git / GitHub", "Website Deployment"],
    Responsibilities: [
      "Build responsive website pages using HTML/CSS/JS",
      "Implement forms and basic API integrations",
      "Optimize site performance and structure",
      "Support deployment of client websites"
    ],
    What_You_Will_Learn: [
      "HTML, CSS & JavaScript fundamentals",
      "Responsive & frontend development",
      "Website structure & forms",
      "API integrations",
      "Performance optimization & basic deployment"
    ],
    Who_Should_Apply: "Students who enjoy writing code from scratch and want to master custom frontend development (no page-builder / WordPress work in this track).",
    Openings: 3,
    Status: "Open",
    icon: "💻"
  },
  {
    Opening_ID: "INT-GD-001",
    Title: "Graphic Designing Internship",
    Department: "Creative & Branding",
    Description: "Design real social media and digital advertising creatives for live brands — building your eye for typography, layout, visual hierarchy and brand consistency.",
    Work_Mode: "Remote",
    Skills: ["Canva", "Social Media Design", "Typography", "Layout Design", "Brand Identity", "Visual Design"],
    Responsibilities: [
      "Design creatives for social media & digital ads",
      "Maintain brand consistency across assets",
      "Collaborate on creative concepts with the team",
      "Iterate designs based on feedback"
    ],
    What_You_Will_Learn: [
      "Social media & digital ad creatives",
      "Typography, layout & visual hierarchy",
      "Brand design & consistency",
      "Creative concept development",
      "Marketing & social media design"
    ],
    Who_Should_Apply: "Creative thinkers with an eye for visual detail, comfortable with design tools, wanting real brand work for their portfolio.",
    Openings: 3,
    Status: "Open",
    icon: "🎨"
  },
  {
    Opening_ID: "INT-CC-001",
    Title: "Content Creation Internship",
    Department: "Content & Social Media",
    Description: "Plan and write real content for client brands — from social captions and calendars to copywriting and content strategy, built for engagement and brand voice.",
    Work_Mode: "Remote",
    Skills: ["SEO Content Writing", "Copywriting", "Keyword Research", "Blog Writing", "Content Strategy", "Content Calendars"],
    Responsibilities: [
      "Write captions and copy for client social media",
      "Support content planning and calendars",
      "Research trends and content ideas",
      "Maintain brand tone and communication style"
    ],
    What_You_Will_Learn: [
      "Content strategy & planning",
      "Social media content & copywriting",
      "Content calendars",
      "Brand communication & creative concepts",
      "Social captions & content research"
    ],
    Who_Should_Apply: "Strong writers with a feel for tone and trends who love turning ideas into scroll-stopping content.",
    Openings: 3,
    Status: "Open",
    icon: "✍️"
  },
  {
    Opening_ID: "INT-WP-001",
    Title: "WordPress Website Development Internship",
    Department: "Website Development",
    Description: "Build and customize real client websites on WordPress — themes, plugins, page builders, and on-page SEO. (WordPress-focused track — separate from Custom Coded Development.)",
    Work_Mode: "Remote",
    Skills: ["WordPress", "Elementor / Page Builders", "Themes & Plugins", "Responsive Design", "Website Optimization", "Basic SEO"],
    Responsibilities: [
      "Build and customize WordPress websites for clients",
      "Configure themes, plugins & page builders",
      "Implement basic on-page SEO",
      "Set up forms and integrations"
    ],
    What_You_Will_Learn: [
      "WordPress fundamentals, themes & plugins",
      "Page builders & customization",
      "Responsive website development",
      "Basic SEO implementation",
      "Website optimization, forms & integrations"
    ],
    Who_Should_Apply: "Students interested in fast, practical website building using WordPress and page builders rather than writing raw code.",
    Openings: 3,
    Status: "Open",
    icon: "🌐"
  },
  {
    Opening_ID: "INT-VE-001",
    Title: "Video Editing Internship",
    Department: "Creative & Content",
    Description: "Edit real short-form videos and reels for client brands — mastering pacing, captions, transitions, audio and basic motion graphics for social platforms.",
    Work_Mode: "Remote",
    Skills: ["Video Editing", "Reels & Shorts", "Captions & Subtitles", "Transitions", "Audio Editing", "Motion Graphics Basics"],
    Responsibilities: [
      "Edit short-form videos & Instagram Reels for clients",
      "Add captions, transitions and audio",
      "Support basic motion graphics work",
      "Optimize videos for each social platform"
    ],
    What_You_Will_Learn: [
      "Video editing & short-form storytelling",
      "Instagram Reels & social media videos",
      "Captions, transitions & audio",
      "Basic motion graphics",
      "Video optimization for platforms"
    ],
    Who_Should_Apply: "Students with an eye for pacing and storytelling who enjoy editing software and want real client reels in their portfolio.",
    Openings: 3,
    Status: "Open",
    icon: "🎬"
  }
];

function getInternshipById(id){
  return INTERNSHIPS.find(i => i.Opening_ID === id);
}
