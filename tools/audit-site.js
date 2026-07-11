const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const files = fs.readdirSync(root);
const markupFiles = files.filter((file) => /\.html?$/i.test(file)).sort();
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
const cleanServiceUrls = extractCleanServiceUrls(read("services.js"));
const problems = [];
const styleVersions = new Set();
const allowedPhoneHrefs = new Set(["tel:+918984297666", "tel:+916306898090"]);

function extractCleanServiceUrls(source) {
  const objectMatch = source.match(/const CLEAN_SERVICE_URLS = \{([\s\S]*?)\n\};/);
  if (!objectMatch) {
    return {};
  }

  return Object.fromEntries(
    [...objectMatch[1].matchAll(/"([^"]+)":\s*"([^"]+\.html)"/g)].map((match) => [match[1], match[2]])
  );
}

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

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    return "";
  }
  return `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}`;
}

for (const markupFile of markupFiles) {
  const html = read(markupFile);

  if (/\sstyle="/.test(html)) {
    addProblem(markupFile, "Inline style attribute should move to shared CSS");
  }

  if (/\son[a-z]+=["']/i.test(html)) {
    addProblem(markupFile, "Inline event handler should move to shared JS");
  }

  collectAttributes(html, "href")
    .filter((href) => /^javascript:/i.test(href))
    .forEach((href) => addProblem(markupFile, "JavaScript href should move to shared JS", href));
}

for (const htmlFile of htmlFiles) {
  const html = read(htmlFile);
  const expectedPublicPath = htmlFile === "index.html" ? "" : htmlFile;
  const expectedPublicUrl = `https://regitrust.in/${expectedPublicPath}`;

  const styleMatch = html.match(/<link\s+rel="stylesheet"\s+href="style\.css(\?v=([^"]+))?"/);
  if (!styleMatch) {
    addProblem(htmlFile, "Missing shared stylesheet link");
  } else if (!styleMatch[2]) {
    addProblem(htmlFile, "Shared stylesheet link should use cache version");
  } else {
    styleVersions.add(styleMatch[2]);
  }

  if (htmlFile !== "404.html" && !/src="script\.js(?:\?[^"]*)?"/.test(html)) {
    addProblem(htmlFile, "Missing shared script include");
  }

  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) {
    addProblem(htmlFile, "Missing or very short meta description");
  }

  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)">/);
  if (!canonicalMatch) {
    addProblem(htmlFile, "Missing canonical URL");
  } else if (canonicalMatch[1] !== expectedPublicUrl) {
    addProblem(htmlFile, "Canonical URL should match page path", canonicalMatch[1]);
  }

  const ogUrlMatch = html.match(/<meta property="og:url" content="([^"]+)">/);
  if (!ogUrlMatch) {
    addProblem(htmlFile, "Missing Open Graph URL");
  } else if (ogUrlMatch[1] !== expectedPublicUrl) {
    addProblem(htmlFile, "Open Graph URL should match page path", ogUrlMatch[1]);
  }

  const ids = collectAttributes(html, "id");
  ids
    .filter((id, index) => ids.indexOf(id) !== index)
    .forEach((id) => addProblem(htmlFile, "Duplicate id attribute", id));

  [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].forEach((match) => {
    const tag = match[0];
    const relMatch = tag.match(/\srel=["']([^"']+)["']/i);
    const relTokens = relMatch ? relMatch[1].toLowerCase().split(/\s+/) : [];
    if (!relTokens.includes("noopener") || !relTokens.includes("noreferrer")) {
      addProblem(htmlFile, "New-tab links should use rel=\"noopener noreferrer\"", tag);
    }
  });

  [...html.matchAll(/<img\b[^>]*>/gi)].forEach((match) => {
    const tag = match[0];
    if (!/\salt=["'][^"']*["']/i.test(tag)) {
      addProblem(htmlFile, "Image is missing alt text", tag);
    }
  });

  collectAttributes(html, "href").forEach((href) => {
    if (href.startsWith("tel:") && !allowedPhoneHrefs.has(href)) {
      addProblem(htmlFile, "Unexpected phone CTA target", href);
    }

    if ((href.includes("wa.me/") || href.includes("api.whatsapp.com/")) && !href.includes("918984297666")) {
      addProblem(htmlFile, "Unexpected WhatsApp CTA target", href);
    }

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
const cname = read("CNAME").trim();
const manifest = JSON.parse(read("site.webmanifest"));
const searchConsoleUrls = read("seo-search-console-urls.txt");
const sitemapPaths = [...sitemap.matchAll(/<loc>https:\/\/regitrust\.in\/([^<]*)<\/loc>/g)]
  .map((match) => match[1] || "index.html")
  .map((pathname) => pathname === "" ? "index.html" : pathname);
const searchConsolePaths = [...searchConsoleUrls.matchAll(/^https:\/\/regitrust\.in\/([^\s]*)$/gm)]
  .map((match) => match[1] || "index.html")
  .map((pathname) => pathname === "" ? "index.html" : pathname);

sitemapPaths
  .filter((pathname, index) => sitemapPaths.indexOf(pathname) !== index)
  .forEach((pathname) => addProblem("sitemap.xml", "Duplicate sitemap URL", pathname));

if (sitemapPaths.includes("service.html")) {
  addProblem("sitemap.xml", "Dynamic service template should not be submitted directly", "service.html");
}

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
      return;
    }

    const declaredSizes = String(icon.sizes || "").split(/\s+/).filter(Boolean);
    if (!declaredSizes.includes(pngSize(iconPath))) {
      addProblem("site.webmanifest", "Manifest icon size does not match PNG dimensions", icon.src || "");
    }
  });
}

