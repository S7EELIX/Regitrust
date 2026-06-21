const CLEAN_SERVICE_URLS = {
  "trademark-registration": "trademark-registration.html",
  "llp-registration": "llp-registration.html",
  "fssai-registration": "fssai-registration.html",
  "msme-udyam-registration": "msme-udyam-registration.html",
  "import-export-code-iec-registration": "iec-registration.html",
  "startup-india-registration": "startup-india-registration.html",
  "gst-return-filing": "gst-return-filing.html",
  "trademark-objection-reply": "trademark-objection-reply.html",
  "trademark-renewal": "trademark-renewal.html",
  "income-tax-return-filing": "income-tax-return-filing.html",
  "gst-notice-reply": "gst-notice-reply.html",
  "income-tax-notice-reply": "income-tax-notice-reply.html",
  "llp-annual-filing": "llp-annual-filing.html",
  "tds-return-filing": "tds-return-filing.html",
  "dsc-registration": "dsc-registration.html",
  "copyright-registration": "copyright-registration.html",
  "pan-application": "pan-tan-application.html",
  "tan-application": "pan-tan-application.html"
};

function serviceLink(title) {
  const slug = window.REGITRUST_SERVICE_SLUG(title);
  return CLEAN_SERVICE_URLS[slug] || `service.html?service=${slug}`;
}

const SERVICE_SECTIONS = [
  ["meaning", "Meaning"],
  ["who-should-choose-it", "Who Should Choose It"],
  ["benefits", "Benefits"],
  ["documents-required", "Documents Required"],
  ["process", "Process"],
  ["government-fees", "Government Fees"],
  ["time-required", "Time Required"],
  ["compliance-next-steps", "Compliance / Next Steps"],
  ["common-mistakes", "Common Mistakes"],
  ["faqs", "FAQs"]
];

function renderServiceCatalogue() {
  const catalogue = document.getElementById("service-catalogue");
  if (!catalogue || !window.REGITRUST_SERVICE_CATEGORIES) {
    return;
  }

  catalogue.innerHTML = window.REGITRUST_SERVICE_CATEGORIES.map((category, categoryIndex) => `
    <details class="service-category" id="${window.REGITRUST_SERVICE_SLUG(category.title)}" ${categoryIndex === 0 ? "open" : ""}>
      <summary>
        <span>
          <strong>${category.title}</strong>
          <small>${category.summary}</small>
        </span>
      </summary>
      <div class="service-groups">
        ${category.groups.map((group) => `
          <details class="service-group" open>
            <summary>${group.title}</summary>
            <div class="service-links">
              ${group.items.map((item) => `<a href="${serviceLink(item)}">${item}</a>`).join("")}
            </div>
          </details>
        `).join("")}
      </div>
    </details>
  `).join("");

  const activeCategory = window.location.hash.replace("#", "");
  const activePanel = activeCategory ? document.getElementById(activeCategory) : null;
  if (activePanel) {
    activePanel.open = true;
  }

  setupServiceSearch(catalogue);
}

function setupServiceSearch(catalogue) {
  const input = document.getElementById("service-search-input");
  const status = document.getElementById("service-search-status");
  if (!input || !catalogue) {
    return;
  }

  function applyFilter() {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    catalogue.querySelectorAll(".service-category").forEach((category) => {
      let categoryHasMatch = false;

      category.querySelectorAll(".service-group").forEach((group) => {
        let groupHasMatch = false;

        group.querySelectorAll(".service-links a").forEach((link) => {
          const matches = !query || link.textContent.toLowerCase().includes(query);
          link.hidden = !matches;
          if (matches) {
            groupHasMatch = true;
            categoryHasMatch = true;
            visibleCount += 1;
          }
        });

        group.hidden = !groupHasMatch;
        if (query && groupHasMatch) {
          group.open = true;
        }
      });

      category.hidden = !categoryHasMatch;
      if (query && categoryHasMatch) {
        category.open = true;
      }
    });

    if (status) {
      status.textContent = query ? `${visibleCount} matching service${visibleCount === 1 ? "" : "s"} found.` : "Showing all services.";
    }
  }

  input.addEventListener("input", applyFilter);
  applyFilter();
}

