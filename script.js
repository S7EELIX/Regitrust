const menuBtn = document.getElementById("menu-btn");
const nav = document.getElementById("site-nav");
const year = document.getElementById("year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const serviceSelect = document.getElementById("service");

const GA4_MEASUREMENT_ID = "G-3TFYHJLKL3";
const PRIMARY_PHONE = "+918984297666";
const DISPLAY_PHONE = "+91 89842 97666";
const WHATSAPP_MESSAGE = "Hello Regitrust, I need help with business registration or compliance.";
const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid"];

function whatsappUrl(message = WHATSAPP_MESSAGE) {
  return `https://wa.me/${PRIMARY_PHONE.replace("+", "")}?text=${encodeURIComponent(message)}`;
}

function setupAnalytics() {
  if (!GA4_MEASUREMENT_ID || GA4_MEASUREMENT_ID === "G-XXXXXXXXXX") {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", GA4_MEASUREMENT_ID);
}

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, {
      page_path: window.location.pathname,
      page_title: document.title,
      ...params
    });
  }
}

function getServiceContext(form) {
  const params = new URLSearchParams(window.location.search);
  const selectedService = form?.querySelector('[name="service"]')?.value || params.get("service") || "";
  const leadContext = params.get("lead_context") || "";
  return {
    ...(selectedService ? { service_name: selectedService } : {}),
    ...(leadContext ? { lead_context: leadContext } : {})
  };
}

function getSessionValue(key) {
  try {
    return sessionStorage.getItem(key) || "";
  } catch (error) {
    return "";
  }
}

function setSessionValue(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    // Attribution is helpful, but lead submission should never depend on storage access.
  }
}

function getAttributionContext() {
  const params = new URLSearchParams(window.location.search);
  const firstLanding = getSessionValue("regitrust_first_landing") || window.location.href;
  const firstReferrer = getSessionValue("regitrust_first_referrer") || document.referrer || "";
  const attribution = {
    referrer_url: document.referrer || "",
    first_landing_url: firstLanding,
    first_referrer_url: firstReferrer
  };

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key) || getSessionValue(`regitrust_${key}`) || "";
    if (value) {
      attribution[key] = value;
    }
  });

  return attribution;
}

function getCampaignClassification(leadContext = "") {
  const normalized = leadContext.toLowerCase();
  if (/(basic local registration only|lowest-cost|lowest cost|small shop|small trader|local shop|grocery|cheap filing only)/.test(normalized)) {
    return {
      campaign_focus: "low_scope_local_filing",
      audience_priority: "low",
      lead_intent: "basic_local_price_shopping",
      lead_fit: "low_fit"
    };
  }
  if (/(hong kong|singapore|malaysia|thailand|indonesia|china|laos|cambodia|vietnam|south korea|korea|east asia|southeast asia|asean)/.test(normalized)) {
    return {
      campaign_focus: "east_southeast_asia_india_entry",
      audience_priority: "highest",
      lead_intent: "asia_to_india_market_entry",
      lead_fit: "priority_asia_cross_border"
    };
  }
  if (/(nri|foreign|international|overseas|market-entry|india-entry)/.test(normalized)) {
    return {
      campaign_focus: "international_nri_market_entry",
      audience_priority: "high",
      lead_intent: "cross_border_india_setup",
      lead_fit: "priority_cross_border"
    };
  }
  if (/(south-india|bengaluru|chennai|hyderabad)/.test(normalized)) {
    return {
      campaign_focus: "south_india_business_setup",
      audience_priority: "medium_high",
      lead_intent: "regional_growth_setup",
      lead_fit: "priority_regional_growth"
    };
  }
  if (/(company|scope-console|business-setup)/.test(normalized)) {
    return {
      campaign_focus: "company_registration",
      audience_priority: "medium",
      lead_intent: "business_setup",
      lead_fit: "standard_business_setup"
    };
  }
  return {
    campaign_focus: "general_services",
    audience_priority: "standard",
    lead_intent: "general_enquiry",
    lead_fit: "standard_review"
  };
}

function getFormCampaignSignal(form, serviceContext = {}) {
  const signalParts = [
    serviceContext.lead_context,
    serviceContext.service_name
  ];
  ["business_stage", "setup_scope", "budget_readiness", "city_state", "preferred_contact", "preferred_time", "message"].forEach((name) => {
    const value = form?.querySelector(`[name="${name}"]`)?.value;
    if (value) {
      signalParts.push(value);
    }
  });
  return signalParts.filter(Boolean).join(" ");
}

