"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wifi, WifiOff, ShieldCheck, Lock, AlertTriangle, Search, BarChart3, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PollOptions } from "@/components/poll-options";
import { PollResults } from "@/components/poll-results";
import { PollResponses } from "@/components/poll-responses";
import { ShareLink } from "@/components/share-link";
import { PollSkeleton } from "@/components/poll-skeleton";
import { useRealtimePoll } from "@/hooks/use-realtime-poll";
import {
  generateFingerprint,
  hasVotedLocally,
  markVotedLocally,
  getLocalVote,
} from "@/lib/fingerprint";
import type { Poll } from "@/types";

export default function PollPage() {
  const params = useParams();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "responses">("results");

  // Real-time subscription
  const { options, totalVotes, isConnected } = useRealtimePoll(poll);

  // ── Fetch poll data ───────────────────────────────────────
  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/polls/${pollId}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load poll.");
        return;
      }

      setPoll(data);

      // Check local storage for prior vote (fairness mechanism #2)
      if (hasVotedLocally(pollId)) {
        setHasVoted(true);
        setVotedOptionId(getLocalVote(pollId));
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    if (pollId) fetchPoll();
  }, [pollId, fetchPoll]);

  // ── Cross-tab vote sync via storage event ─────────────────
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === "poll_rooms_voted" && !hasVoted) {
        // Another tab voted — check if it was for this poll
        if (hasVotedLocally(pollId)) {
          setHasVoted(true);
          setVotedOptionId(getLocalVote(pollId));
          toast.info("Vote detected from another tab.");
        }
      }
    }
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [pollId, hasVoted]);

  // ── Cast vote handler ─────────────────────────────────────
  async function handleVote(optionId: string) {
    if (hasVoted || isVoting) return;
    setIsVoting(true);

    try {
      const fingerprint = generateFingerprint();

      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_id: optionId, fingerprint }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If already voted (409), mark locally so they see results
        if (res.status === 409) {
          markVotedLocally(pollId, optionId);
          setHasVoted(true);
          setVotedOptionId(optionId);
          toast.info("You have already voted on this poll.");
        } else {
          toast.error(data.error || "Failed to cast vote.");
        }
        return;
      }

      // Success — mark as voted locally and show results
      markVotedLocally(pollId, optionId);
      setHasVoted(true);
      setVotedOptionId(optionId);
      toast.success("Vote recorded!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsVoting(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-6 page-enter">
        <PollSkeleton />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────
  if (error || !poll) {
    const isNotFound = error?.includes("not found") || error?.includes("Invalid");
    return (
      <div className="w-full max-w-lg mx-auto page-enter">
        <Card>
          <CardContent className="py-12 text-center space-y-5">
            <div className="flex justify-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isNotFound ? "bg-amber-100" : "bg-red-100"}`}>
                {isNotFound ? (
                  <Search className="h-8 w-8 text-amber-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-zinc-800">
                {isNotFound ? "Poll Not Found" : "Something Went Wrong"}
              </p>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                {isNotFound
                  ? "This poll may have been removed or the link might be incorrect."
                  : error || "We couldn't load this poll. Please check your connection and try again."
                }
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {!isNotFound && (
                <Button onClick={fetchPoll} variant="outline">
                  Try Again
                </Button>
              )}
              <Button variant={isNotFound ? "default" : "ghost"} asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Create a new poll
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="w-full max-w-lg mx-auto space-y-6 page-enter">
      {/* Already Voted Banner */}
      {hasVoted && (
        <div className="voted-banner rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">You&apos;ve already voted in this poll</p>
            <p className="text-xs text-green-600/80">Your vote has been recorded. Results are updating live below.</p>
          </div>
          <Lock className="h-4 w-4 text-green-500/60 shrink-0 ml-auto" />
        </div>
      )}

      {/* Poll Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{poll.question}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-zinc-600">Live updates active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-zinc-500">Connecting...</span>
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Voting UI or Results/Responses */}
          {!hasVoted ? (
            <PollOptions
              options={options}
              pollId={pollId}
              hasVoted={hasVoted}
              votedOptionId={votedOptionId}
              onVote={handleVote}
              isVoting={isVoting}
            />
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
                <button
                  onClick={() => setActiveTab("results")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "results"
                      ? "bg-white/80 text-zinc-800 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-white/20"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Results
                </button>
                <button
                  onClick={() => setActiveTab("responses")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === "responses"
                      ? "bg-white/80 text-zinc-800 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-white/20"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Responses
                </button>
              </div>

              {/* Tab content */}
              {activeTab === "results" ? (
                <PollResults
                  options={options}
                  totalVotes={totalVotes}
                  votedOptionId={votedOptionId}
                />
              ) : (
                <PollResponses pollId={pollId} />
              )}
            </>
          )}

          {/* Share Link */}
          <div className="pt-4 border-t border-zinc-200/50">
            <p className="text-sm text-zinc-500 mb-2">
              Share this poll
            </p>
            <ShareLink pollId={pollId} />
          </div>
        </CardContent>
      </Card>

      {/* Back link */}
      <div className="text-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Create your own poll
          </Link>
        </Button>
      </div>
    </div>
  );
}
