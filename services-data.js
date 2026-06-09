const serviceCategories = [
  {
    title: "Company Registration",
    summary: "Choose the right legal structure for your Indian business, startup, subsidiary, or founder-led venture.",
    groups: [
      {
        title: "Private Company",
        items: [
          "Standalone Private Company",
          "Indian Subsidiary",
          "Foreign Subsidiary"
        ]
      },
      {
        title: "Other Entity Types",
        items: [
          "Public Company",
          "Limited Liability Partnership",
          "Partnership Firm",
          "Non-Government Organization/Not-for-Profit Organization (NGO)",
          "Sole Proprietorship",
          "One Person Company",
          "Startup India"
        ]
      }
    ]
  },
  {
    title: "Government Registration",
    summary: "Licences, registrations, and certificates that help businesses operate smoothly and stay authority-ready.",
    groups: [
      {
        title: "Export-Import Business",
        items: [
          "Import-Export Code",
          "ICEGATE Registration",
          "Port Registration",
          "AD Code Registration"
        ]
      },
      {
        title: "Business Licences and Registrations",
        items: [
          "Professional Tax",
          "PTEC",
          "PTRC",
          "ISO Certification",
          "FSSAI",
          "Shop License",
          "Trade License",
          "12A and 80G Registrations",
          "FCRA Registration",
          "MSME Registration",
          "GST Registration",
          "EPF Registration",
          "ESIC Registration"
        ]
      }
    ]
  },
  {
    title: "International Business Registration",
    summary: "Cross-border setup support for founders planning to operate from major global jurisdictions.",
    groups: [
      {
        title: "Global Company Incorporation",
        items: [
          "Incorporate Company in UK",
          "Incorporate Company in USA",
          "Incorporate Company in UAE"
        ]
      }
    ]
  },
  {
    title: "Compliance",
    summary: "Recurring compliance support to help companies, LLPs, NGOs, proprietorships, and firms avoid filing stress.",
    groups: [
      {
        title: "Annual and Recurring Compliance",
        items: [
          "Business Compliance",
          "MSME Returns",
          "GST Returns",
          "Private Annual Compliance",
          "Private Company Annual Compliance",
          "Small Company Annual Compliance",
          "Startup Company Compliances",
          "LLP Compliances",
          "Sole Proprietorship Compliances",
          "NGO/NPO Compliances",
          "Partnership Firm Compliances"
        ]
      }
    ]
  },
  {
    title: "MCA Services",
    summary: "Company law filings and changes handled through MCA workflows. More MCA service items can be added as you finalize the list.",
    groups: [
      {
        title: "Corporate Changes and Filings",
        items: [
          "MCA Services"
        ]
      }
    ]
  },
  {
    title: "Event-Based Compliances",
    summary: "Support for important corporate events such as changes in directors, capital, registered office, shares, or auditors.",
    groups: [
      {
        title: "Event-Based Compliances",
        items: [
          "Event-Based Compliances"
        ]
      }
    ]
  },
  {
    title: "Conversion of Entities",
    summary: "Entity conversion support when your business structure needs to evolve with growth, investors, or compliance needs.",
    groups: [
      {
        title: "Conversion of Entities",
        items: [
          "Conversion of Entities"
        ]
      }
    ]
  },
  {
    title: "Intellectual Property Rights (IPR)",
    summary: "Protect brand, inventions, designs, and origin-linked business assets with practical IPR guidance.",
    groups: [
      {
        title: "IPR Services",
        items: [
          "Trademark",
          "Patent",
          "Design",
          "Geographical Indications",
          "IPR Dispute Handling"
        ]
      }
    ]
  },
  {
    title: "Taxation",
    summary: "Tax filing and return support for individuals, companies, employers, and recurring statutory requirements.",
    groups: [
      {
        title: "Tax Filing and Returns",
        items: [
          "ITR Filing for Individual and Company",
          "TDS Return",
          "PF Return",
          "ESIC Return"
        ]
      }
    ]
  },
  {
    title: "Accounting",
    summary: "Organized books, accounting support, and tax planning so founders can make cleaner financial decisions.",
    groups: [
      {
        title: "Accounting and Planning",
        items: [
          "Bookkeeping Services",
          "Accounting Services",
          "Tax Planning Services"
        ]
      }
    ]
  },
  {
    title: "Consulting",
    summary: "Founder-focused advisory for business planning, strategy, growth, and expansion decisions.",
    groups: [
      {
        title: "Business Consulting",
        items: [
          "Business Planning",
          "Marketing Strategy",
          "Tax Strategy",
          "Business Expansion",
          "Business Diversification"
        ]
      }
    ]
  },
  {
    title: "Office Address",
    summary: "Virtual office address support for businesses that need professional presence in India and overseas markets.",
    groups: [
      {
        title: "Virtual Office Address",
        items: [
          "Virtual Office Address in India",
          "Virtual Office Address in UK",
          "Virtual Office Address in USA",
          "Virtual Office Address in UAE"
        ]
      }
    ]
  },
  {
    title: "RBI Compliances",
    summary: "Foreign investment and RBI-facing filings for companies handling cross-border capital, reporting, or transactions.",
    groups: [
      {
        title: "RBI and FEMA Support",
        items: [
          "ECB Compliances",
          "FEMA Compliances",
          "FDI Compliances",
          "FII Compliances",
          "FLA Filing"
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
