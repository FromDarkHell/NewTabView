import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveSelection } from "@/lib/trello";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { boardId, boardName, listId, listName } = body ?? {};

  if (!boardId || !boardName || !listId || !listName) {
    return NextResponse.json(
      { error: "Missing boardId, boardName, listId, or listName" },
      { status: 400 },
    );
  }

  await saveSelection(user.id, { boardId, boardName, listId, listName });
  return NextResponse.json({ ok: true });
}
