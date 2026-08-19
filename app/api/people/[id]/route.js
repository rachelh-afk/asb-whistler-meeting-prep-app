import { NextResponse } from "next/server";
import { updatePerson, deletePerson } from "@/lib/db";

export async function PUT(request, ctx) {
  const { id } = await ctx.params;
  const person = await request.json();
  const updated = await updatePerson(id, person);
  return NextResponse.json({ person: updated });
}

export async function DELETE(request, ctx) {
  const { id } = await ctx.params;
  await deletePerson(id);
  return NextResponse.json({ ok: true });
}
