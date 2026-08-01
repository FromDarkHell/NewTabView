import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { fetchBoards, getToken } from "@/lib/trello";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = await getToken(user.id);
  if (!token) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  try {
    const boards = await fetchBoards(token);
    return NextResponse.json({ boards });
  } catch (error) {
    console.error("Failed to fetch Trello boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 502 },
    );
  }
}