function syncCampaignClassification(form, serviceContext = {}) {
  const classification = getCampaignClassification(getFormCampaignSignal(form, serviceContext));
  Object.entries(classification).forEach(([name, value]) => {
    setHiddenInput(form, name, value);
  });
  return classification;
}

function getPageLeadEventContext(extraSignal = "") {
  const serviceContext = getServiceContext();
  const signal = [
    window.location.pathname,
    document.title,
    serviceContext.lead_context,
    serviceContext.service_name,
    extraSignal
  ].filter(Boolean).join(" ");
  return {
    ...serviceContext,
    ...getCampaignClassification(signal)
  };
}

function formDataToLeadPayload(formData, form, serviceContext = {}) {
  const payload = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      payload[key] = value.trim();
    }
  });

  return {
    ...payload,
    form_id: form?.id || "contact-form",
    page_url: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
    user_agent: navigator.userAgent,
    lead_storage_version: "2026-06-24",
    ...getAttributionContext(),
    ...serviceContext
  };
}

async function submitLeadBackup(formData, form, serviceContext = {}) {
  const endpoint = window.REGITRUST_LEAD_WEBHOOK_URL;
  if (!endpoint || !/^https:\/\//i.test(endpoint)) {
    return false;
  }

  const payload = formDataToLeadPayload(formData, form, serviceContext);
  const body = JSON.stringify(payload);

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body
    });
    trackEvent("lead_backup_request_sent", serviceContext);
    return true;
  } catch (error) {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(endpoint, blob)) {
        trackEvent("lead_backup_beacon_sent", serviceContext);
        return true;
      }
    }
    trackEvent("lead_backup_request_failed", serviceContext);
    return false;
  }
}

function getLeadEventName(element) {
  const explicitName = element.getAttribute("data-track");
  if (explicitName) {
    return explicitName;
  }

  const href = element.getAttribute("href") || "";
  if (href.startsWith("tel:")) {
    return "phone_lead_click";
  }
  if (href.startsWith("mailto:")) {
    return "email_lead_click";
  }
  if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
    return "whatsapp_lead_click";
  }
  if (href.includes("contact.html")) {
    return "quote_request_click";
  }
  if (
    element.classList.contains("card") ||
    element.closest(".service-links") ||
    element.closest(".footer-service-links")
  ) {
    return "service_internal_click";
  }
  return "";
}

setupAnalytics();
setupAttribution();
trackThankYouConversion();
setupPremiumPageEnhancements();
setupMoneyPageEnhancements();
setupCityPageEnhancements();
setupLeadContextLinks();

