const menuBtn = document.getElementById("menu-btn");
const nav = document.getElementById("site-nav");
const year = document.getElementById("year");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const serviceSelect = document.getElementById("service");

const GA4_MEASUREMENT_ID = "G-XXXXXXXXXX";

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
    window.gtag("event", eventName, params);
  }
}

setupAnalytics();

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
    const formData = new FormData(contactForm);

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
        page_location: window.location.pathname
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

document.querySelectorAll("[data-track]").forEach((element) => {
  element.addEventListener("click", () => {
    const name = element.getAttribute("data-track");
    if (name) {
      trackEvent(name, { page_location: window.location.pathname });
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
