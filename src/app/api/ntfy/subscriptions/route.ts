import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  DEFAULT_NTFY_SERVER,
  addSubscription,
  findSubscription,
  isValidTopic,
  listSubscriptions,
  verifyEndpoint,
} from "@/lib/ntfy";
import { normalizeBaseUrl } from "@/lib/url";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ subscriptions: [] });
  }

  const subscriptions = await listSubscriptions(user.id);
  return NextResponse.json({ subscriptions });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const rawServerUrl =
    typeof body?.serverUrl === "string" && body.serverUrl.trim() ? body.serverUrl : DEFAULT_NTFY_SERVER;
  const serverUrl = normalizeBaseUrl(rawServerUrl);
  const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
  const token = typeof body?.token === "string" && body.token.trim() ? body.token.trim() : null;

  if (!serverUrl || !isValidTopic(topic)) {
    return NextResponse.json(
      { error: "Enter a valid http(s) server URL and topic (letters, numbers, - and _)" },
      { status: 400 },
    );
  }

  if (await findSubscription(user.id, serverUrl, topic)) {
    return NextResponse.json({ error: "Already subscribed to that topic" }, { status: 409 });
  }

  const endpoint = { serverUrl, topic, token };

  try {
    await verifyEndpoint(endpoint);
  } catch (error) {
    console.error("Failed to reach ntfy topic:", error);
    return NextResponse.json(
      { error: "Could not read that topic (check the server URL and token)" },
      { status: 502 },
    );
  }

  const subscription = await addSubscription(user.id, endpoint);
  return NextResponse.json({ subscription });
}