function setupLeadCaptureHelpers() {
  const pageLabel = document.title.replace(/\s*\|\s*Regitrust Services LLP\s*$/i, "").trim() || "Regitrust website";
  const header = document.querySelector(".site-header");

  if (header && !document.querySelector(".site-contact-bar")) {
    const contactBar = document.createElement("div");
    contactBar.className = "site-contact-bar";
    contactBar.innerHTML = `
      <div class="container site-contact-bar-wrap">
        <span class="site-contact-message">Hong Kong, Singapore, ASEAN, foreign founder, GST, ROC, tax, or trademark help?</span>
        <a class="site-contact-call" href="tel:${PRIMARY_PHONE}" data-track="top_bar_call_click">Call ${DISPLAY_PHONE}</a>
        <a class="site-contact-whatsapp" href="${whatsappUrl(`Hello Regitrust, I am viewing ${pageLabel} and need help.`)}" target="_blank" rel="noopener noreferrer" data-track="top_bar_whatsapp_click">WhatsApp</a>
      </div>
    `;
    header.insertAdjacentElement("afterend", contactBar);
  }

  if (!document.querySelector(".whatsapp-float")) {
    const floatingWhatsapp = document.createElement("a");
    floatingWhatsapp.href = whatsappUrl(`Hello Regitrust, I am viewing ${pageLabel} and need help.`);
    floatingWhatsapp.target = "_blank";
    floatingWhatsapp.rel = "noopener noreferrer";
    floatingWhatsapp.className = "whatsapp-float";
    floatingWhatsapp.setAttribute("aria-label", "Chat on WhatsApp");
    floatingWhatsapp.dataset.track = "floating_whatsapp_click";
    floatingWhatsapp.textContent = "WhatsApp";
    document.body.appendChild(floatingWhatsapp);
  }

  if (!document.querySelector(".mobile-cta")) {
    const mobileCta = document.createElement("div");
    mobileCta.className = "mobile-cta";
    mobileCta.setAttribute("aria-label", "Quick contact actions");
    mobileCta.innerHTML = `
      <a href="tel:${PRIMARY_PHONE}" data-track="mobile_call_click">Call Now</a>
      <a href="${whatsappUrl(`Hello Regitrust, I am viewing ${pageLabel} and need help.`)}" target="_blank" rel="noopener noreferrer" data-track="mobile_whatsapp_click">WhatsApp</a>
    `;
    document.body.appendChild(mobileCta);
  }

  document.querySelectorAll(".contact-form").forEach((form) => {
    setHiddenInput(form, "source_url", window.location.href);
    setHiddenInput(form, "source_path", window.location.pathname);
    setHiddenInput(form, "source_title", document.title);
    setHiddenInput(form, "lead_channel", "website");
    const leadContext = new URLSearchParams(window.location.search).get("lead_context");
    if (leadContext) {
      setHiddenInput(form, "lead_context", leadContext);
    }
    syncCampaignClassification(form, { lead_context: leadContext || "" });
    Object.entries(getAttributionContext()).forEach(([name, value]) => {
      setHiddenInput(form, name, value);
    });

    form.querySelectorAll('input[type="tel"]').forEach((input) => {
      input.setAttribute("inputmode", "tel");
      input.setAttribute("autocomplete", "tel");
      input.setAttribute("pattern", "[0-9+()\\-\\s]{7,}");
    });
  });

  const footer = document.querySelector(".footer-wrap");
  if (footer && !footer.querySelector(".footer-contact")) {
    const footerContact = document.createElement("p");
    footerContact.className = "footer-contact";
    footerContact.innerHTML = `
      <a href="tel:${PRIMARY_PHONE}">${DISPLAY_PHONE}</a>
      <span>Online support across India</span>
      <a href="mailto:contact@regitrust.in">contact@regitrust.in</a>
    `;
    footer.appendChild(footerContact);
  }

  if (footer && !footer.querySelector(".footer-service-links")) {
    const footerServiceLinks = document.createElement("p");
    footerServiceLinks.className = "legal-links footer-service-links";
    footerServiceLinks.innerHTML = `
      <a href="nri-company-registration-india.html">NRI Company Registration</a>
      <a href="foreign-company-registration-india.html">Foreign Company Registration</a>
      <a href="india-market-entry-services.html">India Market Entry</a>
      <a href="south-india-business-registration.html">South India Business Setup</a>
      <a href="company-registration-bengaluru.html">Company Registration Bengaluru</a>
      <a href="company-registration-chennai.html">Company Registration Chennai</a>
      <a href="company-registration-hyderabad.html">Company Registration Hyderabad</a>
      <a href="company-registration.html">Company Registration</a>
      <a href="gst-pan.html">GST Registration</a>
      <a href="trademark-registration.html">Trademark Registration</a>
      <a href="annual-roc-filing.html">Annual ROC Filing</a>
    `;
    footer.appendChild(footerServiceLinks);
  }

  injectLeadSchema();
  injectPageFaqSchema();
  injectBreadcrumbSchema();
}

function setupPremiumPageEnhancements() {
  document.querySelectorAll(".mega-menu").forEach((menu) => {
    if (menu.querySelector(".mega-intro")) {
      return;
    }

    const intro = document.createElement("div");
    intro.className = "mega-intro";
    intro.innerHTML = `
      <span>Start here</span>
      <strong>India setup review</strong>
      <p>For Hong Kong, Singapore, Southeast Asia, China, South Korea, and foreign founders entering India. We confirm scope, documents, and starts-from pricing before work begins.</p>
      <a href="contact.html?lead_context=nav-generated-scope" role="menuitem">Ask for a recommendation</a>
    `;
    menu.prepend(intro);
  });

  if (document.body.classList.contains("home-clean")) {
    return;
  }

  const firstSection = document.querySelector("main > .section:first-child");
  const heroHead = firstSection?.querySelector(".section-head");
  if (!firstSection || !heroHead || heroHead.querySelector(".service-assurance-strip")) {
    return;
  }

  const heading = heroHead.querySelector("h1");
  const isServiceLanding = !!firstSection.querySelector('.breadcrumbs a[href*="services.html"]');
  if (!heading || !isServiceLanding) {
    return;
  }

  firstSection.classList.add("premium-service-hero");
  const assuranceStrip = document.createElement("div");
  assuranceStrip.className = "service-assurance-strip";
  assuranceStrip.innerHTML = `
    <span><strong>Scope first</strong> We confirm the right route before quoting</span>
    <span><strong>Document check</strong> Practical checklist and gap review</span>
    <span><strong>After filing</strong> Next compliance step explained</span>
  `;

  const heroCta = heroHead.querySelector(".hero-cta");
  if (heroCta) {
    heroCta.insertAdjacentElement("afterend", assuranceStrip);
  } else {
    heroHead.appendChild(assuranceStrip);
  }
}

