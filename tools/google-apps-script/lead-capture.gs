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
  "message",
  "source_page",
  "source_url",
  "source_path",
  "source_title",
  "page_url",
  "page_path",
  "page_title",
  "service_name",
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

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = firstRow.some((value) => value);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
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
