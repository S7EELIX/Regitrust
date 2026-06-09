function serviceLink(title) {
  return `service.html?service=${window.REGITRUST_SERVICE_SLUG(title)}`;
}

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
}

function renderServiceDetail() {
  const detail = document.getElementById("service-detail");
  if (!detail || !window.REGITRUST_SERVICES) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("service") || "standalone-private-company";
  const service = window.REGITRUST_SERVICES.find((item) => item.slug === slug) || window.REGITRUST_SERVICES[0];

  document.title = `${service.title} | Regitrust Services LLP`;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", `${service.title} support from Regitrust Services LLP with premium guidance, structured process updates, and affordable value for the service quality delivered.`);
  }

  detail.innerHTML = `
    <section class="section section-muted service-hero">
      <div class="container service-hero-grid">
        <div>
          <span class="pill">${service.category}</span>
          <h1>${service.title}</h1>
          <p>${introFor(service)}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="contact.html" data-track="service_detail_consultation_click">Book Consultation</a>
            <a class="btn btn-secondary" href="https://wa.me/918984297666" target="_blank" rel="noopener noreferrer" data-track="service_detail_whatsapp_click">Chat on WhatsApp</a>
          </div>
        </div>
        <aside class="service-note">
          <h2>Premium Support, Sensible Value</h2>
          <p>Regitrust provides premium professional service at affordable pricing when compared with the quality of guidance, documentation, tracking, and post-filing support delivered.</p>
        </aside>
      </div>
    </section>

    <section class="section">
      <div class="container service-article">
        <article>
          <h2>What is ${service.title}?</h2>
          <p>${whatIsFor(service)}</p>

          <h2>How it works</h2>
          <p>${howItWorksFor(service)}</p>

          <h2>Process followed by Regitrust</h2>
          <ol class="process-list">
            ${processFor(service).map((step) => `<li>${step}</li>`).join("")}
          </ol>

          <h2>Why work with Regitrust?</h2>
          <p>Our team keeps the engagement clear from day one: practical document checklists, transparent updates, careful filing review, and support until the service milestone is complete. You get premium handling without unnecessary complexity or inflated positioning.</p>
        </article>

        <aside class="related-services">
          <h2>Related Services</h2>
          ${window.REGITRUST_SERVICES
            .filter((item) => item.category === service.category && item.slug !== service.slug)
            .slice(0, 8)
            .map((item) => `<a href="${serviceLink(item.title)}">${item.title}</a>`)
            .join("")}
          <a class="text-link" href="services.html">View all services -></a>
        </aside>
      </div>
    </section>
  `;
}

function introFor(service) {
  return `${service.title} is part of our ${service.category.toLowerCase()} support for founders, companies, firms, NGOs, and growing businesses that need accurate documentation, timely filings, and clear professional guidance.`;
}

function whatIsFor(service) {
  if (service.category.includes("IPR")) {
    return `${service.title} helps protect or enforce business assets such as brand identity, inventions, product appearance, origin-linked reputation, or intellectual property rights. It reduces risk and creates a clearer legal position for commercial use.`;
  }
  if (service.category.includes("Taxation") || service.category.includes("Accounting")) {
    return `${service.title} is a finance and tax support service that keeps reporting, records, and filings organized. It helps businesses and individuals maintain compliance while improving decision quality.`;
  }
  if (service.category.includes("RBI")) {
    return `${service.title} relates to regulatory reporting and compliance for foreign investment, overseas borrowings, cross-border transactions, or RBI/FEMA-facing obligations.`;
  }
  return `${service.title} is a structured registration, compliance, or advisory service that helps your business meet legal requirements and operate with greater confidence.`;
}

function howItWorksFor(service) {
  return `Regitrust first understands your business model, jurisdiction, ownership structure, and required outcome. Then we confirm the document checklist, prepare or review filings, coordinate submissions where applicable, and keep you updated until completion.`;
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

renderServiceCatalogue();
renderServiceDetail();