function setupMoneyPageEnhancements() {
  const slug = window.location.pathname.split("/").pop() || "index.html";
  const pages = {
    "company-registration.html": {
      className: "money-page money-company-page",
      label: "Company setup desk",
      title: "Launch with a clean compliance base",
      summary: "Best for founders who need company setup, PAN/TAN, GST readiness, banking documents, and first-year compliance planning in one connected route.",
      metrics: [
        ["Scope", "Entity, directors, capital"],
        ["Output", "Incorporation plus next steps"],
        ["Quote", "Starts from after review"]
      ],
      outcomes: [
        ["Structure clarity", "Private limited, LLP, OPC, or foreign-founder route explained before filing."],
        ["Document control", "Director, office, DSC, PAN/TAN, and MCA filing dependencies checked early."],
        ["Post-setup map", "GST, accounting, ROC, trademark, and tax priorities sequenced after incorporation."]
      ],
      cta: "Request Company Setup Review",
      service: "private-limited-company-registration"
    },
    "gst-pan.html": {
      className: "money-page money-gst-page",
      label: "GST readiness desk",
      title: "Get GST right before invoices begin",
      summary: "Designed for traders, ecommerce sellers, consultants, agencies, SaaS, and service businesses that need GSTIN, return readiness, and query handling.",
      metrics: [
        ["Scope", "Registration, query, returns"],
        ["Output", "GSTIN plus compliance basics"],
        ["Quote", "Starts from after review"]
      ],
      outcomes: [
        ["Eligibility check", "Confirm whether GST is mandatory based on turnover, state, ecommerce, and supply model."],
        ["Portal-ready documents", "PAN, Aadhaar, office proof, bank details, authorization, and business activity reviewed."],
        ["After-registration support", "Invoice basics, return filing, notices, and accounting needs mapped early."]
      ],
      cta: "Request GST Scope Review",
      service: "gst-registration"
    },
    "trademark-registration.html": {
      className: "money-page money-trademark-page",
      label: "Brand protection desk",
      title: "Protect the name customers remember",
      summary: "For startups, agencies, restaurants, ecommerce brands, SaaS products, exporters, and creators who need class guidance and trademark filing support.",
      metrics: [
        ["Scope", "Name, logo, class"],
        ["Output", "Filing plus status path"],
        ["Quote", "Starts from after review"]
      ],
      outcomes: [
        ["Class direction", "Choose a filing class based on actual goods, services, and expansion plans."],
        ["Applicant review", "Individual, proprietor, MSME, company, or LLP filing details checked before submission."],
        ["Objection readiness", "Next steps explained if the application receives examination or objection remarks."]
      ],
      cta: "Request Trademark Review",
      service: "trademark-registration"
    },
    "nri-company-registration-india.html": {
      className: "money-page money-nri-page",
      label: "Global founder desk",
      title: "Set up in India without losing control of the process",
      summary: "Built for overseas founders from Hong Kong, Singapore, Malaysia, Thailand, Indonesia, China, Laos, Cambodia, Vietnam, South Korea, and NRI markets who need India structure planning, resident director clarity, signing flow, banking readiness, and compliance support.",
      metrics: [
        ["Scope", "NRI, resident director, FEMA"],
        ["Output", "Remote setup roadmap"],
        ["Quote", "Starts from after review"]
      ],
      outcomes: [
        ["Remote coordination", "Plan signatures, DSC, documents, notarization, apostille, and Indian office requirements."],
        ["Operating route", "Connect incorporation with GST, banking, IEC, trademark, contracts, and accounting."],
        ["Compliance visibility", "Understand ROC, tax, foreign-investment, and first-year obligations before launch."]
      ],
      cta: "Request NRI Setup Review",
      service: "private-limited-company-registration"
    },
    "foreign-company-registration-india.html": {
      className: "money-page money-foreign-company-page",
      label: "Foreign company setup desk",
      title: "Plan the India entity before filings begin",
      summary: "Built for overseas companies and foreign founders from Hong Kong, Singapore, Southeast Asia, China, and South Korea who need entity choice, resident director planning, documents, GST, IEC, banking readiness, and ongoing compliance visibility.",
      metrics: [
        ["Scope", "Foreign founder, entity, GST"],
        ["Output", "India setup roadmap"],
        ["Quote", "Starts from after review"]
      ],
      outcomes: [
        ["Structure clarity", "Compare India company, LLP, subsidiary-style setup, ownership, and resident director dependencies."],
        ["Document control", "Plan passport, address proof, DSC, notarization, apostille, and office proof requirements early."],
        ["Operating readiness", "Connect incorporation with GST, IEC, banking, contracts, trademark, accounting, and ROC compliance."]
      ],
      cta: "Request Foreign Company Review",
      service: "private-limited-company-registration"
    },
    "south-india-business-registration.html": {
      className: "money-page money-south-page",
      label: "South India launch desk",
      title: "One connected route for Bengaluru, Chennai, and Hyderabad",
      summary: "For founders who want company registration, GST, trademark, ROC, and recurring compliance coordinated around their South India business base.",
      metrics: [
        ["Scope", "City, entity, tax, brand"],
        ["Output", "Launch and compliance path"],
        ["Quote", "Starts from after review"]
      ],
      outcomes: [
        ["City-first planning", "Match registered office, customers, vendors, hiring, and filing needs to the right city route."],
        ["Bundled clarity", "See which filings should happen now and which can wait until the business is active."],
        ["Compliance calendar", "Plan GST, ROC, tax, accounting, renewals, and notices into a recurring schedule."]
      ],
      cta: "Request South India Setup Review",
      service: "private-limited-company-registration"
    }
  };
  const config = pages[slug];

  if (!config || document.querySelector(".money-conversion-panel")) {
    return;
  }

  document.body.classList.add(...config.className.split(" "));

  const firstSection = document.querySelector("main > .section:first-child");
  if (!firstSection) {
    return;
  }

  const trustPanel = document.createElement("section");
  trustPanel.className = "section money-trust-section";
  trustPanel.innerHTML = `
    <div class="container money-conversion-panel">
      <div class="money-panel-copy">
        <span>${config.label}</span>
        <h2>${config.title}</h2>
        <p>${config.summary}</p>
      </div>
      <div class="money-metrics" aria-label="Priority service review metrics">
        ${config.metrics.map(([label, value]) => `<div><strong>${label}</strong><span>${value}</span></div>`).join("")}
      </div>
      <div class="money-outcomes">
        ${config.outcomes.map(([title, text]) => `<article><strong>${title}</strong><p>${text}</p></article>`).join("")}
      </div>
      <div class="money-panel-actions">
        <a class="btn btn-primary" href="contact.html?lead_context=${encodeURIComponent(slug.replace(".html", ""))}&service=${encodeURIComponent(config.service)}" data-track="money_page_scope_review_click">${config.cta}</a>
        <a class="btn btn-secondary" href="${whatsappUrl(`Hello Regitrust, I am viewing ${config.label} and need a scope review.`)}" target="_blank" rel="noopener noreferrer" data-track="money_page_whatsapp_click">WhatsApp Scope</a>
      </div>
    </div>
  `;

  firstSection.insertAdjacentElement("afterend", trustPanel);
}

