import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { fetchLists, getToken } from "@/lib/trello";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = await getToken(user.id);
  if (!token) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  const boardId = request.nextUrl.searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "Missing boardId" }, { status: 400 });
  }

  try {
    const lists = await fetchLists(token, boardId);
    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Failed to fetch Trello lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch lists" },
      { status: 502 },
    );
  }
}
