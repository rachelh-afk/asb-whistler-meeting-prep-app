// Ported from the original Claude.ai artifact (2026-07-15-showcase-meeting-prep-app.jsx)
// via the Austin Showcase Next.js port, extended for the ASB Whistler roster with
// yearsInIndustry, brandAffiliation, and ourPrep.toolsWeCanOffer.
// Pure data/helper logic only — no persistence, no network calls.

export const COLORS = {
  navy: "#16233F",
  navyLight: "#233254",
  paper: "#FAF9F6",
  ink: "#232A3B",
  gold: "#B98A34",
  goldLight: "#E7C88B",
  flag: "#B44A1D",
  flagBg: "#FBEAE0",
  flagBorder: "#E8A87C",
};

export const STATUS_OPTIONS = [
  { value: "not_met", label: "Not yet met", dot: "#94A3B8" },
  { value: "met", label: "Met", dot: "#2563AA" },
  { value: "needs_followup", label: "Needs follow-up", dot: "#B44A1D" },
  { value: "done", label: "Done", dot: "#1D8A4E" },
];

export const KEYWORD_FLAGS = [
  { label: "Technology", patterns: [/\btech(?:nology)?\b/i] },
  { label: "Stores", patterns: [/\bstores?\b/i, /\bweb[- ]?stores?\b/i, /\be[- ]?stores?\b/i] },
  { label: "Programs", patterns: [/\bprograms?\b/i] },
  { label: "Uniforms", patterns: [/\buniform(?:s|ing)?\b/i] },
  { label: "Kitting", patterns: [/\bkitting\b/i, /\bkits?\b/i] },
  { label: "Packaging", patterns: [/\bpackaging\b/i] },
  { label: "Speed / Timeliness", patterns: [/\bspeed\b/i, /\btimely\b/i, /\btimeliness\b/i, /\btimelines?\b/i, /\bturn[- ]?around\b/i, /\bquick[- ]turn\b/i, /\bprompt(?:ly|ness)?\b/i] },
];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function emptyPerson() {
  return {
    id: uid(),
    company: "",
    website: "",
    address: "",
    contact: { name: "", title: "", email: "", officePhone: "", mobilePhone: "" },
    additionalTeam: [],
    yearsInIndustry: "",
    brandAffiliation: [],
    salesMix: { hardgoods: "", apparel: "", print: "" },
    topIndustries: [],
    topSellingCategories: [],
    promotionStrategies: [],
    communicationPreference: { method: "", frequency: "" },
    engagementFactors: [],
    flagsSelfReported: { attendingConferences: false, usingSelfPromos: false, activelyProspecting: false },
    customerLogos: [],
    narrative: {
      specializationAndGrowth: "",
      buyingChallenges: "",
      biggestChallenge12mo: "",
      fastestGrowingPart: "",
      supportToMoveFaster: "",
      whatIncreasesEngagement: "",
      whatTurnsOff: "",
      greatestOpportunity: "",
      mostEffectiveVendorSupport: "",
      whatGreatServiceLooksLike: "",
      vendorToolsRelyOnMost: "",
    },
    ourPrep: {
      objectives: "",
      talkingPoints: "",
      topicsToCover: "",
      toolsWeCanOffer: "",
      meetingNotes: "",
      followUps: [],
      status: "not_met",
      marketingOptIn: false,
    },
    fstRegion: "",
    revenue: { y2025: 0, y2026ytd: 0 },
    orderHistory: { products: [], logos: [] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function formatMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Fills in any missing fields with defaults. Used both for AI-parsed drafts
// and for seed data. idOverride gives seed entries a stable id so re-running
// the seed later never duplicates or clobbers someone already saved.
export function normalizePerson(d, idOverride) {
  const base = emptyPerson();
  return {
    ...base,
    ...d,
    id: idOverride || uid(),
    contact: { ...base.contact, ...(d.contact || {}) },
    salesMix: { ...base.salesMix, ...(d.salesMix || {}) },
    communicationPreference: { ...base.communicationPreference, ...(d.communicationPreference || {}) },
    flagsSelfReported: { ...base.flagsSelfReported, ...(d.flagsSelfReported || {}) },
    narrative: { ...base.narrative, ...(d.narrative || {}) },
    ourPrep: d.ourPrep ? { ...base.ourPrep, ...d.ourPrep, followUps: d.ourPrep.followUps || [] } : base.ourPrep,
    revenue: { ...base.revenue, ...(d.revenue || {}) },
    fstRegion: d.fstRegion !== undefined ? d.fstRegion : base.fstRegion,
    orderHistory: {
      products: (d.orderHistory && d.orderHistory.products) || base.orderHistory.products,
      logos: (d.orderHistory && d.orderHistory.logos) || base.orderHistory.logos,
    },
    additionalTeam: d.additionalTeam || [],
    brandAffiliation: d.brandAffiliation || [],
    topIndustries: d.topIndustries || [],
    topSellingCategories: d.topSellingCategories || [],
    promotionStrategies: d.promotionStrategies || [],
    engagementFactors: d.engagementFactors || [],
    customerLogos: d.customerLogos || [],
    createdAt: d.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
}

export function hardgoodsAtOrOver50(str) {
  if (!str) return false;
  const nums = (String(str).match(/\d+/g) || []).map(Number);
  return nums.some((n) => n >= 50);
}

export function getSearchableText(p) {
  return [
    (p.topIndustries || []).join(" "),
    (p.topSellingCategories || []).join(" "),
    (p.promotionStrategies || []).join(" "),
    (p.engagementFactors || []).join(" "),
    Object.values(p.narrative || {}).join(" "),
    p.ourPrep?.topicsToCover,
    p.ourPrep?.talkingPoints,
    p.ourPrep?.objectives,
    p.ourPrep?.meetingNotes,
    (p.customerLogos || []).map((c) => `${c.name || ""} ${c.description || ""}`).join(" "),
    (p.additionalTeam || []).map((m) => m.role || "").join(" "),
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectFlags(p) {
  const flags = [];
  if (hardgoodsAtOrOver50(p.salesMix?.hardgoods)) flags.push("Hardgoods 50%+");
  const text = getSearchableText(p);
  KEYWORD_FLAGS.forEach((f) => {
    if (f.patterns.some((re) => re.test(text))) flags.push(f.label);
  });
  return flags;
}

export function linesToArray(str) {
  return String(str || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
export function arrayToLines(arr) {
  return (arr || []).join("\n");
}

export function exportCSV(people) {
  const statusLabel = (v) => STATUS_OPTIONS.find((s) => s.value === v)?.label || v || "";
  const headers = [
    "Name", "Title", "Company", "Email", "Office Phone", "Mobile Phone",
    "Years in Industry", "Brand Affiliation",
    "Status", "Flags", "FST Region", "Marketing Opt-In", "2025 Revenue", "2026 YTD Revenue", "Objectives", "Talking Points", "Topics to Cover",
    "Tools We Can Offer", "Meeting Notes", "Follow-ups",
  ];
  const rows = people.map((p) => [
    p.contact?.name || "",
    p.contact?.title || "",
    p.company || "",
    p.contact?.email || "",
    p.contact?.officePhone || "",
    p.contact?.mobilePhone || "",
    p.yearsInIndustry || "",
    (p.brandAffiliation || []).join("; "),
    statusLabel(p.ourPrep?.status),
    detectFlags(p).join("; "),
    p.fstRegion || "",
    p.ourPrep?.marketingOptIn ? "Yes" : "No",
    p.revenue?.y2025 || 0,
    p.revenue?.y2026ytd || 0,
    p.ourPrep?.objectives || "",
    p.ourPrep?.talkingPoints || "",
    p.ourPrep?.topicsToCover || "",
    p.ourPrep?.toolsWeCanOffer || "",
    p.ourPrep?.meetingNotes || "",
    (p.ourPrep?.followUps || []).map((f) => `${f.done ? "[x]" : "[ ]"} ${f.text}`).join(" | "),
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/\r?\n/g, " ").trim().replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asb-whistler-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

