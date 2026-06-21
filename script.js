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
  return selectedService ? { service_name: selectedService } : {};
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
  return "";
}

setupAnalytics();

function setupLeadCaptureHelpers() {
  const pageLabel = document.title.replace(/\s*\|\s*Regitrust Services LLP\s*$/i, "").trim() || "Regitrust website";
  const header = document.querySelector(".site-header");

  if (header && !document.querySelector(".site-contact-bar")) {
    const contactBar = document.createElement("div");
    contactBar.className = "site-contact-bar";
    contactBar.innerHTML = `
      <div class="container site-contact-bar-wrap">
        <span>Need registration, GST, ROC, tax, or trademark help?</span>
        <a href="tel:${PRIMARY_PHONE}" data-track="top_bar_call_click">Call ${DISPLAY_PHONE}</a>
        <a href="${whatsappUrl(`Hello Regitrust, I am viewing ${pageLabel} and need help.`)}" target="_blank" rel="noopener noreferrer" data-track="top_bar_whatsapp_click">WhatsApp</a>
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
      <span>Lucknow, Uttar Pradesh</span>
      <a href="mailto:contact@regitrust.in">contact@regitrust.in</a>
    `;
    footer.appendChild(footerContact);
  }

  if (footer && !footer.querySelector(".footer-service-links")) {
    const footerServiceLinks = document.createElement("p");
    footerServiceLinks.className = "legal-links footer-service-links";
    footerServiceLinks.innerHTML = `
      <a href="company-registration.html">Company Registration</a>
      <a href="gst-pan.html">GST Registration</a>
      <a href="llp-registration.html">LLP Registration</a>
      <a href="fssai-registration.html">FSSAI</a>
      <a href="gst-notice-reply.html">GST Notice</a>
      <a href="income-tax-return-filing.html">ITR Filing</a>
    `;
    footer.appendChild(footerServiceLinks);
  }

  injectLeadSchema();
  injectPageFaqSchema();
  injectBreadcrumbSchema();
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
    /frequently asked questions|faqs/i.test(heading.textContent)
  );
  if (!faqHeading) {
    return;
  }

  const faqs = [];
  let node = faqHeading.nextElementSibling;
  while (node && node.tagName !== "H2") {
    if (node.tagName === "H3") {
      const answerNode = node.nextElementSibling;
      if (answerNode && answerNode.tagName === "P") {
        faqs.push({
          "@type": "Question",
          "name": node.textContent.trim(),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answerNode.textContent.trim()
          }
        });
      }
    }
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

if (menuBtn && nav) {
  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
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
    const formData = new FormData(contactForm);
    const serviceContext = getServiceContext(contactForm);
    trackEvent("lead_form_submit_attempt", {
      form_id: contactForm.id || "contact-form",
      ...serviceContext
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
      const endpoint = contactForm.dataset.ajaxAction || contactForm.action;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      contactForm.reset();
      trackEvent("lead_form_submitted", {
        form_id: contactForm.id || "contact-form",
        ...serviceContext
      });
      if (formStatus) {
        formStatus.textContent = "Thanks! Redirecting you to confirmation...";
      }
      const submittedService = formData.get("service");
      const thankYouUrl = new URL("thank-you.html", window.location.href);
      if (submittedService) {
        thankYouUrl.searchParams.set("service", submittedService);
      }
      window.location.href = thankYouUrl.toString();
    } catch (error) {
      if (formStatus) {
        formStatus.classList.add("error");
        formStatus.textContent = "Unable to submit right now. Please call or WhatsApp us.";
      }
      trackEvent("lead_form_submit_failed", {
        form_id: contactForm.id || "contact-form",
        ...serviceContext
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

document.querySelectorAll("[data-track], a[href^='tel:'], a[href^='mailto:'], a[href*='wa.me'], a[href*='contact.html']").forEach((element) => {
  element.addEventListener("click", () => {
    const name = getLeadEventName(element);
    if (name) {
      trackEvent(name, {
        link_url: element.href || "",
        link_text: element.textContent.trim().slice(0, 80),
        ...getServiceContext()
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
