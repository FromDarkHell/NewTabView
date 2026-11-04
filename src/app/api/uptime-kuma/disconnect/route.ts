import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { clearConfig } from "@/lib/uptime-kuma";

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await clearConfig(user.id);
  return NextResponse.json({ ok: true });
}
