/**
 * Supabase-backed data store for polls, options, and votes.
 *
 * All operations go through the Supabase client, so data persists
 * across server restarts and serverless function invocations.
 */

import { getSupabase } from "@/lib/supabase";
import type { Poll, PollOption } from "@/types";

// Helper: typed Supabase query results
type PollRow = { id: string; question: string; created_at: string };
type OptionRow = { id: string; poll_id: string; text: string; votes: number };
type VoteRow = { id: string; poll_id: string; option_id: string; voter_ip: string; fingerprint: string; created_at: string };

// ─── Poll operations ─────────────────────────────────────────

export async function createPoll(question: string, optionTexts: string[]): Promise<Poll> {
  const supabase = getSupabase();

  // Insert poll
  const { data, error: pollError } = await supabase
    .from("polls")
    .insert({ question } as never)
    .select()
    .single();

  if (pollError || !data) {
    throw new Error(`Failed to create poll: ${pollError?.message}`);
  }

  const poll = data as unknown as PollRow;

  // Insert options
  const optionRows = optionTexts.map((text) => ({
    poll_id: poll.id,
    text,
  }));

  const { data: optData, error: optError } = await supabase
    .from("options")
    .insert(optionRows as never)
    .select();

  if (optError || !optData) {
    throw new Error(`Failed to create options: ${optError?.message}`);
  }

  const options = optData as unknown as OptionRow[];

  const pollOptions: PollOption[] = options.map((o) => ({
    id: o.id,
    poll_id: o.poll_id,
    text: o.text,
    vote_count: o.votes ?? 0,
  }));

  return {
    id: poll.id,
    question: poll.question,
    created_at: poll.created_at,
    options: pollOptions,
  };
}

export async function getPoll(id: string): Promise<Poll | null> {
  const supabase = getSupabase();

  const { data, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (pollError || !data) return null;

  const poll = data as unknown as PollRow;

  const { data: optData } = await supabase
    .from("options")
    .select("*")
    .eq("poll_id", id)
    .order("id");

  const options = (optData ?? []) as unknown as OptionRow[];

  const pollOptions: PollOption[] = options.map((o) => ({
    id: o.id,
    poll_id: o.poll_id,
    text: o.text,
    vote_count: o.votes ?? 0,
  }));

  return {
    id: poll.id,
    question: poll.question,
    created_at: poll.created_at,
    options: pollOptions,
  };
}

// ─── Vote operations ─────────────────────────────────────────

export async function hasVotedByIp(pollId: string, ip: string): Promise<boolean> {
  const supabase = getSupabase();
  const { count } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", pollId)
    .eq("voter_ip", ip);
  return (count ?? 0) > 0;
}

export async function hasVotedByFingerprint(pollId: string, fingerprint: string): Promise<boolean> {
  if (fingerprint === "unknown") return false;
  const supabase = getSupabase();
  const { count } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", pollId)
    .eq("fingerprint", fingerprint);
  return (count ?? 0) > 0;
}

export async function optionBelongsToPoll(optionId: string, pollId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { count } = await supabase
    .from("options")
    .select("*", { count: "exact", head: true })
    .eq("id", optionId)
    .eq("poll_id", pollId);
  return (count ?? 0) > 0;
}

export async function castVote(
  pollId: string,
  optionId: string,
  voterIp: string,
  voterFingerprint: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  // Insert vote (unique indexes will reject duplicates at DB level)
  const { error: voteError } = await supabase
    .from("votes")
    .insert({
      poll_id: pollId,
      option_id: optionId,
      voter_ip: voterIp,
      fingerprint: voterFingerprint,
    } as never);

  if (voteError) {
    // Unique constraint violation = duplicate vote
    if (voteError.code === "23505") {
      return { success: false, error: "You have already voted on this poll." };
    }
    return { success: false, error: voteError.message };
  }

  // Increment vote count on the option
  // Get current count and increment
  const { data: opt } = await supabase
    .from("options")
    .select("votes")
    .eq("id", optionId)
    .single();

  const currentCount = (opt as unknown as { votes: number })?.votes ?? 0;

  await supabase
    .from("options")
    .update({ votes: currentCount + 1 } as never)
    .eq("id", optionId);

  return { success: true };
}

export async function pollExists(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { count } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true })
    .eq("id", id);
  return (count ?? 0) > 0;
}

// ─── For real-time polling: get current options for a poll ────

export async function getOptions(pollId: string): Promise<PollOption[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("options")
    .select("*")
    .eq("poll_id", pollId)
    .order("id");

  const options = (data ?? []) as unknown as OptionRow[];

  return options.map((o) => ({
    id: o.id,
    poll_id: o.poll_id,
    text: o.text,
    vote_count: o.votes ?? 0,
  }));
}

// ─── Get all votes for a poll (for responses view) ───────────

export interface VoteWithOption {
  id: string;
  option_text: string;
  voter_ip: string;
  created_at: string;
}

export async function getVotesForPoll(pollId: string): Promise<VoteWithOption[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("votes")
    .select("id, voter_ip, created_at, option_id")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: false });

  const votes = (data ?? []) as unknown as VoteRow[];

  // Get all option texts for this poll
  const { data: optData } = await supabase
    .from("options")
    .select("id, text")
    .eq("poll_id", pollId);

  const optMap = new Map<string, string>();
  for (const o of (optData ?? []) as unknown as { id: string; text: string }[]) {
    optMap.set(o.id, o.text);
  }

  return votes.map((v) => ({
    id: v.id,
    option_text: optMap.get(v.option_id) ?? "Unknown",
    voter_ip: v.voter_ip,
    created_at: v.created_at,
  }));
}
