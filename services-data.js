const serviceCategories = [
    {
        "title":  "Company Registration",
        "summary":  "Company, LLP, proprietorship, and startup registrations for Indian businesses.",
        "groups":  [
                       {
                           "title":  "Company Registration",
                           "items":  [
                                         "Private Limited Company Registration",
                                         "One Person Company (OPC) Registration",
                                         "LLP Registration",
                                         "Partnership Firm Registration",
                                         "Sole Proprietorship Registration",
                                         "Startup India Registration"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Government Registration",
        "summary":  "Licences and registrations required for tax, trade, food, labour, and business operations.",
        "groups":  [
                       {
                           "title":  "Government Registration",
                           "items":  [
                                         "GST Registration",
                                         "Import Export Code (IEC) Registration",
                                         "FSSAI Registration",
                                         "Shop \u0026 Establishment Registration",
                                         "MSME (Udyam) Registration",
                                         "Professional Tax Registration",
                                         "IEC Modification",
                                         "FSSAI License Renewal",
                                         "FSSAI Central License",
                                         "FSSAI State License",
                                         "Trade License Registration",
                                         "Labour License Registration",
                                         "EPF Registration",
                                         "ESIC Registration"
                                     ]
                       }
                   ]
    },
    {
        "title":  "International Business Registration",
        "summary":  "Import, export, and cross-border compliance support for Indian businesses.",
        "groups":  [
                       {
                           "title":  "International Business Registration",
                           "items":  [
                                         "Import Compliance Services",
                                         "Export Compliance Services"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Compliance",
        "summary":  "Recurring and closure compliance for companies, LLPs, and growing businesses.",
        "groups":  [
                       {
                           "title":  "Compliance",
                           "items":  [
                                         "Annual ROC Filing",
                                         "LLP Annual Filing",
                                         "Business Compliance Management",
                                         "Corporate Secretarial Services",
                                         "Company Strike Off / Business Closure"
                                     ]
                       }
                   ]
    },
    {
        "title":  "MCA Services",
        "summary":  "Company law changes, director updates, share capital actions, and MCA filings.",
        "groups":  [
                       {
                           "title":  "MCA Services",
                           "items":  [
                                         "DIN Registration",
                                         "DSC Registration",
                                         "Company Name Change",
                                         "Registered Office Change",
                                         "Director Addition",
                                         "Director Resignation",
                                         "Share Transfer",
                                         "Authorized Capital Increase",
                                         "MOA Amendment",
                                         "AOA Amendment"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Intellectual Property Rights",
        "summary":  "Trademark, copyright, and brand protection services for business assets.",
        "groups":  [
                       {
                           "title":  "Intellectual Property Rights",
                           "items":  [
                                         "Trademark Registration",
                                         "Trademark Objection Reply",
                                         "Trademark Renewal",
                                         "Copyright Registration",
                                         "Trademark Hearing Representation"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Taxation",
        "summary":  "GST, income tax, TDS, and related tax compliance services.",
        "groups":  [
                       {
                           "title":  "Taxation",
                           "items":  [
                                         "GST Return Filing",
                                         "PAN Application",
                                         "TAN Application",
                                         "Income Tax Return Filing",
                                         "TDS Return Filing",
                                         "GST Notice Reply",
                                         "Income Tax Notice Reply",
                                         "GST Cancellation",
                                         "GST Revocation",
                                         "GST LUT Filing",
                                         "GST Annual Return Filing",
                                         "E-Invoicing Registration"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Legal Documentation",
        "summary":  "Business agreements, employment documents, founder documents, and legal certificates.",
        "groups":  [
                       {
                           "title":  "Legal Documentation",
                           "items":  [
                                         "Business Agreement Drafting",
                                         "Employment Agreement Drafting",
                                         "Vendor Agreement Drafting",
                                         "Founders Agreement Drafting",
                                         "NDA Drafting",
                                         "LLP Agreement Drafting",
                                         "LLP Agreement Amendment",
                                         "Partnership Deed Drafting",
                                         "Partnership Deed Amendment",
                                         "Legal Heir Certificate Assistance"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Consulting",
        "summary":  "Startup, due diligence, and business advisory services.",
        "groups":  [
                       {
                           "title":  "Consulting",
                           "items":  [
                                         "Startup Legal Advisory",
                                         "Due Diligence Services"
                                     ]
                       }
                   ]
    },
    {
        "title":  "Accounting",
        "summary":  "Finance, bookkeeping, payroll, and virtual CFO support.",
        "groups":  [
                       {
                           "title":  "Accounting",
                           "items":  [
                                         "Virtual CFO Services",
                                         "Accounting \u0026 Bookkeeping Services",
                                         "Payroll Management Services"
                                     ]
                       }
                   ]
    }
];

function serviceSlug(title) {
  return title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function flattenServices() {
  return serviceCategories.flatMap((category) =>
    category.groups.flatMap((group) =>
      group.items.map((item) => ({
        title: item,
        slug: serviceSlug(item),
        category: category.title,
        group: group.title,
        categorySummary: category.summary
      }))
    )
  );
}

window.REGITRUST_SERVICE_CATEGORIES = serviceCategories;
window.REGITRUST_SERVICES = flattenServices();
window.REGITRUST_SERVICE_SLUG = serviceSlug;