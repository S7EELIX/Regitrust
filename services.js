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
    canonical.setAttribute("href", `https://regitrust.in/service.html?service=${service.slug}`);
  }

  detail.innerHTML = `
    <section class="section section-muted service-hero">
      <div class="container service-hero-grid">
        <div>
          <span class="pill">${escapeHtml(category)}</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(introFor(service, content))}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="contact.html" data-track="service_detail_consultation_click">Book Consultation</a>
            <a class="btn btn-secondary" href="https://wa.me/918984297666" target="_blank" rel="noopener noreferrer" data-track="service_detail_whatsapp_click">Chat on WhatsApp</a>
          </div>
        </div>
        <aside class="service-note">
          <h2>Page Contents</h2>
          <p>Meaning, suitability, benefits, documents, process, government fees, timeline, compliance steps, common mistakes, and FAQs.</p>
        </aside>
      </div>
    </section>

    <section class="section">
      <div class="container service-article">
        <article>
          ${content ? renderRichService(content) : renderFallbackService(service)}
        </article>

        <aside class="related-services">
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
    <h2>Meaning</h2>
    <p>${escapeHtml(content.meaning)}</p>
    ${renderListSection("Who Should Choose It", content.whoShouldChooseIt)}
    ${renderListSection("Benefits", content.benefits)}
    ${renderListSection("Documents Required", content.documentsRequired)}
    <h2>Process</h2>
    <ol class="process-list">${content.process.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
    <h2>Government Fees</h2>
    <p>${escapeHtml(content.governmentFees)}</p>
    <h2>Time Required</h2>
    <p>${escapeHtml(content.timeRequired)}</p>
    ${renderListSection("Compliance / Next Steps", content.complianceNextSteps)}
    ${renderListSection("Common Mistakes", content.commonMistakes)}
    <h2>FAQs</h2>
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
    <h2>Meaning</h2>
    <p>${escapeHtml(service.title)} is a structured registration, compliance, taxation, legal documentation, or advisory service for Indian businesses.</p>
    <h2>Process</h2>
    <ol class="process-list">
      ${processFor(service).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
    </ol>
  `;
}

function renderListSection(title, items) {
  return `
    <h2>${escapeHtml(title)}</h2>
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

renderServiceCatalogue();
renderServiceDetail();
