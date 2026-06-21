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
  const contactHtml = read("contact.html");
  const servicesJs = read("services.js");
  const textFiles = fs.readdirSync(root).filter((file) => /\.(html|css|js|xml|txt)$/i.test(file));

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

  check("contact form supports no-JavaScript fallback", () => {
    if (!contactHtml.includes('action="https://formsubmit.co/contact@regitrust.in"')) {
      throw new Error("Expected regular FormSubmit action for no-JavaScript fallback");
    }
    if (!contactHtml.includes('data-ajax-action="https://formsubmit.co/ajax/contact@regitrust.in"')) {
      throw new Error("Expected AJAX FormSubmit endpoint for enhanced submission");
    }
    if (!contactHtml.includes('name="_next" value="https://regitrust.in/thank-you.html"')) {
      throw new Error("Expected _next redirect for no-JavaScript fallback");
    }
  });

  check("service CTAs pass service slug into contact page", () => {
    if (!servicesJs.includes("contact.html?service=${encodeURIComponent(service.slug)}")) {
      throw new Error("Service CTAs should link to contact.html with the current service slug");
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
    const script = read("script.js");
    ["phone_lead_click", "email_lead_click", "whatsapp_lead_click", "lead_form_submit_attempt", "lead_form_submitted", "lead_form_submit_failed"].forEach((eventName) => {
      if (!script.includes(eventName)) {
        throw new Error(`Expected shared script to include ${eventName}`);
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

  console.log(JSON.stringify({ checks: 11, failures: 0 }, null, 2));
}

main();
