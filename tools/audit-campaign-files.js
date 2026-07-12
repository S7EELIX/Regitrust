const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const siteOrigin = "https://regitrust.in/";
const problems = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8").trim();
}

function addProblem(file, message, detail = "") {
  problems.push({ file, message, detail });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(file) {
  const lines = read(file).split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  return {
    headers,
    rows: lines.slice(1).map((line, index) => ({
      line: index + 2,
      values: parseCsvLine(line)
    }))
  };
}

function assertHeaders(file, actual, expected) {
  if (actual.join("|") !== expected.join("|")) {
    addProblem(file, "Unexpected CSV headers", actual.join(","));
  }
}

function localPathFromUrl(url) {
  if (!url.startsWith(siteOrigin)) {
    return "";
  }
  return url.slice(siteOrigin.length) || "index.html";
}

function checkLandingUrl(file, row, url) {
  const localPath = localPathFromUrl(url);
  if (!localPath) {
    addProblem(file, "Landing page URL should use production domain", `line ${row.line}: ${url}`);
    return;
  }
  if (localPath === "sitemap.xml") {
    return;
  }
  if (!fs.existsSync(path.join(root, localPath))) {
    addProblem(file, "Landing page target does not exist", `line ${row.line}: ${url}`);
  }
}

const keywordCsv = parseCsv("ads-keywords.csv");
assertHeaders("ads-keywords.csv", keywordCsv.headers, ["Ad group", "Keyword", "Match type", "Landing page", "Intent"]);
keywordCsv.rows.forEach((row) => {
  if (row.values.length !== keywordCsv.headers.length) {
    addProblem("ads-keywords.csv", "Row has incorrect column count", `line ${row.line}`);
  }
  checkLandingUrl("ads-keywords.csv", row, row.values[3] || "");
});

const copyCsv = parseCsv("ads-copy.csv");
assertHeaders("ads-copy.csv", copyCsv.headers, ["Ad group", "Type", "Copy", "Landing page"]);
copyCsv.rows.forEach((row) => {
  if (row.values.length !== copyCsv.headers.length) {
    addProblem("ads-copy.csv", "Row has incorrect column count", `line ${row.line}`);
  }
  if (!["Headline", "Description"].includes(row.values[1])) {
    addProblem("ads-copy.csv", "Ad copy type should be Headline or Description", `line ${row.line}: ${row.values[1]}`);
  }
  checkLandingUrl("ads-copy.csv", row, row.values[3] || "");
});

const negativeCsv = parseCsv("ads-negative-keywords.csv");
assertHeaders("ads-negative-keywords.csv", negativeCsv.headers, ["Keyword", "Match type", "Reason"]);
negativeCsv.rows.forEach((row) => {
  if (row.values.length !== negativeCsv.headers.length) {
    addProblem("ads-negative-keywords.csv", "Row has incorrect column count", `line ${row.line}`);
  }
  if (!["Broad", "Phrase", "Exact"].includes(row.values[1])) {
    addProblem("ads-negative-keywords.csv", "Negative match type should be Broad, Phrase, or Exact", `line ${row.line}: ${row.values[1]}`);
  }
});

console.log(JSON.stringify({
  summary: {
    keywordRows: keywordCsv.rows.length,
    copyRows: copyCsv.rows.length,
    negativeRows: negativeCsv.rows.length,
    problems: problems.length
  },
  problems
}, null, 2));

if (problems.length > 0) {
  process.exit(1);
}