function setupCityPageEnhancements() {
  const slug = window.location.pathname.split("/").pop() || "";
  const match = slug.match(/^(company-registration|gst-registration|trademark-registration|roc-filing)-(bengaluru|chennai|hyderabad|lucknow)\.html$/);
  if (!match || document.querySelector(".city-conversion-panel")) {
    return;
  }

  const serviceType = match[1];
  const cityKey = match[2];
  const cityNames = {
    bengaluru: "Bengaluru",
    chennai: "Chennai",
    hyderabad: "Hyderabad",
    lucknow: "Lucknow"
  };
  const serviceLabels = {
    "company-registration": {
      label: "Company setup",
      service: "private-limited-company-registration",
      cta: "Request Company Setup Review",
      title: "Local setup planning with national filing support",
      summary: "Connect entity choice, documents, PAN/TAN, GST, trademark, bank readiness, and first compliance steps before work begins."
    },
    "gst-registration": {
      label: "GST registration",
      service: "gst-registration",
      cta: "Request GST Review",
      title: "GST readiness for local invoices and client onboarding",
      summary: "Review eligibility, address proof, business activity, ARN tracking, query risk, and return filing needs before GSTIN use."
    },
    "trademark-registration": {
      label: "Trademark filing",
      service: "trademark-registration",
      cta: "Request Trademark Review",
      title: "Brand protection connected to company and GST setup",
      summary: "Plan class selection, applicant ownership, logo or wordmark choice, filing support, and objection next steps."
    },
    "roc-filing": {
      label: "ROC compliance",
      service: "annual-roc-filing",
      cta: "Request ROC Review",
      title: "Annual compliance and company changes kept on calendar",
      summary: "Map due dates, company records, director or office changes, statutory filings, and recurring compliance requirements."
    }
  };
  const city = cityNames[cityKey];
  const service = serviceLabels[serviceType];
  const isSouth = ["bengaluru", "chennai", "hyderabad"].includes(cityKey);
  const cityCluster = isSouth ? "South India desk" : "North India desk";
  const cityLinks = isSouth
    ? [
        ["South India Hub", "south-india-business-registration.html"],
        [`${city} Company`, `company-registration-${cityKey}.html`],
        [`${city} GST`, `gst-registration-${cityKey}.html`],
        [`${city} Trademark`, `trademark-registration-${cityKey}.html`]
      ]
    : [
        ["Company Registration Lucknow", "company-registration-lucknow.html"],
        ["GST Registration Lucknow", "gst-registration-lucknow.html"],
        ["Trademark Registration Lucknow", "trademark-registration-lucknow.html"],
        ["Company Registration India", "company-registration.html"]
      ];

  document.body.classList.add("city-page", `city-${cityKey}-page`, `city-${serviceType}-page`);

  const firstSection = document.querySelector("main > .section:first-child");
  if (!firstSection) {
    return;
  }

  const panel = document.createElement("section");
  panel.className = "section city-trust-section";
  panel.innerHTML = `
    <div class="container city-conversion-panel">
      <div class="city-panel-copy">
        <span>${cityCluster}</span>
        <h2>${service.label} support in ${city}</h2>
        <p>${service.summary}</p>
      </div>
      <div class="city-metrics" aria-label="${city} service review details">
        <div><strong>City</strong><span>${city}</span></div>
        <div><strong>Service</strong><span>${service.label}</span></div>
        <div><strong>Pricing</strong><span>Starts from after review</span></div>
      </div>
      <div class="city-route-grid">
        ${cityLinks.map(([label, href]) => `<a href="${href}"><strong>${label}</strong><span>Review related local route</span></a>`).join("")}
      </div>
      <div class="city-panel-actions">
        <a class="btn btn-primary" href="contact.html?lead_context=${encodeURIComponent(slug.replace(".html", ""))}&service=${encodeURIComponent(service.service)}" data-track="city_page_scope_review_click">${service.cta}</a>
        <a class="btn btn-secondary" href="${whatsappUrl(`Hello Regitrust, I am viewing ${city} ${service.label} support and need a scope review.`)}" target="_blank" rel="noopener noreferrer" data-track="city_page_whatsapp_click">WhatsApp ${city}</a>
      </div>
    </div>
  `;

  firstSection.insertAdjacentElement("afterend", panel);
}