function renderServiceDetail() {
  const detail = document.getElementById("service-detail");
  if (!detail || !window.REGITRUST_SERVICES) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("service") || "private-limited-company-registration";
  const service = window.REGITRUST_SERVICES.find((item) => item.slug === slug) || window.REGITRUST_SERVICES[0];
  const content = window.REGITRUST_SERVICE_CONTENT ? window.REGITRUST_SERVICE_CONTENT[service.slug] : null;
  const title = content ? content.serviceName : service.title;
  const category = content ? content.category : service.category;

  document.title = `${title} | Regitrust Services LLP`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", metaDescriptionFor(title, content));
  }
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute("href", serviceCanonicalUrl(service.slug));
  }
  updateOpenGraph(title, service, content);
  injectServiceSchema(service, content);
  injectBreadcrumbSchema(service, title);

  detail.innerHTML = `
    <section class="section section-muted service-hero">
      <div class="container service-hero-grid">
        <div>
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a href="index.html">Home</a>
            <span>/</span>
            <a href="services.html">Services</a>
            <span>/</span>
            <a href="services.html#${window.REGITRUST_SERVICE_SLUG(category)}">${escapeHtml(category)}</a>
          </nav>
          <span class="pill">${escapeHtml(category)}</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(introFor(service, content))}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="tel:+918984297666" data-track="service_detail_call_click">Call +91 89842 97666</a>
            <a class="btn btn-secondary" href="https://wa.me/918984297666?text=${encodeURIComponent(`Hello Regitrust, I need help with ${title}.`)}" target="_blank" rel="noopener noreferrer" data-track="service_detail_whatsapp_click">WhatsApp Expert</a>
          </div>
        </div>
        <aside class="service-note">
          <h2>Quick Service Snapshot</h2>
          <dl class="service-snapshot">
            <div>
              <dt>Category</dt>
              <dd>${escapeHtml(category)}</dd>
            </div>
            <div>
              <dt>Timeline</dt>
              <dd>${escapeHtml(content ? content.timeRequired : "Timeline depends on document readiness and authority processing.")}</dd>
            </div>
            <div>
              <dt>Government Fees</dt>
              <dd>${escapeHtml(content ? content.governmentFees : "Government fees vary by service, state, and business structure.")}</dd>
            </div>
          </dl>
          <h2>Page Contents</h2>
          <nav class="service-jump-links" aria-label="Service page sections">
            ${SERVICE_SECTIONS.map(([id, label]) => `<a href="#${id}">${escapeHtml(label)}</a>`).join("")}
          </nav>
        </aside>
      </div>
    </section>

    <section class="section">
      <div class="container service-article">
        <article>
          ${content ? renderRichService(content) : renderFallbackService(service)}
        </article>

        <aside class="related-services">
          <div class="service-contact-card">
            <h2>Need This Service?</h2>
            <p>Share your details and service requirement. The team can review documents, timelines, and next steps.</p>
            <a class="btn btn-primary" href="tel:+918984297666" data-track="service_sidebar_call_click">Call Now</a>
            <a class="btn btn-secondary" href="https://wa.me/918984297666?text=${encodeURIComponent(`Hello Regitrust, I need help with ${title}.`)}" target="_blank" rel="noopener noreferrer" data-track="service_sidebar_whatsapp_click">WhatsApp</a>
            <a class="text-link" href="contact.html?service=${encodeURIComponent(service.slug)}" data-track="service_sidebar_contact_click">Request callback -></a>
          </div>
          <h2>Related Services</h2>
          ${window.REGITRUST_SERVICES
            .filter((item) => item.category === service.category && item.slug !== service.slug)
            .slice(0, 8)
            .map((item) => `<a href="${serviceLink(item.title)}">${escapeHtml(item.title)}</a>`)
            .join("")}
          <a class="text-link" href="services.html">View all services -></a>
        </aside>
      </div>
    </section>
  `;
}

