const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function main() {
  const failures = [];

  function check(name, action) {
    try {
      action();
    } catch (error) {
      failures.push({ name, error: error.message });
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
    const dataIndex = contactHtml.indexOf('src="services-data.js"');
    const scriptIndex = contactHtml.indexOf('src="script.js"');
    if (dataIndex === -1 || scriptIndex === -1 || dataIndex > scriptIndex) {
      throw new Error("contact.html must load services-data.js before script.js");
    }
  });

  check("lead storage config loads before shared script", () => {
    [indexHtml, contactHtml].forEach((html, index) => {
      const file = index === 0 ? "index.html" : "contact.html";
      const configIndex = html.indexOf('src="lead-config.js"');
      const scriptIndex = html.indexOf('src="script.js"');
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

  check("contact service select can represent every service plus placeholder", () => {
    const expectedOptions = services.length + 1;
    if (expectedOptions !== 70) {
      throw new Error(`Expected 70 generated select options, found ${expectedOptions}`);
    }
  });

  check("contact form captures location and preferred contact method", () => {
    if (!contactHtml.includes('name="city_state"')) {
      throw new Error("Expected contact form to capture city/state");
    }
    if (!contactHtml.includes('name="preferred_contact"')) {
      throw new Error("Expected contact form to capture preferred contact method");
    }
  });

  check("contact form captures lead stage and urgency", () => {
    if (!contactHtml.includes('name="business_stage"')) {
      throw new Error("Expected contact form to capture business stage");
    }
    if (!contactHtml.includes('name="urgency"')) {
      throw new Error("Expected contact form to capture urgency");
    }
  });

  check("shared script supports wrapped FAQ sections", () => {
    const script = read("script.js");
    if (!script.includes('faqHeading.closest(".section-head")')) {
      throw new Error("Expected FAQ schema helper to support section-head wrapped FAQ headings");
    }
  });

  check("shared script tracks lead actions and form outcomes", () => {
    ["phone_lead_click", "email_lead_click", "whatsapp_lead_click", "lead_form_submit_attempt", "lead_form_submitted", "lead_form_submit_failed", "lead_form_email_failed"].forEach((eventName) => {
      if (!scriptJs.includes(eventName)) {
        throw new Error(`Expected shared script to include ${eventName}`);
      }
    });
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
    [
      "submitLeadBackup(formData, contactForm, serviceContext)",
      "navigator.sendBeacon",
      'mode: "no-cors"',
      "lead_backup_request_sent",
      "lead_backup_request_failed"
    ].forEach((snippet) => {
      if (!scriptJs.includes(snippet)) {
        throw new Error(`Expected shared script lead backup support to include ${snippet}`);
      }
    });
  });

  check("Google Apps Script lead receiver stores key form fields", () => {
    [
      "function doPost(e)",
      "SpreadsheetApp.getActiveSpreadsheet",
      "sheet.appendRow(row)",
      '"phone"',
      '"service"',
      '"urgency"',
      '"preferred_contact"'
    ].forEach((snippet) => {
      if (!leadCaptureGs.includes(snippet)) {
        throw new Error(`Expected lead capture Apps Script to include ${snippet}`);
      }
    });
  });

  check("lead attribution fields are captured and stored", () => {
    [
      "ATTRIBUTION_KEYS",
      "getAttributionContext",
      "first_landing_url",
      "first_referrer_url",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "gclid"
    ].forEach((snippet) => {
      if (!scriptJs.includes(snippet) && !leadCaptureGs.includes(snippet)) {
        throw new Error(`Expected lead attribution support to include ${snippet}`);
      }
    });
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

  console.log(JSON.stringify({ checks: 22, failures: 0 }, null, 2));
}

main();
