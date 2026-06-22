# Regitrust Lead Sheet Setup

Use this once from the Google account that should own the lead sheet.

1. Create a Google Sheet named `Regitrust Website Leads`.
2. Open `Extensions > Apps Script`.
3. Paste `lead-capture.gs` into the Apps Script editor.
4. Click `Deploy > New deployment`.
5. Choose `Web app`.
6. Set `Execute as` to `Me`.
7. Set `Who has access` to `Anyone`.
8. Authorize and copy the Web app URL.
9. Paste that URL into `lead-config.js` as `window.REGITRUST_LEAD_WEBHOOK_URL`.

After this, FormSubmit will still email leads, and the same successful leads will also be copied into the Google Sheet.
