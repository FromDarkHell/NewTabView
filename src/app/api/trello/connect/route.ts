import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveToken } from "@/lib/trello";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const token = typeof body?.token === "string" ? body.token : null;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  await saveToken(user.id, token);
  return NextResponse.json({ ok: true });
}