function renderRichService(content) {
  return `
    <h2 id="meaning">Meaning</h2>
    <p>${escapeHtml(content.meaning)}</p>
    ${renderListSection("Who Should Choose It", "who-should-choose-it", content.whoShouldChooseIt)}
    ${renderListSection("Benefits", "benefits", content.benefits)}
    ${renderListSection("Documents Required", "documents-required", content.documentsRequired)}
    <h2 id="process">Process</h2>
    <ol class="process-list">${content.process.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    <h2 id="government-fees">Government Fees</h2>
    <p>${escapeHtml(content.governmentFees)}</p>
    <h2 id="time-required">Time Required</h2>
    <p>${escapeHtml(content.timeRequired)}</p>
    ${renderListSection("Compliance / Next Steps", "compliance-next-steps", content.complianceNextSteps)}
    ${renderListSection("Common Mistakes", "common-mistakes", content.commonMistakes)}
    <h2 id="faqs">FAQs</h2>
    <div class="faq-list service-faqs">
      ${content.faqs.map((faq) => `
        <details>
          <summary>${escapeHtml(faq.question)}</summary>
          <p>${escapeHtml(faq.answer)}</p>
        </details>
      `).join("")}
    </div>
  `;
}

function renderFallbackService(service) {
  return `
    <h2 id="meaning">Meaning</h2>
    <p>${escapeHtml(service.title)} is a structured registration, compliance, taxation, legal documentation, or advisory service for Indian businesses.</p>
    <h2 id="process">Process</h2>
    <ol class="process-list">
      ${processFor(service).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
    </ol>
  `;
}

function renderListSection(title, id, items) {
  return `
    <h2 id="${escapeHtml(id)}">${escapeHtml(title)}</h2>
    <ul class="contact-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `;
}

function introFor(service, content) {
  if (content && content.meaning) {
    return content.meaning.split(". ").slice(0, 2).join(". ").replace(/\.$/, "") + ".";
  }
  return `${service.title} is part of our ${service.category.toLowerCase()} support for Indian businesses that need accurate documentation, timely filings, and clear compliance guidance.`;
}

function metaDescriptionFor(title, content) {
  if (content && content.meaning) {
    const base = content.meaning.replace(/\s+/g, " ").slice(0, 155);
    return base.length >= 155 ? `${base.replace(/\s+\S*$/, "")}.` : base;
  }
  return `${title} support from Regitrust Services LLP with documents, process, fees, timeline, compliance steps, and FAQs.`;
}

function processFor(service) {
  return [
    "Consultation to understand your business requirement and eligibility.",
    "Document checklist and collection with clear guidance from our team.",
    "Drafting, review, application preparation, or compliance working as required.",
    "Submission, tracking, and coordination with the relevant portal or authority where applicable.",
    "Completion update, records handover, and next-step compliance guidance."
  ];
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function updateOpenGraph(title, service, content) {
  const fields = [
    ['meta[property="og:title"]', `${title} | Regitrust Services LLP`],
    ['meta[property="og:description"]', metaDescriptionFor(title, content)],
    ['meta[property="og:url"]', serviceCanonicalUrl(service.slug)]
  ];
  fields.forEach(([selector, value]) => {
    const tag = document.querySelector(selector);
    if (tag) {
      tag.setAttribute("content", value);
    }
  });
}

function injectServiceSchema(service, content) {
  if (!content) {
    return;
  }
  const existing = document.getElementById("service-json-ld");
  if (existing) {
    existing.remove();
  }
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": content.serviceName,
    "serviceType": content.category,
    "provider": {
      "@type": "LegalService",
      "name": "Regitrust Services LLP",
      "url": "https://regitrust.in/"
    },
    "areaServed": "India",
    "description": metaDescriptionFor(content.serviceName, content),
    "url": serviceCanonicalUrl(service.slug),
    "mainEntity": content.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "service-json-ld";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function injectBreadcrumbSchema(service, title) {
  const existing = document.getElementById("breadcrumb-json-ld");
  if (existing) {
    existing.remove();
  }
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://regitrust.in/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Services",
        "item": "https://regitrust.in/services.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": serviceCanonicalUrl(service.slug)
      }
    ]
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "breadcrumb-json-ld";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function serviceCanonicalUrl(slug) {
  return `https://regitrust.in/${CLEAN_SERVICE_URLS[slug] || `service.html?service=${slug}`}`;
}

renderServiceCatalogue();
renderServiceDetail();
