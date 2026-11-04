import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveWidgetLayout } from "@/lib/layout";
import { resolveWidgetLayout } from "@/lib/widgets";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  if (!Array.isArray(body?.layout)) {
    return NextResponse.json({ error: "Missing layout" }, { status: 400 });
  }

  const layout = resolveWidgetLayout(body.layout);
  await saveWidgetLayout(user.id, layout);
  return NextResponse.json({ ok: true, layout });
}
