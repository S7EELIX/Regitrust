const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const files = fs.readdirSync(root);
const htmlFiles = files.filter((file) => file.endsWith(".html")).sort();
const assetFiles = files
  .concat(fs.readdirSync(path.join(root, "assets")).map((file) => `assets/${file}`))
  .sort();

const context = { window: {} };
vm.createContext(context);
vm.runInContext(read("services-data.js"), context);
vm.runInContext(read("services-content.js"), context);

const slugFor = context.window.REGITRUST_SERVICE_SLUG;
const categories = context.window.REGITRUST_SERVICE_CATEGORIES || [];
const services = context.window.REGITRUST_SERVICES || [];
const serviceContent = context.window.REGITRUST_SERVICE_CONTENT || {};
const categoryIds = categories.map((category) => slugFor(category.title));
const serviceSlugs = services.map((service) => service.slug);
const serviceContentSlugs = Object.keys(serviceContent);
const cleanServiceUrls = {
  "private-limited-company-registration": "company-registration.html",
  "gst-registration": "gst-pan.html",
  "trademark-registration": "trademark-registration.html",
  "one-person-company-opc-registration": "opc-registration.html",
  "annual-roc-filing": "annual-roc-filing.html",
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
  "din-registration": "din-registration.html",
  "company-name-change": "company-name-change.html",
  "registered-office-change": "registered-office-change.html",
  "director-addition": "director-addition.html",
  "director-resignation": "director-resignation.html",
  "copyright-registration": "copyright-registration.html",
  "shop-and-establishment-registration": "shop-establishment-registration.html",
  "trade-license-registration": "trade-license-registration.html",
  "professional-tax-registration": "professional-tax-registration.html",
  "gst-cancellation": "gst-cancellation.html",
  "gst-revocation": "gst-revocation.html",
  "gst-lut-filing": "gst-lut-filing.html",
  "gst-annual-return-filing": "gst-annual-return-filing.html",
  "fssai-license-renewal": "fssai-license-renewal.html",
  "fssai-state-license": "fssai-state-license.html",
  "fssai-central-license": "fssai-central-license.html",
  "pan-application": "pan-tan-application.html",
  "tan-application": "pan-tan-application.html"
};
const problems = [];

function addProblem(file, message, detail = "") {
  problems.push({ file, message, detail });
}

function localTarget(href) {
  if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(href)) {
    return null;
  }
  const [withoutHash, hash = ""] = href.split("#");
  const [pathname, query = ""] = withoutHash.split("?");
  return {
    pathname: pathname.replace(/^\.\//, ""),
    query,
    hash
  };
}

function collectAttributes(html, attr) {
  const pattern = new RegExp(`${attr}=["']([^"']+)["']`, "g");
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

for (const htmlFile of htmlFiles) {
  const html = read(htmlFile);

  if (!html.includes('rel="stylesheet" href="style.css"')) {
    addProblem(htmlFile, "Missing shared stylesheet link");
  }

  if (htmlFile !== "404.html" && !/src="script\.js(?:\?[^"]*)?"/.test(html)) {
    addProblem(htmlFile, "Missing shared script include");
  }

  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) {
    addProblem(htmlFile, "Missing or very short meta description");
  }

  if (!/<link rel="canonical" href="https:\/\/regitrust\.in\/[^"]*">/.test(html)) {
    addProblem(htmlFile, "Missing canonical URL");
  }

  const ids = collectAttributes(html, "id");
  ids
    .filter((id, index) => ids.indexOf(id) !== index)
    .forEach((id) => addProblem(htmlFile, "Duplicate id attribute", id));

  collectAttributes(html, "href").forEach((href) => {
    const target = localTarget(href);
    if (!target) {
      return;
    }

    if (target.pathname && !exists(target.pathname)) {
      addProblem(htmlFile, "Broken local href target", href);
      return;
    }

    if (target.pathname === "services.html" && target.hash && !categoryIds.includes(target.hash)) {
      addProblem(htmlFile, "Broken services category anchor", href);
    }

    if (target.query.startsWith("service=")) {
      const serviceSlug = decodeURIComponent(target.query.slice("service=".length));
      if (!serviceSlugs.includes(serviceSlug)) {
        addProblem(htmlFile, "Broken service detail slug", href);
      }
    }
  });

  collectAttributes(html, "src").forEach((src) => {
    const target = localTarget(src);
    if (target && target.pathname && !exists(target.pathname)) {
      addProblem(htmlFile, "Broken local src target", src);
    }
  });
}

serviceSlugs
  .filter((slug) => !serviceContentSlugs.includes(slug))
  .forEach((slug) => addProblem("services-content.js", "Service missing rich content", slug));

serviceContentSlugs
  .filter((slug) => !serviceSlugs.includes(slug))
  .forEach((slug) => addProblem("services-content.js", "Rich content has no matching service", slug));

serviceSlugs
  .filter((slug, index) => serviceSlugs.indexOf(slug) !== index)
  .forEach((slug) => addProblem("services-data.js", "Duplicate service slug", slug));

const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
const manifest = JSON.parse(read("site.webmanifest"));
const sitemapPaths = [...sitemap.matchAll(/<loc>https:\/\/regitrust\.in\/([^<]*)<\/loc>/g)]
  .map((match) => match[1] || "index.html")
  .map((pathname) => pathname === "" ? "index.html" : pathname);

if (!robots.includes("Sitemap: https://regitrust.in/sitemap.xml")) {
  addProblem("robots.txt", "Missing sitemap directive");
}

if (!robots.includes("Allow: /")) {
  addProblem("robots.txt", "Missing crawl allow directive");
}

if (!Array.isArray(manifest.icons) || !manifest.icons.length) {
  addProblem("site.webmanifest", "Missing manifest icons");
} else {
  manifest.icons.forEach((icon) => {
    const iconPath = String(icon.src || "").replace(/^\//, "");
    if (!iconPath || !exists(iconPath)) {
      addProblem("site.webmanifest", "Broken manifest icon", icon.src || "");
    }
  });
}

sitemapPaths
  .filter((pathname) => !pathname.includes("?") && !exists(pathname))
  .forEach((pathname) => addProblem("sitemap.xml", "Broken sitemap local target", pathname));

htmlFiles
  .filter((htmlFile) => /<meta name="robots" content="[^"]*noindex/i.test(read(htmlFile)))
  .filter((htmlFile) => sitemapPaths.includes(htmlFile))
  .forEach((htmlFile) => addProblem("sitemap.xml", "Noindex page should not be in sitemap", htmlFile));

serviceSlugs
  .filter((slug) => {
    const cleanUrl = cleanServiceUrls[slug];
    return !sitemap.includes(`service.html?service=${slug}`) && (!cleanUrl || !sitemap.includes(cleanUrl));
  })
  .forEach((slug) => addProblem("sitemap.xml", "Service missing from sitemap", slug));

assetFiles
  .filter((file) => /\.(png|jpe?g|webp|svg)$/i.test(file))
  .forEach((asset) => {
    if (!files.some((file) => file.endsWith(".html") && read(file).includes(asset)) && !read("site.webmanifest").includes(asset)) {
      addProblem(asset, "Image asset is not referenced by an HTML page or manifest");
    }
  });

const summary = {
  htmlFiles: htmlFiles.length,
  services: serviceSlugs.length,
  serviceContent: serviceContentSlugs.length,
  categories: categoryIds.length,
  problems: problems.length
};

if (problems.length) {
  console.error(JSON.stringify({ summary, problems }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ summary, problems }, null, 2));
