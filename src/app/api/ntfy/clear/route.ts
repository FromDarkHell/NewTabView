import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { clearAllMessages } from "@/lib/ntfy";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // The newest message time the client was showing, so anything that arrived after the
  // page rendered is not cleared unseen.
  const body = await request.json();
  const before = body?.before;

  if (!Number.isInteger(before) || before > Math.floor(Date.now() / 1000) + 60) {
    return NextResponse.json({ error: "Missing or invalid before" }, { status: 400 });
  }

  await clearAllMessages(user.id, before);
  return NextResponse.json({ ok: true });
}