function setupLeadContextLinks() {
  const pageSlug = window.location.pathname
    .split("/")
    .pop()
    .replace(/\.html$/i, "") || "home";
  const excludedPages = new Set(["home", "index", "contact", "thank-you", "404", "services", "service"]);

  if (excludedPages.has(pageSlug)) {
    return;
  }

  document.querySelectorAll('a[href^="contact.html?"]').forEach((link) => {
    const url = new URL(link.getAttribute("href"), window.location.href);
    if (!url.searchParams.get("service") || url.searchParams.get("lead_context")) {
      return;
    }
    url.searchParams.set("lead_context", pageSlug);
    link.href = `${url.pathname.split("/").pop()}?${url.searchParams.toString()}`;
  });
}

function setupAttribution() {
  if (!getSessionValue("regitrust_first_landing")) {
    setSessionValue("regitrust_first_landing", window.location.href);
  }
  if (!getSessionValue("regitrust_first_referrer")) {
    setSessionValue("regitrust_first_referrer", document.referrer || "");
  }

  const params = new URLSearchParams(window.location.search);
  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      setSessionValue(`regitrust_${key}`, value);
    }
  });
}

function trackThankYouConversion() {
  if (!document.body.classList.contains("thank-you-page")) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const serviceName = params.get("service") || "";
  const leadContext = params.get("lead_context") || "";
  const classification = getCampaignClassification(leadContext);
  const conversionKey = `regitrust_confirmation_${serviceName}_${leadContext}_${getSessionValue("regitrust_gclid")}`;

  if (getSessionValue(conversionKey)) {
    return;
  }
  setSessionValue(conversionKey, new Date().toISOString());

  trackEvent("lead_confirmation_view", {
    service_name: serviceName,
    lead_context: leadContext,
    ...classification,
    ...getAttributionContext()
  });
}

