import { NextRequest, NextResponse } from "next/server";
import {
  pollExists,
  optionBelongsToPoll,
  hasVotedByIp,
  hasVotedByFingerprint,
  castVote,
} from "@/lib/store";
import type { CastVoteRequest, ApiError, CastVoteResponse } from "@/types";

// ─── Rate limiting for votes ─────────────────────────────────
const voteRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const VOTE_RATE_WINDOW = 10_000;
const VOTE_RATE_MAX = 5;

function isVoteRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = voteRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    voteRateLimitMap.set(ip, { count: 1, resetAt: now + VOTE_RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > VOTE_RATE_MAX;
}

// ─── POST /api/polls/[id]/vote — Cast a vote ────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;

    const voterIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isVoteRateLimited(voterIp)) {
      return NextResponse.json<ApiError>(
        { error: "Too many vote attempts. Please slow down." },
        { status: 429 }
      );
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pollId)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid poll ID." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as CastVoteRequest;

    if (!body.option_id || !uuidRegex.test(body.option_id)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid option ID." },
        { status: 400 }
      );
    }

    const fingerprint = body.fingerprint || "unknown";

    // ── Verify poll exists ──────────────────────────────────
    if (!(await pollExists(pollId))) {
      return NextResponse.json<ApiError>(
        { error: "Poll not found." },
        { status: 404 }
      );
    }

    // ── Verify option belongs to this poll ──────────────────
    if (!(await optionBelongsToPoll(body.option_id, pollId))) {
      return NextResponse.json<ApiError>(
        { error: "Option not found in this poll." },
        { status: 400 }
      );
    }

    // ── Fairness Check 1: IP-based duplicate detection ──────
    if (await hasVotedByIp(pollId, voterIp)) {
      return NextResponse.json<ApiError>(
        { error: "You have already voted on this poll." },
        { status: 409 }
      );
    }

    // ── Fairness Check 2: Fingerprint-based duplicate detection
    if (await hasVotedByFingerprint(pollId, fingerprint)) {
      return NextResponse.json<ApiError>(
        { error: "You have already voted on this poll." },
        { status: 409 }
      );
    }

    // ── Cast the vote ───────────────────────────────────────
    const result = await castVote(pollId, body.option_id, voterIp, fingerprint);

    if (!result.success) {
      return NextResponse.json<ApiError>(
        { error: result.error! },
        { status: 409 }
      );
    }

    return NextResponse.json<CastVoteResponse>({
      success: true,
      message: "Vote recorded successfully!",
    });
  } catch (error) {
    console.error("Unexpected error casting vote:", error);
    return NextResponse.json<ApiError>(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
