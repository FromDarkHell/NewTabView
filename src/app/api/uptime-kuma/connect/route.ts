import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { fetchStatusPageTitle, saveConfig } from "@/lib/uptime-kuma";
import { normalizeBaseUrl } from "@/lib/url";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const baseUrl = typeof body?.baseUrl === "string" ? normalizeBaseUrl(body.baseUrl) : null;
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";

  if (!baseUrl || !slug) {
    return NextResponse.json(
      { error: "Enter a valid http(s) URL and status page slug" },
      { status: 400 },
    );
  }

  const config = { baseUrl, slug };

  try {
    await fetchStatusPageTitle(config);
  } catch (error) {
    console.error("Failed to reach Uptime Kuma status page:", error);
    return NextResponse.json(
      { error: "Could not load that status page" },
      { status: 502 },
    );
  }

  await saveConfig(user.id, config);
  return NextResponse.json({ ok: true, config });
}
