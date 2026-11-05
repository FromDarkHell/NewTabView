import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markMessageRead } from "@/lib/ntfy";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { subscriptionId, messageId, messageTime } = body ?? {};

  if (
    typeof subscriptionId !== "string" ||
    typeof messageId !== "string" ||
    !Number.isInteger(messageTime)
  ) {
    return NextResponse.json(
      { error: "Missing subscriptionId, messageId, or messageTime" },
      { status: 400 },
    );
  }

  const bMarked = await markMessageRead(user.id, subscriptionId, messageId, messageTime);
  if (!bMarked) {
    return NextResponse.json({ error: "Unknown subscription" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
