const SHEET_NAME = "Leads";

const HEADERS = [
  "received_at",
  "name",
  "phone",
  "email",
  "city_state",
  "service",
  "business_stage",
  "urgency",
  "preferred_contact",
  "preferred_time",
  "message",
  "source_page",
  "source_url",
  "source_path",
  "source_title",
  "page_url",
  "page_path",
  "page_title",
  "service_name",
  "lead_context",
  "referrer_url",
  "first_landing_url",
  "first_referrer_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "submitted_at",
  "lead_channel",
  "form_id",
  "user_agent"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getLeadSheet_();
    const payload = parsePayload_(e);
    const row = HEADERS.map((header) => {
      if (header === "received_at") {
        return new Date();
      }
      return payload[header] || "";
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "Regitrust lead capture is ready." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const hasHeaders = firstRow.some((value) => value);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const existingHeaders = firstRow.map((value) => String(value || "").trim()).filter(Boolean);
  const missingHeaders = HEADERS.filter((header) => existingHeaders.indexOf(header) === -1);
  if (missingHeaders.length) {
    sheet.getRange(1, sheet.getLastColumn() + 1, 1, missingHeaders.length).setValues([missingHeaders]);
  }

  return sheet;
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      return e.parameter || {};
    }
  }

  return (e && e.parameter) || {};
}