if (cname !== "regitrust.in") {
  addProblem("CNAME", "Unexpected production domain", cname);
}

if (manifest.start_url !== "/" || manifest.scope !== "/") {
  addProblem("site.webmanifest", "Manifest should start at the production root");
}

sitemapPaths
  .filter((pathname) => !pathname.includes("?") && !exists(pathname))
  .forEach((pathname) => addProblem("sitemap.xml", "Broken sitemap local target", pathname));

searchConsolePaths
  .filter((pathname) => !exists(pathname))
  .forEach((pathname) => addProblem("seo-search-console-urls.txt", "Broken Search Console URL target", pathname));

searchConsolePaths
  .filter((pathname) => !sitemapPaths.includes(pathname))
  .forEach((pathname) => addProblem("seo-search-console-urls.txt", "Search Console URL missing from sitemap", pathname));

sitemapPaths
  .filter((pathname) => pathname.startsWith("service.html?service="))
  .map((pathname) => decodeURIComponent(pathname.slice("service.html?service=".length)))
  .filter((slug) => !serviceSlugs.includes(slug))
  .forEach((slug) => addProblem("sitemap.xml", "Broken sitemap service slug", slug));

htmlFiles
  .filter((htmlFile) => /<meta name="robots" content="[^"]*noindex/i.test(read(htmlFile)))
  .filter((htmlFile) => sitemapPaths.includes(htmlFile))
  .forEach((htmlFile) => addProblem("sitemap.xml", "Noindex page should not be in sitemap", htmlFile));

const cacheVersionedScripts = [
  ["script.js", "Shared script"],
  ["services.js", "Services script"],
  ["services-data.js", "Services data script"],
  ["services-content.js", "Services content script"],
  ["lead-config.js", "Lead config script"]
];
const scriptVersionSets = Object.fromEntries(cacheVersionedScripts.map(([file]) => [file, new Set()]));
htmlFiles.forEach((htmlFile) => {
  const html = read(htmlFile);
  cacheVersionedScripts.forEach(([file, label]) => {
    const escapedFile = file.replace(".", "\\.");
    const match = html.match(new RegExp(`src="${escapedFile}(\\?v=([^"]+))?"`));
    if (match) {
      if (!match[2]) {
        addProblem(htmlFile, `${label} include should use cache version`);
        return;
      }
      scriptVersionSets[file].add(match[2]);
    }
  });
});

cacheVersionedScripts.forEach(([file, label]) => {
  const versions = scriptVersionSets[file];
  if (versions.size > 1) {
    addProblem(file, `${label} cache versions differ`, [...versions].sort().join(", "));
  }
});

if (styleVersions.size > 1) {
  addProblem("style.css", "Shared stylesheet cache versions differ", [...styleVersions].sort().join(", "));
}

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