function setHiddenInput(form, name, value) {
  let input = form.querySelector(`input[name="${name}"]`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }
  input.value = value;
}

function injectLeadSchema() {
  if (document.getElementById("regitrust-local-business-schema")) {
    return;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "@id": "https://regitrust.in/#legalservice",
    "name": "Regitrust Services LLP",
    "url": "https://regitrust.in/",
    "logo": "https://regitrust.in/assets/logo.png",
    "image": "https://regitrust.in/assets/logo.png",
    "telephone": [PRIMARY_PHONE, "+916306898090"],
    "email": "contact@regitrust.in",
    "areaServed": "India",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lucknow",
      "addressRegion": "Uttar Pradesh",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": [{
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "19:00"
    }],
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": PRIMARY_PHONE,
      "contactType": "customer support",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }]
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "regitrust-local-business-schema";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function injectPageFaqSchema() {
  if (document.getElementById("regitrust-page-faq-schema")) {
    return;
  }

  const faqHeading = Array.from(document.querySelectorAll("h2")).find((heading) =>
    /frequently asked questions|common questions|faqs/i.test(heading.textContent)
  );
  if (!faqHeading) {
    return;
  }

  const faqs = [];
  const headingWrapper = faqHeading.closest(".section-head");
  let node = headingWrapper?.contains(faqHeading) && headingWrapper.nextElementSibling
    ? headingWrapper.nextElementSibling
    : faqHeading.nextElementSibling;
  while (node && node.tagName !== "H2") {
    const questionNodes = node.tagName === "H3"
      ? [node]
      : Array.from(node.querySelectorAll?.("h3") || []);

    questionNodes.forEach((questionNode) => {
      const answerNode = questionNode.nextElementSibling;
      if (answerNode && answerNode.tagName === "P") {
        faqs.push({
          "@type": "Question",
          "name": questionNode.textContent.trim(),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answerNode.textContent.trim()
          }
        });
      }
    });

    node = node.nextElementSibling;
  }

  if (!faqs.length) {
    return;
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "regitrust-page-faq-schema";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs
  });
  document.head.appendChild(script);
}

function injectBreadcrumbSchema() {
  if (document.getElementById("regitrust-breadcrumb-schema")) {
    return;
  }

  const links = Array.from(document.querySelectorAll(".breadcrumbs a"));
  const currentPageName = document.querySelector("h1")?.textContent.trim();
  if (!links.length || !currentPageName) {
    return;
  }

  const items = links.map((link, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": link.textContent.trim(),
    "item": new URL(link.getAttribute("href"), window.location.href).href
  }));

  items.push({
    "@type": "ListItem",
    "position": items.length + 1,
    "name": currentPageName,
    "item": window.location.href.split("#")[0]
  });

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "regitrust-breadcrumb-schema";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items
  });
  document.head.appendChild(script);
}

setupLeadCaptureHelpers();

function setupServiceSelect() {
  if (!serviceSelect || !window.REGITRUST_SERVICE_CATEGORIES || !window.REGITRUST_SERVICE_SLUG) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const requestedService = params.get("service");
  const fragment = document.createDocumentFragment();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a service";
  fragment.appendChild(placeholder);

  window.REGITRUST_SERVICE_CATEGORIES.forEach((category) => {
    const group = document.createElement("optgroup");
    group.label = category.title;

    category.groups.forEach((serviceGroup) => {
      serviceGroup.items.forEach((item) => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        option.dataset.slug = window.REGITRUST_SERVICE_SLUG(item);
        group.appendChild(option);
      });
    });

    fragment.appendChild(group);
  });

  serviceSelect.replaceChildren(fragment);

  if (requestedService) {
    const match = Array.from(serviceSelect.options).find((option) =>
      option.value === requestedService || option.dataset.slug === requestedService
    );
    if (match) {
      serviceSelect.value = match.value;
    }
  }
}

