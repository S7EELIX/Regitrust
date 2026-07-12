const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const siteOrigin = "https://regitrust.in";
const problems = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function addProblem(file, message, detail = "") {
  problems.push({ file, message, detail });
}

function loadServiceData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("services-data.js"), context);
  return context.window.REGITRUST_SERVICES || [];
}

function extractJsonLdBlocks(html) {
  return [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim());
}

function extractMeta(html, attrName, attrValue) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\s${attrName}=["']${attrValue}["'])(?=[^>]*\\scontent=["']([^"']+)["'])[^>]*>`, "i");
  return html.match(pattern)?.[1] || "";
}

function extractCleanServiceUrls() {
  const source = read("services.js");
  const objectMatch = source.match(/const CLEAN_SERVICE_URLS = \{([\s\S]*?)\n\};/);
  if (!objectMatch) {
    return {};
  }
  return Object.fromEntries(
    [...objectMatch[1].matchAll(/"([^"]+)":\s*"([^"]+\.html)"/g)].map((match) => [match[1], match[2]])
  );
}

function extractCanonical(html) {
  return html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || "";
}

function isNoindex(html) {
  return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
}

const htmlFiles = fs.readdirSync(root)
  .filter((file) => /\.html?$/i.test(file))
  .sort();
const services = loadServiceData();
const serviceSlugs = services.map((service) => service.slug).sort();
const cleanServiceUrls = extractCleanServiceUrls();
const snippetTargets = {
  "index.html": /(NRI|foreign|overseas|exporter)/i,
  "nri-company-registration-india.html": /(NRI|foreign founder)/i,
  "foreign-company-registration-india.html": /(foreign company|foreign founder|overseas)/i,
  "india-market-entry-services.html": /(market entry|overseas)/i,
  "south-india-business-registration.html": /(Bengaluru|Chennai|Hyderabad)/i,
  "company-registration-bengaluru.html": /Bengaluru/i,
  "company-registration-chennai.html": /Chennai/i,
  "company-registration-hyderabad.html": /Hyderabad/i,
  "gst-registration-bengaluru.html": /Bengaluru/i,
  "gst-registration-chennai.html": /Chennai/i,
  "gst-registration-hyderabad.html": /Hyderabad/i
};
const requiredJsonLdTypes = {
  "foreign-company-registration-india.html": "Service",
  "nri-company-registration-india.html": "Service",
  "india-market-entry-services.html": "Service"
};

const indexableHtmlFiles = [];

for (const htmlFile of htmlFiles) {
  const html = read(htmlFile);
  const noindex = isNoindex(html);
  const publicPath = htmlFile === "index.html" ? "" : htmlFile;
  const expectedUrl = `${siteOrigin}/${publicPath}`;

  if (!noindex && htmlFile !== "404.html" && htmlFile !== "company-registration.htm") {
    indexableHtmlFiles.push(htmlFile);
  }

  if (!noindex) {
    const canonical = extractCanonical(html);
    if (!canonical) {
      addProblem(htmlFile, "Indexable page is missing canonical URL");
    } else if (canonical !== expectedUrl) {
      addProblem(htmlFile, "Indexable page canonical does not match public URL", canonical);
    }
  }

  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
  const description = extractMeta(html, "name", "description");
  if (!noindex && title.length > 60) {
    addProblem(htmlFile, "Title may be too long for search result display", title);
  }
  if (!noindex && (description.length < 80 || description.length > 165)) {
    addProblem(htmlFile, "Meta description should be concise and useful", `${description.length} chars`);
  }
  if (!noindex && snippetTargets[htmlFile] && !snippetTargets[htmlFile].test(`${title} ${description}`)) {
    addProblem(htmlFile, "High-intent page snippet is missing its target audience or location term");
  }

  const jsonLdTypes = [];
  extractJsonLdBlocks(html).forEach((block, index) => {
    try {
      const parsed = JSON.parse(block);
      const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
      graph.forEach((node) => {
        const type = Array.isArray(node["@type"]) ? node["@type"].join(",") : node["@type"];
        if (type) {
          jsonLdTypes.push(type);
        }
        if (!type) {
          addProblem(htmlFile, "JSON-LD node is missing @type", `block ${index + 1}`);
        }
        if (node.url && typeof node.url === "string" && node.url.startsWith("http://")) {
          addProblem(htmlFile, "JSON-LD URL should use HTTPS", node.url);
        }
      });
    } catch (error) {
      addProblem(htmlFile, "Invalid JSON-LD block", `block ${index + 1}: ${error.message}`);
    }
  });
  if (requiredJsonLdTypes[htmlFile] && !jsonLdTypes.some((type) => type.split(",").includes(requiredJsonLdTypes[htmlFile]))) {
    addProblem(htmlFile, "Priority landing page is missing required JSON-LD type", requiredJsonLdTypes[htmlFile]);
  }
}

const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapSet = new Set(sitemapUrls);
const expectedSitemapUrls = [
  `${siteOrigin}/`,
  ...indexableHtmlFiles
    .filter((file) => file !== "index.html" && file !== "service.html")
    .map((file) => `${siteOrigin}/${file}`),
  ...serviceSlugs
    .map((slug) => `${siteOrigin}/${cleanServiceUrls[slug] || `service.html?service=${slug}`}`)
].sort();

expectedSitemapUrls.forEach((url) => {
  if (!sitemapSet.has(url)) {
    addProblem("sitemap.xml", "Missing expected indexable URL", url);
  }
});

sitemapUrls.forEach((url) => {
  if (!expectedSitemapUrls.includes(url)) {
    addProblem("sitemap.xml", "Unexpected or non-indexable URL in sitemap", url);
  }
});

if (sitemapUrls.length !== sitemapSet.size) {
  addProblem("sitemap.xml", "Duplicate URLs found in sitemap");
}

const robots = read("robots.txt");
if (!/Sitemap:\s*https:\/\/regitrust\.in\/sitemap\.xml/i.test(robots)) {
  addProblem("robots.txt", "robots.txt should point to canonical sitemap URL");
}
if (!/User-agent:\s*\*/i.test(robots)) {
  addProblem("robots.txt", "robots.txt should declare a default user-agent");
}
if (sitemapUrls.some((url) => url.includes("/service.html?service=")) && isNoindex(read("service.html"))) {
  addProblem("service.html", "Dynamic service shell must stay indexable while query service URLs are in the sitemap");
}

console.log(JSON.stringify({
  summary: {
    htmlFiles: htmlFiles.length,
    indexableHtmlFiles: indexableHtmlFiles.length,
    serviceSlugs: serviceSlugs.length,
    sitemapUrls: sitemapUrls.length,
    problems: problems.length
  },
  problems
}, null, 2));

if (problems.length > 0) {
  process.exit(1);
}
