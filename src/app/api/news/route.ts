import { NextResponse } from "next/server";
import { getTopNews } from "@/lib/news";

export async function GET() {
  try {
    const articles = await getTopNews();
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Failed to load news:", error);
    return NextResponse.json(
      { articles: [], error: "Failed to load news" },
      { status: 502 },
    );
  }
}
