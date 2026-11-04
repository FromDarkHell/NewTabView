import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getConfig } from "@/lib/uptime-kuma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ config: null });
  }

  const config = await getConfig(user.id);
  return NextResponse.json({ config });
}
