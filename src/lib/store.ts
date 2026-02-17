/**
 * In-memory data store for polls, options, and votes.
 *
 * This replaces Supabase so the app works out-of-the-box with ZERO
 * external dependencies. Data persists as long as the dev server runs.
 *
 * For production, swap this out with a real database (Supabase, PostgreSQL, etc).
 */

import { randomUUID } from "crypto";
import type { Poll, PollOption, Vote } from "@/types";

// ─── In-memory tables ────────────────────────────────────────

const polls = new Map<string, { id: string; question: string; created_at: string }>();
const options = new Map<string, PollOption>();
const votes: Vote[] = [];

// ─── Poll operations ─────────────────────────────────────────

export function createPoll(question: string, optionTexts: string[]): Poll {
  const pollId = randomUUID();
  const now = new Date().toISOString();

  const pollRecord = { id: pollId, question, created_at: now };
  polls.set(pollId, pollRecord);

  const pollOptions: PollOption[] = optionTexts.map((text) => {
    const opt: PollOption = {
      id: randomUUID(),
      poll_id: pollId,
      text,
      vote_count: 0,
    };
    options.set(opt.id, opt);
    return opt;
  });

  return { ...pollRecord, options: pollOptions };
}

export function getPoll(id: string): Poll | null {
  const poll = polls.get(id);
  if (!poll) return null;

  const pollOptions = Array.from(options.values())
    .filter((o) => o.poll_id === id)
    .sort((a, b) => a.id.localeCompare(b.id)); // stable order

  return { ...poll, options: pollOptions };
}

// ─── Vote operations ─────────────────────────────────────────

export function hasVotedByIp(pollId: string, ip: string): boolean {
  return votes.some((v) => v.poll_id === pollId && v.voter_ip === ip);
}

export function hasVotedByFingerprint(pollId: string, fingerprint: string): boolean {
  if (fingerprint === "unknown") return false;
  return votes.some((v) => v.poll_id === pollId && v.voter_fingerprint === fingerprint);
}

export function optionBelongsToPoll(optionId: string, pollId: string): boolean {
  const opt = options.get(optionId);
  return !!opt && opt.poll_id === pollId;
}

export function castVote(
  pollId: string,
  optionId: string,
  voterIp: string,
  voterFingerprint: string
): { success: boolean; error?: string } {
  // Double-check no duplicate (race condition guard)
  if (hasVotedByIp(pollId, voterIp)) {
    return { success: false, error: "You have already voted on this poll." };
  }
  if (voterFingerprint !== "unknown" && hasVotedByFingerprint(pollId, voterFingerprint)) {
    return { success: false, error: "You have already voted on this poll." };
  }

  const opt = options.get(optionId);
  if (!opt || opt.poll_id !== pollId) {
    return { success: false, error: "Option not found in this poll." };
  }

  // Record vote
  votes.push({
    id: randomUUID(),
    poll_id: pollId,
    option_id: optionId,
    voter_ip: voterIp,
    voter_fingerprint: voterFingerprint,
    created_at: new Date().toISOString(),
  });

  // Increment vote count
  opt.vote_count += 1;

  return { success: true };
}

export function pollExists(id: string): boolean {
  return polls.has(id);
}

// ─── For real-time polling: get current options for a poll ────

export function getOptions(pollId: string): PollOption[] {
  return Array.from(options.values())
    .filter((o) => o.poll_id === pollId)
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ─── Get all votes for a poll (for responses view) ───────────

export interface VoteWithOption {
  id: string;
  option_text: string;
  voter_ip: string;
  created_at: string;
}

export function getVotesForPoll(pollId: string): VoteWithOption[] {
  return votes
    .filter((v) => v.poll_id === pollId)
    .map((v) => {
      const opt = options.get(v.option_id);
      return {
        id: v.id,
        option_text: opt?.text ?? "Unknown",
        voter_ip: v.voter_ip,
        created_at: v.created_at,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
