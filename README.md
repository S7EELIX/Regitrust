# Regitrust Website

Static website for Regitrust Services LLP, focused on company registration, GST, compliance, trademark, NRI, South India, and India market-entry lead generation.

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
node tools\verify-runtime.js
node tools\audit-site.js
git diff --check
```

Expected results:

- `verify-runtime.js` reports `27` checks and `0` failures.
- `audit-site.js` reports `0` problems.
- `git diff --check` exits cleanly.

## Lead Capture

Primary lead delivery goes through FormSubmit email. Successful form submissions are also copied to Google Sheets through the Apps Script URL in `lead-config.js`.

Apps Script setup and verification steps live in `tools/google-apps-script/README.md`.
