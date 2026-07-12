# Regitrust Action Checklist - 2026-07-12

## Google Ads

1. Add negative keywords from `ads-negative-keywords.csv`.
2. Use `ads-keywords.csv` for keyword/ad-group routing.
3. Use `ads-copy.csv` for starter headlines and descriptions.
4. Keep one campaign, but split ad groups by intent:
   - Foreign company / foreign founder -> `https://regitrust.in/foreign-company-registration-india.html`
   - NRI setup -> `https://regitrust.in/nri-company-registration-india.html`
   - India market entry / IEC / GST / import-export -> `https://regitrust.in/india-market-entry-services.html`
5. Pause or reduce any ad group that brings grocery, kirana, shop act, trade license, food license, restaurant, or street-vendor enquiries.
6. Use scope-first ad copy. Do not promise fixed pricing.

## Search Console

Use `seo-search-console-urls.txt` for the priority inspection URLs.

1. Inspect `https://regitrust.in/foreign-company-registration-india.html`.
2. Request indexing if Google has not crawled it.
3. Confirm sitemap is submitted: `https://regitrust.in/sitemap.xml`.

## Lead Sheet / Apps Script

1. Update the deployed Apps Script with `tools/google-apps-script/lead-capture.gs`.
2. Deploy a new web app version.
3. Submit one test lead.
4. Confirm the sheet includes `campaign_focus`, `audience_priority`, `lead_intent`, `lead_fit`, `setup_scope`, `budget_readiness`, and `preferred_time`.
5. Delete the test lead row after confirming.

## Lead Review

Use `lead-review-template.csv` if you want a quick manual review sheet.

For every lead today, tag it manually as:

- High fit: foreign founder, NRI, overseas company, SaaS, exporter, India entry.
- Medium fit: South India company/GST/compliance with serious business scope.
- Low fit: grocery, kirana, food stall, local shop license, cheapest-only, job/loan enquiry.

Use low-fit lead wording to add more negative keywords.
