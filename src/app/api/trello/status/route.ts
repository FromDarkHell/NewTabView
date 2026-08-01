import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSelection, getToken } from "@/lib/trello";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ connected: false, selection: null });
  }

  const [token, selection] = await Promise.all([
    getToken(user.id),
    getSelection(user.id),
  ]);
  return NextResponse.json({
    connected: Boolean(token),
    selection,
  });
}
