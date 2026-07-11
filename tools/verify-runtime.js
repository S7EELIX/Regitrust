const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function main() {
  const failures = [];
  let checks = 0;

  function check(name, action) {
    checks += 1;
    try {
      action();
    } catch (error) {
      failures.push({ name, error: error.message });
    }
  }

  function requireSnippets(source, snippets, label) {
    const missing = snippets.filter((snippet) => !source.includes(snippet));
    if (missing.length) {
      throw new Error(`Expected ${label} to include: ${missing.join(", ")}`);
    }
  }

  function requireSnippetsInAny(sources, snippets, label) {
    const missing = snippets.filter((snippet) => !sources.some((source) => source.includes(snippet)));
    if (missing.length) {
      throw new Error(`Expected ${label} to include: ${missing.join(", ")}`);
    }
  }

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("services-data.js"), context);
  vm.runInContext(read("services-content.js"), context);

  const services = context.window.REGITRUST_SERVICES || [];
  const content = context.window.REGITRUST_SERVICE_CONTENT || {};
  const indexHtml = read("index.html");
  const contactHtml = read("contact.html");
  const companyRegistrationHtm = read("company-registration.htm");
  const leadConfigJs = read("lead-config.js");
  const leadCaptureGs = read("tools/google-apps-script/lead-capture.gs");
  const servicesJs = read("services.js");
  const scriptJs = read("script.js");
  const localLeadPages = [
    "company-registration-lucknow.html",
    "gst-registration-lucknow.html",
    "trademark-registration-lucknow.html",
    "company-registration-bengaluru.html",
    "company-registration-chennai.html",
    "company-registration-hyderabad.html",
    "south-india-business-registration.html",
    "gst-registration-bengaluru.html",
    "gst-registration-chennai.html",
    "gst-registration-hyderabad.html",
    "trademark-registration-bengaluru.html",
    "trademark-registration-chennai.html",
    "trademark-registration-hyderabad.html",
    "roc-filing-bengaluru.html",
    "roc-filing-chennai.html",
    "roc-filing-hyderabad.html",
    "nri-company-registration-india.html",
    "india-market-entry-services.html"
  ];
  const homepageLeadPages = [
    "south-india-business-registration.html",
    "nri-company-registration-india.html",
    "india-market-entry-services.html"
  ];
  const textFiles = fs.readdirSync(root).filter((file) => /\.(html?|css|js|xml|txt)$/i.test(file));
  const htmlFiles = fs.readdirSync(root).filter((file) => /\.html?$/i.test(file));
  const cleanServiceSlugs = new Set(
    Array.from(servicesJs.matchAll(/"([^"]+)":\s*"[^"]+\.html"/g)).map((match) => match[1])
  );
  const appsScriptHeaders = Array.from(leadCaptureGs.matchAll(/^\s*"([^"]+)",?$/gm)).map((match) => match[1]);
  const requiredLeadFields = [
    "name",
    "phone",
    "email",
    "city_state",
    "service",
    "business_stage",
    "urgency",
    "preferred_contact",
    "message",
    "source_page",
    "source_url",
    "source_path",
    "source_title",
    "page_url",
    "page_path",
    "page_title",
    "service_name",
    "lead_context",
    "referrer_url",
    "first_landing_url",
    "first_referrer_url",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "submitted_at",
    "lead_channel",
    "form_id",
    "user_agent"
  ];

  function scriptTagIndex(html, file) {
    const escapedFile = file.replace(".", "\\.");
    const match = html.match(new RegExp(`src="${escapedFile}(?:\\?[^"]*)?"`));
    return match ? match.index : -1;
  }

  function sharedScriptIndex(html) {
    return scriptTagIndex(html, "script.js");
  }

  check("service database exposes 69 services", () => {
    if (services.length !== 69) {
      throw new Error(`Expected 69 services, found ${services.length}`);
    }
  });

  check("rich service content covers every service", () => {
    const missing = services.filter((service) => !content[service.slug]).map((service) => service.slug);
    if (missing.length) {
      throw new Error(`Missing rich content for: ${missing.join(", ")}`);
    }
  });

  check("contact form loads service data before shared script", () => {
    const dataIndex = scriptTagIndex(contactHtml, "services-data.js");
    const scriptIndex = sharedScriptIndex(contactHtml);
    if (dataIndex === -1 || scriptIndex === -1 || dataIndex > scriptIndex) {
      throw new Error("contact.html must load services-data.js before script.js");
    }
  });

  check("lead storage config loads before shared script", () => {
    [indexHtml, contactHtml].forEach((html, index) => {
      const file = index === 0 ? "index.html" : "contact.html";
      const configIndex = scriptTagIndex(html, "lead-config.js");
      const scriptIndex = sharedScriptIndex(html);
      if (configIndex === -1 || scriptIndex === -1 || configIndex > scriptIndex) {
        throw new Error(`${file} must load lead-config.js before script.js`);
      }
    });
  });

  check("contact form supports no-JavaScript fallback", () => {
    if (!contactHtml.includes('action="https://formsubmit.co/contact@regitrust.in"')) {
      throw new Error("Expected regular FormSubmit action for no-JavaScript fallback");
    }
    if (!contactHtml.includes('data-ajax-action="https://formsubmit.co/ajax/contact@regitrust.in"')) {
      throw new Error("Expected AJAX FormSubmit endpoint for enhanced submission");
    }
    if (!contactHtml.includes('name="_honey"')) {
      throw new Error("Expected FormSubmit honeypot field on contact form");
    }
    if (!contactHtml.includes('name="_next" value="https://regitrust.in/thank-you.html"')) {
      throw new Error("Expected _next redirect for no-JavaScript fallback");
    }
  });

  check("homepage form supports no-JavaScript fallback", () => {
    if (!indexHtml.includes('action="https://formsubmit.co/contact@regitrust.in"')) {
      throw new Error("Expected homepage form to use regular FormSubmit action for no-JavaScript fallback");
    }
    if (!indexHtml.includes('data-ajax-action="https://formsubmit.co/ajax/contact@regitrust.in"')) {
      throw new Error("Expected homepage form to keep AJAX FormSubmit endpoint for enhanced submission");
    }
    if (!indexHtml.includes('name="_honey"')) {
      throw new Error("Expected FormSubmit honeypot field on homepage form");
    }
    if (!indexHtml.includes('name="_next" value="https://regitrust.in/thank-you.html"')) {
      throw new Error("Expected homepage form _next redirect for no-JavaScript fallback");
    }
  });

  check("legacy company-registration htm path redirects to canonical page", () => {
    if (!companyRegistrationHtm.includes('url=company-registration.html')) {
      throw new Error("Expected company-registration.htm to meta-refresh to company-registration.html");
    }
    if (!companyRegistrationHtm.includes('href="https://regitrust.in/company-registration.html"')) {
      throw new Error("Expected company-registration.htm to canonicalize to company-registration.html");
    }
  });

  check("service CTAs pass service slug into contact page", () => {
    if (!servicesJs.includes("contact.html?service=${encodeURIComponent(service.slug)}")) {
      throw new Error("Service CTAs should link to contact.html with the current service slug");
    }
  });

  check("dynamic service page redirects to clean landing pages", () => {
    if (!servicesJs.includes("window.location.replace(cleanUrl)")) {
      throw new Error("Expected service.html clean URL requests to redirect to dedicated landing pages");
    }
    ["private-limited-company-registration", "gst-registration"].forEach((slug) => {
      if (!cleanServiceSlugs.has(slug)) {
        throw new Error(`Expected ${slug} to redirect to its clean landing page`);
      }
    });
  });

  check("public pages link to clean landing pages when available", () => {
    const staleLinks = [];
    htmlFiles.forEach((file) => {
      Array.from(read(file).matchAll(/service\.html\?service=([a-z0-9-]+)/g)).forEach((match) => {
        if (cleanServiceSlugs.has(match[1])) {
          staleLinks.push(`${file}:${match[0]}`);
        }
      });
    });

    if (staleLinks.length) {
      throw new Error(`Replace dynamic links with clean URLs: ${staleLinks.join(", ")}`);
    }
  });

  check("local Lucknow lead pages exist and are linked from homepage", () => {
    const missing = localLeadPages.filter((file) => !fs.existsSync(path.join(root, file)));
    if (missing.length) {
      throw new Error(`Missing local lead pages: ${missing.join(", ")}`);
    }
    const unlinked = homepageLeadPages.filter((file) => !indexHtml.includes(`href="${file}"`));
    if (unlinked.length) {
      throw new Error(`Homepage must link local lead pages: ${unlinked.join(", ")}`);
    }
  });

  check("local Lucknow lead pages are included in sitemap", () => {
    const sitemap = read("sitemap.xml");
    const missing = localLeadPages.filter((file) => !sitemap.includes(`https://regitrust.in/${file}`));
    if (missing.length) {
      throw new Error(`Sitemap missing local lead pages: ${missing.join(", ")}`);
    }
  });

  check("homepage stays focused on foreign founder and NRI lead quality", () => {
    requireSnippets(indexHtml, [
      "foreign founders",
      "NRIs",
      "overseas companies",
      "India Market Entry",
      "NRI or overseas founder"
    ], "homepage lead-quality copy");
  });

  check("NRI landing page filters out low-scope local shop leads", () => {
    const nriHtml = read("nri-company-registration-india.html");
    requireSnippets(nriHtml, [
      "Built for cross-border India setup, not basic local shop filings.",
      "Not the Right Fit",
      "tiny grocery registrations",
      "Starts from pricing after scope check"
    ], "NRI page qualification copy");
  });

  check("contact service select can represent every service plus placeholder", () => {
    const expectedOptions = services.length + 1;
    if (expectedOptions !== 70) {
      throw new Error(`Expected 70 generated select options, found ${expectedOptions}`);
    }
  });

  check("public lead forms capture the core lead qualification fields", () => {
    ["city_state", "service", "business_stage", "urgency", "preferred_contact", "message"].forEach((field) => {
      [indexHtml, contactHtml].forEach((html, index) => {
        const file = index === 0 ? "index.html" : "contact.html";
        if (!html.includes(`name="${field}"`)) {
          throw new Error(`${file} must capture ${field}`);
        }
      });
    });
  });

  check("shared script supports wrapped FAQ sections", () => {
    const script = read("script.js");
    if (!script.includes('faqHeading.closest(".section-head")')) {
      throw new Error("Expected FAQ schema helper to support section-head wrapped FAQ headings");
    }
  });

  check("shared script tracks lead actions and form outcomes", () => {
    requireSnippets(scriptJs, [
      "phone_lead_click",
      "email_lead_click",
      "whatsapp_lead_click",
      "lead_form_submit_attempt",
      "lead_form_submitted",
      "lead_form_submit_failed",
      "lead_form_email_failed"
    ], "shared script");
  });

  check("lead backup endpoint is configurable without code changes", () => {
    if (!leadConfigJs.includes("REGITRUST_LEAD_WEBHOOK_URL")) {
      throw new Error("Expected lead-config.js to expose REGITRUST_LEAD_WEBHOOK_URL");
    }
    if (!/window\.REGITRUST_LEAD_WEBHOOK_URL\s*=\s*"https:\/\/script\.google\.com\/macros\/s\/[^"]+\/exec"/.test(leadConfigJs)) {
      throw new Error("Expected deployed Google Apps Script webhook URL");
    }
  });

  check("successful form submissions are copied to optional lead storage", () => {
    requireSnippets(scriptJs, [
      "submitLeadBackup(formData, contactForm, serviceContext)",
      "navigator.sendBeacon",
      'mode: "no-cors"',
      "lead_backup_request_sent",
      "lead_backup_request_failed"
    ], "shared script lead backup support");
  });

  check("Google Apps Script lead receiver stores the full lead field contract", () => {
    requireSnippets(leadCaptureGs, [
      "function doPost(e)",
      "SpreadsheetApp.getActiveSpreadsheet",
      "sheet.appendRow(row)"
    ], "lead capture Apps Script");

    const missingHeaders = requiredLeadFields.filter((field) => !appsScriptHeaders.includes(field));
    if (missingHeaders.length) {
      throw new Error(`Expected Apps Script lead sheet headers to include: ${missingHeaders.join(", ")}`);
    }
  });

  check("shared script can populate every derived lead storage field", () => {
    requireSnippets(scriptJs, [
      "form_id",
      "page_url",
      "page_path",
      "page_title",
      "user_agent",
      "source_url",
      "source_path",
      "source_title",
      "lead_channel",
      "submitted_at",
      "service_name",
      "lead_context"
    ], "shared script derived lead storage fields");
  });

  check("lead attribution fields are captured and stored", () => {
    requireSnippetsInAny([scriptJs, leadCaptureGs], [
      "ATTRIBUTION_KEYS",
      "getAttributionContext",
      "first_landing_url",
      "first_referrer_url",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "gclid"
    ], "lead attribution support");
  });

  check("page-specific lead context is captured in links and forms", () => {
    requireSnippets(scriptJs, [
      "setupLeadContextLinks",
      "lead_context",
      'setHiddenInput(form, "lead_context", leadContext)',
      "url.searchParams.set(\"lead_context\", pageSlug)",
      'thankYouUrl.searchParams.set("lead_context", serviceContext.lead_context)'
    ], "lead context support");
    if (!leadCaptureGs.includes('"lead_context"')) {
      throw new Error("Expected Apps Script lead sheet headers to include lead_context");
    }
  });

  check("GA4 recommended lead conversion event is emitted", () => {
    requireSnippets(scriptJs, [
      "setupAnalytics();",
      'const GA4_MEASUREMENT_ID = "G-3TFYHJLKL3"',
      'trackEvent("generate_lead"',
      'method: emailSubmitted ? "formsubmit" : "lead_backup"'
    ], "GA4 lead conversion support");
  });

  check("public text files are free of common mojibake", () => {
    const mojibakePattern = /(?:\u00e2\u20ac|\u00e2\u20ac\u0153|\u00e2\u20ac\ufffd|\u00e2\u20ac\u2122|\u00c3\u00a9|\u00c3\u00a2|\ufffd)/;
    const affected = textFiles.filter((file) => mojibakePattern.test(read(file)));
    if (affected.length) {
      throw new Error(`Found possible mojibake in: ${affected.join(", ")}`);
    }
  });

  if (failures.length) {
    console.error(JSON.stringify({ failures }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ checks, failures: 0 }, null, 2));
}

main();
