import { NextRequest, NextResponse } from "next/server";
import { getPoll } from "@/lib/store";
import type { ApiError } from "@/types";

// ─── GET /api/polls/[id] — Fetch poll with options ───────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid poll ID format." },
        { status: 400 }
      );
    }

    const poll = await getPoll(id);

    if (!poll) {
      return NextResponse.json<ApiError>(
        { error: "Poll not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error("Unexpected error fetching poll:", error);
    return NextResponse.json<ApiError>(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
