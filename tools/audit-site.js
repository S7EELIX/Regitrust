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

  if (htmlFile !== "404.html" && !html.includes('src="script.js"')) {
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