setupServiceSelect();

function syncMobileNavState() {
  document.body.classList.toggle("nav-open", Boolean(nav?.classList.contains("open")));
}

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
    syncMobileNavState();
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      syncMobileNavState();
    });
  });
}

if (year) {
  year.textContent = new Date().getFullYear();
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";
    setHiddenInput(contactForm, "submitted_at", new Date().toISOString());
    const serviceContext = getServiceContext(contactForm);
    const campaignClassification = syncCampaignClassification(contactForm, serviceContext);
    const leadEventContext = {
      ...serviceContext,
      ...campaignClassification
    };
    const formData = new FormData(contactForm);
    trackEvent("lead_form_submit_attempt", {
      form_id: contactForm.id || "contact-form",
      ...leadEventContext
    });

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    if (formStatus) {
      formStatus.classList.remove("error");
      formStatus.textContent = "Submitting your request...";
    }

    try {
      const leadBackupSaved = await submitLeadBackup(formData, contactForm, leadEventContext);
      const endpoint = contactForm.dataset.ajaxAction || contactForm.action;
      let emailSubmitted = false;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json"
          }
        });
        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          emailSubmitted = result.success !== false && result.success !== "false";
        }
      } catch (error) {
        emailSubmitted = false;
      }

      if (!emailSubmitted && !leadBackupSaved) {
        throw new Error("Submission failed");
      }
      if (!emailSubmitted) {
        trackEvent("lead_form_email_failed", {
          form_id: contactForm.id || "contact-form",
          ...leadEventContext
        });
      }

      contactForm.reset();
      trackEvent("generate_lead", {
        form_id: contactForm.id || "contact-form",
        method: emailSubmitted ? "formsubmit" : "lead_backup",
        ...leadEventContext
      });
      trackEvent("lead_form_submitted", {
        form_id: contactForm.id || "contact-form",
        ...leadEventContext
      });
      if (formStatus) {
        formStatus.textContent = "Thanks! Redirecting you to confirmation...";
      }
      const submittedService = formData.get("service");
      const thankYouUrl = new URL("thank-you.html", window.location.href);
      if (submittedService) {
        thankYouUrl.searchParams.set("service", submittedService);
      }
      if (serviceContext.lead_context) {
        thankYouUrl.searchParams.set("lead_context", serviceContext.lead_context);
      }
      window.location.href = thankYouUrl.toString();
    } catch (error) {
      if (formStatus) {
        formStatus.classList.add("error");
        formStatus.textContent = "Unable to submit right now. Please call or WhatsApp us.";
      }
      trackEvent("lead_form_submit_failed", {
        form_id: contactForm.id || "contact-form",
        ...leadEventContext
      });
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
  const toggle = dropdown.querySelector(".dropdown-toggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelectorAll(".nav-dropdown.open").forEach((openDropdown) => {
      if (openDropdown !== dropdown) {
        openDropdown.classList.remove("open");
        openDropdown.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false");
      }
    });
    const isOpen = dropdown.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  dropdown.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".nav-dropdown")) {
    return;
  }

  document.querySelectorAll(".nav-dropdown.open").forEach((dropdown) => {
    dropdown.classList.remove("open");
    dropdown.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false");
  });
  syncMobileNavState();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  nav?.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", "false");
  syncMobileNavState();
  document.querySelectorAll(".nav-dropdown.open").forEach((dropdown) => {
    dropdown.classList.remove("open");
    dropdown.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-track], a[href^='tel:'], a[href^='mailto:'], a[href*='wa.me'], a[href*='contact.html'], .card[href], .service-links a, .footer-service-links a").forEach((element) => {
  element.addEventListener("click", () => {
    const name = getLeadEventName(element);
    if (name) {
      const linkText = element.textContent.trim().slice(0, 80);
      trackEvent(name, {
        link_url: element.href || "",
        link_text: linkText,
        ...getPageLeadEventContext(`${element.href || ""} ${linkText}`)
      });
    }
  });
});


const revealTargets = document.querySelectorAll(
  ".hero-card, .card, .value-card, .timeline article, .faq-list details, .cta-band-wrap"
);

if ("IntersectionObserver" in window && revealTargets.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealTargets.forEach((el) => {
    el.classList.add("reveal-on-scroll");
    observer.observe(el);
  });
} else {
  revealTargets.forEach((el) => el.classList.add("visible"));
}
