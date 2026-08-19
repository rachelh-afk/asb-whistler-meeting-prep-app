"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, ArrowLeft, Download, Trash2, ClipboardPaste, UserPlus,
  Sparkles, AlertTriangle, Phone, Mail, Globe, MapPin, ChevronRight,
  Loader2, Users, Check, X, RefreshCw, Building2, LogOut
} from "lucide-react";
import {
  COLORS, STATUS_OPTIONS, uid, emptyPerson, normalizePerson, formatMoney,
  detectFlags, linesToArray, arrayToLines, exportCSV,
} from "@/lib/people";

// ---------- small UI pieces ----------

function FlagBadges({ person, size = "md" }) {
  const flags = detectFlags(person);
  if (flags.length === 0) return null;
  const big = size === "lg";
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => (
        <span
          key={f}
          className={`inline-flex items-center gap-1 rounded-full font-semibold tracking-wide uppercase ${
            big ? "text-xs px-3 py-1.5" : "text-[10px] px-2 py-0.5"
          }`}
          style={{ backgroundColor: COLORS.flagBg, color: COLORS.flag, border: `1px solid ${COLORS.flagBorder}` }}
        >
          <AlertTriangle className={big ? "w-3.5 h-3.5" : "w-3 h-3"} />
          {f}
        </span>
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  const s = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 space-y-3 ${className}`}>
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.navy, opacity: 0.65 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-0 placeholder:text-slate-400";
const inputStyle = { boxShadow: "none" };

// ---------- the big editable form (used for manual add, parse review, and detail/edit) ----------

function RevenueBand({ person, onChange, editable }) {
  const y2025 = person.revenue?.y2025 || 0;
  const y2026 = person.revenue?.y2026ytd || 0;
  const isZero = !y2025 && !y2026;
  const setRevenue = (patch) => onChange({ ...person, revenue: { ...person.revenue, ...patch }, updatedAt: Date.now() });
  const setFstRegion = (val) => onChange({ ...person, fstRegion: val, updatedAt: Date.now() });
  return (
    <div
      className="rounded-xl border p-4 flex flex-wrap items-center gap-x-8 gap-y-3"
      style={{ backgroundColor: isZero ? "#F4F4F2" : "#EFF5EF", borderColor: isZero ? "#E2E2DE" : "#BFDCC4" }}
    >
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.navy, opacity: 0.65 }}>
        iClick Account Info
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">2025:</span>
        {editable ? (
          <input
            type="number"
            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm font-semibold"
            value={y2025}
            onChange={(e) => setRevenue({ y2025: Number(e.target.value) })}
          />
        ) : (
          <span className="text-sm font-semibold text-slate-800">{formatMoney(y2025)}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">2026 YTD:</span>
        {editable ? (
          <input
            type="number"
            className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm font-semibold"
            value={y2026}
            onChange={(e) => setRevenue({ y2026ytd: Number(e.target.value) })}
          />
        ) : (
          <span className="text-sm font-semibold text-slate-800">{formatMoney(y2026)}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">FST Region:</span>
        {editable ? (
          <input
            type="text"
            className="w-48 rounded-lg border border-slate-300 px-2 py-1 text-sm font-semibold"
            placeholder="Not on file"
            value={person.fstRegion || ""}
            onChange={(e) => setFstRegion(e.target.value)}
          />
        ) : (
          <span className="text-sm font-semibold text-slate-800">{person.fstRegion || "Not on file"}</span>
        )}
      </div>
      {isZero && <span className="text-xs italic text-slate-500">No order history found — treat as a new prospect</span>}
    </div>
  );
}

function OrderHistoryPanel({ person }) {
  const products = person.orderHistory?.products || [];
  const logos = person.orderHistory?.logos || [];
  if (products.length === 0 && logos.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.navy, opacity: 0.65 }}>
        iClick Order History
      </h3>
      {products.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1.5">Products ordered</span>
          <div className="flex flex-wrap gap-1.5">
            {products.map((p) => (
              <span key={p.name} className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs text-slate-700">
                {p.name}
                {p.qty ? <span className="text-slate-400">×{p.qty}</span> : null}
              </span>
            ))}
          </div>
        </div>
      )}
      {logos.length > 0 && (
        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1.5">Logos seen on past orders</span>
          <div className="flex flex-wrap gap-1.5">
            {logos.map((l) => (
              <span key={l.name} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ backgroundColor: COLORS.paper, border: `1px solid ${COLORS.goldLight}`, color: COLORS.navy }}>
                {l.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonForm({ person, onChange }) {
  const [newFollowUp, setNewFollowUp] = useState("");

  const set = (patch) => onChange({ ...person, ...patch, updatedAt: Date.now() });
  const setContact = (patch) => set({ contact: { ...person.contact, ...patch } });
  const setSalesMix = (patch) => set({ salesMix: { ...person.salesMix, ...patch } });
  const setCommPref = (patch) => set({ communicationPreference: { ...person.communicationPreference, ...patch } });
  const setFlagsSelf = (patch) => set({ flagsSelfReported: { ...person.flagsSelfReported, ...patch } });
  const setNarrative = (patch) => set({ narrative: { ...person.narrative, ...patch } });
  const setPrep = (patch) => set({ ourPrep: { ...person.ourPrep, ...patch } });

  const updateTeam = (idx, patch) => {
    const next = [...person.additionalTeam];
    next[idx] = { ...next[idx], ...patch };
    set({ additionalTeam: next });
  };
  const addTeam = () => set({ additionalTeam: [...(person.additionalTeam || []), { name: "", role: "", email: "" }] });
  const removeTeam = (idx) => set({ additionalTeam: person.additionalTeam.filter((_, i) => i !== idx) });

  const updateLogo = (idx, patch) => {
    const next = [...person.customerLogos];
    next[idx] = { ...next[idx], ...patch };
    set({ customerLogos: next });
  };
  const addLogo = () => set({ customerLogos: [...(person.customerLogos || []), { name: "", url: "", description: "" }] });
  const removeLogo = (idx) => set({ customerLogos: person.customerLogos.filter((_, i) => i !== idx) });

  const addFollowUp = () => {
    if (!newFollowUp.trim()) return;
    setPrep({ followUps: [...(person.ourPrep.followUps || []), { id: uid(), text: newFollowUp.trim(), done: false }] });
    setNewFollowUp("");
  };
  const toggleFollowUp = (id) =>
    setPrep({ followUps: person.ourPrep.followUps.map((f) => (f.id === id ? { ...f, done: !f.done } : f)) });
  const removeFollowUp = (id) => setPrep({ followUps: person.ourPrep.followUps.filter((f) => f.id !== id) });

  const narrativeFields = [
    ["specializationAndGrowth", "How they're specialized, and where they're growing"],
    ["buyingChallenges", "Buying challenges their customers face"],
    ["biggestChallenge12mo", "Their biggest challenge over the last 12 months"],
    ["fastestGrowingPart", "The part of their business growing fastest"],
    ["supportToMoveFaster", "Support that helps them move faster / close with confidence"],
    ["whatIncreasesEngagement", "What makes them more likely to engage with a rep"],
    ["whatTurnsOff", "What immediately turns them off"],
    ["greatestOpportunity", "Greatest opportunity to deepen the relationship"],
    ["mostEffectiveVendorSupport", "The most effective vendor support they've experienced"],
    ["whatGreatServiceLooksLike", "What great service looks like to them"],
    ["vendorToolsRelyOnMost", "Vendor sales tools they rely on most"],
  ];

  return (
    <div className="space-y-4">
      {/* Revenue with iClick */}
      <RevenueBand person={person} onChange={onChange} editable={true} />

      {/* Products and logos from real order history */}
      <OrderHistoryPanel person={person} />

      {/* Attention flags */}
      <FlagBadges person={person} size="lg" />

      {/* Meeting prep — kept at top since it's what you'll use live */}
      <Section title="Our meeting prep">
        <Field label="Status">
          <select
            className={inputCls}
            style={inputStyle}
            value={person.ourPrep.status}
            onChange={(e) => setPrep({ status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2" style={{ backgroundColor: COLORS.paper, border: `1px solid ${COLORS.goldLight}` }}>
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={!!person.ourPrep.marketingOptIn}
            onChange={(e) => setPrep({ marketingOptIn: e.target.checked })}
          />
          Opt in to marketing emails
        </label>
        <Field label="Our objectives / ask for this meeting">
          <textarea className={inputCls} rows={2} value={person.ourPrep.objectives}
            onChange={(e) => setPrep({ objectives: e.target.value })} />
        </Field>
        <Field label="Talking points & questions to ask them">
          <textarea className={inputCls} rows={3} value={person.ourPrep.talkingPoints}
            onChange={(e) => setPrep({ talkingPoints: e.target.value })} />
        </Field>
        <Field label="Specific topics / products / case studies to cover">
          <textarea className={inputCls} rows={3} value={person.ourPrep.topicsToCover}
            onChange={(e) => setPrep({ topicsToCover: e.target.value })} />
        </Field>
        <Field label="Tools/support iClick can offer to help them grow fastest">
          <textarea className={inputCls} rows={2} value={person.ourPrep.toolsWeCanOffer}
            onChange={(e) => setPrep({ toolsWeCanOffer: e.target.value })} />
        </Field>
        <Field label="Meeting notes">
          <textarea className={inputCls} rows={4} value={person.ourPrep.meetingNotes}
            onChange={(e) => setPrep({ meetingNotes: e.target.value })} />
        </Field>
        <div>
          <span className="text-xs font-medium text-slate-600 block mb-1.5">Follow-up actions</span>
          <div className="space-y-1.5">
            {(person.ourPrep.followUps || []).map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <button type="button" onClick={() => toggleFollowUp(f.id)}
                  className="flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center"
                  style={{ borderColor: f.done ? "#1D8A4E" : "#CBD5E1", backgroundColor: f.done ? "#1D8A4E" : "white" }}>
                  {f.done && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <span className={`text-sm flex-1 ${f.done ? "line-through text-slate-400" : "text-slate-700"}`}>{f.text}</span>
                <button type="button" onClick={() => removeFollowUp(f.id)} className="text-slate-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input className={inputCls} placeholder="Add a follow-up action..." value={newFollowUp}
              onChange={(e) => setNewFollowUp(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFollowUp(); } }} />
            <button type="button" onClick={addFollowUp}
              className="px-3 rounded-lg text-sm font-medium text-white flex-shrink-0"
              style={{ backgroundColor: COLORS.navy }}>Add</button>
          </div>
        </div>
      </Section>

      {/* Business & contact info */}
      <Section title="Business & contact info">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Company"><input className={inputCls} value={person.company} onChange={(e) => set({ company: e.target.value })} /></Field>
          <Field label="Website"><input className={inputCls} value={person.website} onChange={(e) => set({ website: e.target.value })} /></Field>
        </div>
        <Field label="Address"><input className={inputCls} value={person.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Years in industry"><input className={inputCls} value={person.yearsInIndustry} onChange={(e) => set({ yearsInIndustry: e.target.value })} /></Field>
          <Field label="Brand affiliation (ASB / CSB / American Diversity — one per line)">
            <textarea className={inputCls} rows={2} value={arrayToLines(person.brandAffiliation)} onChange={(e) => set({ brandAffiliation: linesToArray(e.target.value) })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Field label="Primary contact name"><input className={inputCls} value={person.contact.name} onChange={(e) => setContact({ name: e.target.value })} /></Field>
          <Field label="Title"><input className={inputCls} value={person.contact.title} onChange={(e) => setContact({ title: e.target.value })} /></Field>
          <Field label="Email"><input className={inputCls} value={person.contact.email} onChange={(e) => setContact({ email: e.target.value })} /></Field>
          <Field label="Office phone"><input className={inputCls} value={person.contact.officePhone} onChange={(e) => setContact({ officePhone: e.target.value })} /></Field>
          <Field label="Mobile phone"><input className={inputCls} value={person.contact.mobilePhone} onChange={(e) => setContact({ mobilePhone: e.target.value })} /></Field>
        </div>
        <div>
          <span className="text-xs font-medium text-slate-600 block mb-1.5">Additional team members</span>
          <div className="space-y-2">
            {(person.additionalTeam || []).map((m, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input className={inputCls} placeholder="Name" value={m.name} onChange={(e) => updateTeam(idx, { name: e.target.value })} />
                <input className={inputCls} placeholder="Role" value={m.role} onChange={(e) => updateTeam(idx, { role: e.target.value })} />
                <input className={inputCls} placeholder="Email" value={m.email} onChange={(e) => updateTeam(idx, { email: e.target.value })} />
                <button type="button" onClick={() => removeTeam(idx)} className="text-slate-400 hover:text-red-500 justify-self-start sm:justify-self-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addTeam} className="mt-2 text-sm font-medium" style={{ color: COLORS.navy }}>+ Add team member</button>
        </div>
      </Section>

      {/* Business profile */}
      <Section title="Business profile">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Hardgoods % of sales"><input className={inputCls} placeholder="e.g. 76%-100%" value={person.salesMix.hardgoods} onChange={(e) => setSalesMix({ hardgoods: e.target.value })} /></Field>
          <Field label="Apparel % of sales"><input className={inputCls} value={person.salesMix.apparel} onChange={(e) => setSalesMix({ apparel: e.target.value })} /></Field>
          <Field label="Print % of sales"><input className={inputCls} value={person.salesMix.print} onChange={(e) => setSalesMix({ print: e.target.value })} /></Field>
        </div>
        <Field label="Top industries (one per line)">
          <textarea className={inputCls} rows={2} value={arrayToLines(person.topIndustries)} onChange={(e) => set({ topIndustries: linesToArray(e.target.value) })} />
        </Field>
        <Field label="Top selling categories (one per line)">
          <textarea className={inputCls} rows={3} value={arrayToLines(person.topSellingCategories)} onChange={(e) => set({ topSellingCategories: linesToArray(e.target.value) })} />
        </Field>
        <Field label="Business promotion strategies (one per line)">
          <textarea className={inputCls} rows={2} value={arrayToLines(person.promotionStrategies)} onChange={(e) => set({ promotionStrategies: linesToArray(e.target.value) })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Communication method"><input className={inputCls} value={person.communicationPreference.method} onChange={(e) => setCommPref({ method: e.target.value })} /></Field>
          <Field label="Communication frequency"><input className={inputCls} value={person.communicationPreference.frequency} onChange={(e) => setCommPref({ frequency: e.target.value })} /></Field>
        </div>
        <Field label="Factors that influence engagement (one per line)">
          <textarea className={inputCls} rows={2} value={arrayToLines(person.engagementFactors)} onChange={(e) => set({ engagementFactors: linesToArray(e.target.value) })} />
        </Field>
        <div className="flex flex-wrap gap-4 pt-1">
          {[
            ["attendingConferences", "Attending conferences"],
            ["usingSelfPromos", "Using self-promos to increase sales"],
            ["activelyProspecting", "Actively prospecting"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={!!person.flagsSelfReported[key]} onChange={(e) => setFlagsSelf({ [key]: e.target.checked })} />
              {label}
            </label>
          ))}
        </div>
        <div>
          <span className="text-xs font-medium text-slate-600 block mb-1.5">Customer logos / references they shared</span>
          <div className="space-y-2">
            {(person.customerLogos || []).map((c, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr_auto] gap-2">
                <input className={inputCls} placeholder="Company name" value={c.name} onChange={(e) => updateLogo(idx, { name: e.target.value })} />
                <input className={inputCls} placeholder="Website" value={c.url || ""} onChange={(e) => updateLogo(idx, { url: e.target.value })} />
                <input className={inputCls} placeholder="What they do / relationship" value={c.description} onChange={(e) => updateLogo(idx, { description: e.target.value })} />
                <button type="button" onClick={() => removeLogo(idx)} className="text-slate-400 hover:text-red-500 justify-self-start sm:justify-self-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLogo} className="mt-2 text-sm font-medium" style={{ color: COLORS.navy }}>+ Add reference</button>
        </div>
      </Section>

      {/* Narrative - in their own words */}
      <Section title="In their own words">
        {narrativeFields.map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea className={inputCls} rows={2} value={person.narrative[key]} onChange={(e) => setNarrative({ [key]: e.target.value })} />
          </Field>
        ))}
      </Section>
    </div>
  );
}

// ---------- list card ----------

function PersonCard({ person, onOpen }) {
  return (
    <button onClick={onOpen} className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{person.contact?.name || "(No name yet)"}</div>
          <div className="text-sm text-slate-500 truncate">
            {[person.contact?.title, person.company].filter(Boolean).join(" · ") || "No company info yet"}
          </div>
          {person.fstRegion && (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.paper, color: COLORS.navy, border: `1px solid ${COLORS.goldLight}` }}>
              {person.fstRegion.split(" (")[0]}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
      </div>
      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="flex items-center gap-2">
          <StatusPill status={person.ourPrep?.status} />
          {person.ourPrep?.marketingOptIn && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: "#EFF5EF", color: "#1D8A4E", border: "1px solid #BFDCC4" }}>
              ✓ Opted In
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-slate-500">
          {(person.revenue?.y2025 || person.revenue?.y2026ytd)
            ? `${formatMoney(person.revenue?.y2025)} '25 · ${formatMoney(person.revenue?.y2026ytd)} '26 YTD`
            : "No order history"}
        </span>
      </div>
      <div className="flex items-center justify-end gap-3">
        <FlagBadges person={person} size="sm" />
      </div>
    </button>
  );
}

// ---------- add flow (choice / manual / paste / review) ----------

function AddPersonFlow({ onCancel, onSaveMany }) {
  const [mode, setMode] = useState("choice"); // choice | manual | paste | review
  const [manualDraft, setManualDraft] = useState(emptyPerson());
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [reviewDrafts, setReviewDrafts] = useState([]);

  const handleParse = async () => {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "parse failed");
      const asArray = Array.isArray(data.result) ? data.result : [data.result];
      if (asArray.length === 0) throw new Error("empty");
      setReviewDrafts(asArray.map((d) => normalizePerson(d)));
      setMode("review");
    } catch (e) {
      setParseError("Couldn't parse that text into people. Try trimming it down, or use manual entry instead.");
    } finally {
      setParsing(false);
    }
  };

  const updateDraft = (idx, next) => {
    const copy = [...reviewDrafts];
    copy[idx] = next;
    setReviewDrafts(copy);
  };
  const discardDraft = (idx) => setReviewDrafts(reviewDrafts.filter((_, i) => i !== idx));

  if (mode === "choice") {
    return (
      <div className="space-y-3">
        <button onClick={() => setMode("paste")} className="w-full bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.navy }}>
            <ClipboardPaste className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">Paste & parse</div>
            <div className="text-sm text-slate-500">Paste a profile document (one or several people) and let Claude pull out the fields.</div>
          </div>
        </button>
        <button onClick={() => { setManualDraft(emptyPerson()); setMode("manual"); }} className="w-full bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.gold }}>
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">Manual entry</div>
            <div className="text-sm text-slate-500">Start from a blank form and type it in yourself.</div>
          </div>
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700 pt-1">Cancel</button>
      </div>
    );
  }

  if (mode === "paste") {
    return (
      <div className="space-y-3">
        <textarea
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 h-64 focus:outline-none focus:ring-2"
          placeholder="Paste the profile text here (company info, sales mix, top categories, their Q&A answers, etc.)"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        {parseError && <div className="text-sm rounded-lg p-3" style={{ backgroundColor: COLORS.flagBg, color: COLORS.flag }}>{parseError}</div>}
        <div className="flex items-center gap-2">
          <button onClick={handleParse} disabled={parsing || !pasteText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: COLORS.navy }}>
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {parsing ? "Parsing..." : "Parse with Claude"}
          </button>
          <button onClick={() => setMode("choice")} className="text-sm text-slate-500 hover:text-slate-700">Back</button>
        </div>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="space-y-6">
        <div className="text-sm text-slate-600">
          Found {reviewDrafts.length} {reviewDrafts.length === 1 ? "person" : "people"}. Review and edit before saving.
        </div>
        {reviewDrafts.map((d, idx) => (
          <div key={d.id} className="border border-slate-200 rounded-xl p-4 space-y-3" style={{ backgroundColor: COLORS.paper }}>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{d.contact.name || d.company || `Person ${idx + 1}`}</div>
              <button onClick={() => discardDraft(idx)} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </button>
            </div>
            <PersonForm person={d} onChange={(next) => updateDraft(idx, next)} />
          </div>
        ))}
        {reviewDrafts.length === 0 && (
          <div className="text-sm text-slate-500">All drafts discarded. Go back and try again, or use manual entry.</div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => { onSaveMany(reviewDrafts); }} disabled={reviewDrafts.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: COLORS.navy }}>
            Save {reviewDrafts.length > 0 ? `all ${reviewDrafts.length}` : ""} to list
          </button>
          <button onClick={() => setMode("paste")} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Re-paste
          </button>
          <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
        </div>
      </div>
    );
  }

  // manual
  return (
    <div className="space-y-4">
      <PersonForm person={manualDraft} onChange={setManualDraft} />
      <div className="flex items-center gap-2">
        <button onClick={() => onSaveMany([manualDraft])} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: COLORS.navy }}>
          Save person
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
      </div>
    </div>
  );
}

// ---------- detail / edit view ----------

function PersonDetail({ person, onPersist, onBack, onDelete }) {
  const [draft, setDraft] = useState(person);
  const [savingState, setSavingState] = useState("saved");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => { setDraft(person); }, [person.id]);

  useEffect(() => {
    if (draft === person) return;
    setSavingState("saving");
    const t = setTimeout(() => {
      onPersist(draft);
      setSavingState("saved");
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{savingState === "saving" ? "Saving..." : "Saved"}</span>
          {!confirmingDelete ? (
            <button onClick={() => setConfirmingDelete(true)} className="text-slate-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Delete this person?</span>
              <button onClick={() => onDelete(person.id)} className="font-semibold text-red-600">Yes, delete</button>
              <button onClick={() => setConfirmingDelete(false)} className="text-slate-500">Cancel</button>
            </div>
          )}
        </div>
      </div>
      <PersonForm person={draft} onChange={setDraft} />
    </div>
  );
}

// ---------- main app ----------

export default function App() {
  const [people, setPeople] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("list"); // list | add | detail
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/people");
        const data = await res.json();
        setPeople(data.people || []);
      } catch (e) {
        console.error("Failed to load people", e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleSaveMany = async (drafts) => {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ people: drafts }),
    });
    const data = await res.json();
    setPeople((prev) => [...prev, ...(data.people || [])]);
    setView("list");
  };

  const handlePersistOne = async (updated) => {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try {
      await fetch(`/api/people/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const handleDelete = async (id) => {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setView("list");
    setSelectedId(null);
    try {
      await fetch(`/api/people/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      [p.contact?.name, p.company].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [people, search]);

  const selected = people.find((p) => p.id === selectedId);

  return (
    <div style={{ backgroundColor: COLORS.paper, minHeight: "100%" }} className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        input:focus, textarea:focus, select:focus { --tw-ring-color: ${COLORS.navy}55; border-color: ${COLORS.navy}; }
      `}</style>

      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: COLORS.navy, borderColor: COLORS.navyLight }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white">
              <Building2 className="w-5 h-5" style={{ color: COLORS.goldLight }} />
              <h1 className="font-bold text-lg">ASB Whistler — Meeting Prep</h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: COLORS.goldLight }}>ASB National Summit · Whistler, BC · Sept 27–29</p>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {view === "list" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2"
                  placeholder="Search by name or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button onClick={() => setView("add")}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white flex-shrink-0"
                style={{ backgroundColor: COLORS.navy }}>
                <Plus className="w-4 h-4" /> Add person
              </button>
            </div>

            {people.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {filtered.length} of {people.length} people</span>
                <button onClick={() => exportCSV(people)} className="flex items-center gap-1.5 font-medium" style={{ color: COLORS.navy }}>
                  <Download className="w-3.5 h-3.5" /> Export all to CSV
                </button>
              </div>
            )}

            {loaded && people.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No one added yet.</p>
                <p className="text-sm">Paste a profile or add someone manually to get started.</p>
              </div>
            )}

            {loaded && people.length > 0 && filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No matches for "{search}".</div>
            )}

            <div className="space-y-2.5">
              {filtered.map((p) => (
                <PersonCard key={p.id} person={p} onOpen={() => { setSelectedId(p.id); setView("detail"); }} />
              ))}
            </div>
          </div>
        )}

        {view === "add" && (
          <AddPersonFlow onCancel={() => setView("list")} onSaveMany={handleSaveMany} />
        )}

        {view === "detail" && selected && (
          <PersonDetail
            person={selected}
            onPersist={handlePersistOne}
            onBack={() => setView("list")}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}


