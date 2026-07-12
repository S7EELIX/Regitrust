# Regitrust Website

Static website for Regitrust Services LLP, focused on company registration, GST, compliance, trademark, foreign company, NRI, South India, and India market-entry lead generation.

## Local Editing

- Open the folder in VS Code or any editor.
- Serve the site with a static server such as Live Server on port `5500`.
- Main shared files:
  - `index.html` for the homepage.
  - `style.css` for shared visual styling.
  - `script.js` for shared navigation, lead context, analytics, and form behavior.
  - `services-data.js`, `services-content.js`, and `services.js` for the service catalogue and dynamic service detail page.
  - `lead-config.js` for the deployed Google Apps Script lead backup URL.

## Verification

Run these before pushing changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\check-site.ps1
```

Or run the same checks directly:

```powershell
& "C:\Users\rajra\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools\audit-site.js
& "C:\Users\rajra\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools\audit-seo.js
& "C:\Users\rajra\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tools\verify-runtime.js
& "E:\CodexTools\PortableGit\bin\git.exe" diff --check
```

Expected results:

- `verify-runtime.js` reports `30` checks and `0` failures.
- `audit-site.js` reports `0` problems.
- `audit-seo.js` reports `0` problems.
- `git diff --check` exits cleanly.

Optional visual QA after starting a local static server:

```powershell
$env:NODE_PATH = "E:\CodexTools\regitrust-visual\node_modules"
$env:PLAYWRIGHT_BROWSERS_PATH = "E:\CodexTools\ms-playwright"
& "E:\CodexTools\node\node.exe" tools\visual-check.js http://localhost:5500
```

Screenshots are written outside the repo to `E:\CodexTools\regitrust-visual\screenshots`.

## Lead Capture

Primary lead delivery goes through FormSubmit email. Successful form submissions are also copied to Google Sheets through the Apps Script URL in `lead-config.js`.

Apps Script setup and verification steps live in `tools/google-apps-script/README.md`.

## Campaign Operations

- `ads-campaign-brief.md` summarizes one-campaign routing, message direction, and exclusions.
- `ads-keywords.csv` lists starter keyword/ad-group/landing-page routing.
- `ads-negative-keywords.csv` lists low-fit exclusions for shop, grocery, job, loan, and local licence traffic.
- `today-action-checklist.md` gives the current ads, Search Console, Apps Script, and lead-review steps.
- `lead-review-template.csv` is a quick manual sheet for tagging lead quality and ad/search term notes.
