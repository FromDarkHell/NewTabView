import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { clearTrelloState } from "@/lib/trello";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await clearTrelloState(user.id);
  return NextResponse.json({ ok: true });
}
