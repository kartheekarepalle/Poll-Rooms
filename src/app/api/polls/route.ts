import { NextRequest, NextResponse } from "next/server";
import { createPoll } from "@/lib/store";
import type { CreatePollRequest, ApiError } from "@/types";

// ─── Rate limiting: simple in-memory store ───────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ─── POST /api/polls — Create a new poll ─────────────────────

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json<ApiError>(
        { error: "Too many requests. Please wait before creating another poll." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as CreatePollRequest;

    // ── Validation ──────────────────────────────────────────
    if (!body.question || body.question.trim().length === 0) {
      return NextResponse.json<ApiError>(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    if (body.question.trim().length > 500) {
      return NextResponse.json<ApiError>(
        { error: "Question must be 500 characters or less." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json<ApiError>(
        { error: "At least 2 options are required." },
        { status: 400 }
      );
    }

    if (body.options.length > 10) {
      return NextResponse.json<ApiError>(
        { error: "Maximum 10 options allowed." },
        { status: 400 }
      );
    }

    const cleanOptions = body.options
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (cleanOptions.length < 2) {
      return NextResponse.json<ApiError>(
        { error: "At least 2 non-empty options are required." },
        { status: 400 }
      );
    }

    const tooLong = cleanOptions.find((o) => o.length > 200);
    if (tooLong) {
      return NextResponse.json<ApiError>(
        { error: "Each option must be 200 characters or less." },
        { status: 400 }
      );
    }

    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      return NextResponse.json<ApiError>(
        { error: "Duplicate options are not allowed." },
        { status: 400 }
      );
    }

    // ── Create poll in Supabase ─────────────────────────────
    const poll = await createPoll(body.question.trim(), cleanOptions);

    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error creating poll:", error);
    return NextResponse.json<ApiError>(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
