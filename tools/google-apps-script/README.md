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

After this, FormSubmit will still email leads, and the same successful leads will also be copied into a `Leads` tab in the Google Sheet.

## Quick Verification

1. Open the Web app URL in a browser. It should return a JSON message saying the lead capture is ready.
2. Submit a small test lead from the website contact form.
3. Confirm a new row appears in the `Leads` tab with contact details, page context, attribution fields, and form metadata.
4. Delete the test row after confirming the flow.

## Updating an Existing Deployment

When `lead-capture.gs` changes, open the existing Apps Script project, replace the code, and deploy a new web app version. The sheet will add any new missing columns, such as `lead_context` or `preferred_time`, the next time a lead is received.
