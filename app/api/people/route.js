import { NextResponse } from "next/server";
import { getAllPeople, insertPeople } from "@/lib/db";

export async function GET() {
  const people = await getAllPeople();
  return NextResponse.json({ people });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const drafts = Array.isArray(body.people) ? body.people : body.person ? [body.person] : [];
  if (drafts.length === 0) {
    return NextResponse.json({ error: "No people provided" }, { status: 400 });
  }
  const inserted = await insertPeople(drafts);
  return NextResponse.json({ people: inserted });
}
