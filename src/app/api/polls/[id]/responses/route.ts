import { NextRequest, NextResponse } from "next/server";
import { pollExists, getVotesForPoll } from "@/lib/store";
import type { ApiError } from "@/types";

// ─── GET /api/polls/[id]/responses — Fetch all vote responses ─

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

    if (!pollExists(id)) {
      return NextResponse.json<ApiError>(
        { error: "Poll not found." },
        { status: 404 }
      );
    }

    const responses = getVotesForPoll(id);

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Unexpected error fetching responses:", error);
    return NextResponse.json<ApiError>(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
