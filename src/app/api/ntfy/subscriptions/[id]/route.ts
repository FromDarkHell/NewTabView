import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { removeSubscription } from "@/lib/ntfy";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  await removeSubscription(user.id, id);
  return NextResponse.json({ ok: true });
}
