import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic();

function buildPrompt(pasteText) {
  return `You extract structured data from pasted distributor/rep sales-profile documents for a promotional products company preparing for sales meetings.

Given the raw text below (it may describe one company/contact or several), return ONLY a valid JSON array - no markdown code fences, no commentary. Each array item must match this shape (use "" for missing strings, [] for missing lists, false for missing booleans, and never invent data not present in the text):

{
  "company": "", "website": "", "address": "",
  "contact": { "name": "", "title": "", "email": "", "officePhone": "", "mobilePhone": "" },
  "additionalTeam": [{ "name": "", "role": "", "email": "" }],
  "yearsInIndustry": "", "brandAffiliation": [""],
  "salesMix": { "hardgoods": "", "apparel": "", "print": "" },
  "topIndustries": [""], "topSellingCategories": [""], "promotionStrategies": [""],
  "communicationPreference": { "method": "", "frequency": "" },
  "engagementFactors": [""],
  "flagsSelfReported": { "attendingConferences": false, "usingSelfPromos": false, "activelyProspecting": false },
  "customerLogos": [{ "name": "", "url": "", "description": "" }],
  "narrative": {
    "specializationAndGrowth": "",
    "buyingChallenges": "", "biggestChallenge12mo": "", "fastestGrowingPart": "",
    "supportToMoveFaster": "", "whatIncreasesEngagement": "", "whatTurnsOff": "",
    "greatestOpportunity": "", "mostEffectiveVendorSupport": "", "whatGreatServiceLooksLike": "",
    "vendorToolsRelyOnMost": ""
  }
}

TEXT:
"""
${pasteText}
"""`;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const text = body.text;
  if (!text || !String(text).trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildPrompt(text) }],
    });

    const textBlocks = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    const cleaned = textBlocks.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const result = Array.isArray(parsed) ? parsed : [parsed];
    return NextResponse.json({ result });
  } catch (e) {
    console.error("Parse route failed", e);
    return NextResponse.json(
      { error: "Couldn't parse that text into people. Try trimming it down, or use manual entry instead." },
      { status: 502 }
    );
  }
}
