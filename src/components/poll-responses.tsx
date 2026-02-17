"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Globe, Hash, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoteResponse {
  id: string;
  option_text: string;
  voter_ip: string;
  created_at: string;
}

interface PollResponsesProps {
  pollId: string;
}

/**
 * Shows a live-updating table of all individual vote responses.
 * Masks voter IPs for privacy (shows partial IP).
 * Auto-refreshes every 5 seconds.
 */
export function PollResponses({ pollId }: PollResponsesProps) {
  const [responses, setResponses] = useState<VoteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}/responses`);
      if (res.ok) {
        const data = await res.json();
        setResponses(data.responses);
      }
    } catch (err) {
      console.error("Failed to fetch responses:", err);
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  // Initial fetch + auto-refresh every 5 seconds
  useEffect(() => {
    fetchResponses();
    const interval = setInterval(fetchResponses, 5000);
    return () => clearInterval(interval);
  }, [fetchResponses]);

  function maskIp(ip: string): string {
    if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return "localhost";
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    // IPv6 — show first segment
    if (ip.includes(":")) {
      const segments = ip.split(":");
      return `${segments[0]}:${segments[1]}:***`;
    }
    return ip.slice(0, 6) + "***";
  }

  function formatTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-white/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="h-14 w-14 rounded-full bg-white/30 flex items-center justify-center mx-auto">
          <Users className="h-7 w-7 text-zinc-400" />
        </div>
        <p className="text-sm text-zinc-500">No responses yet</p>
        <p className="text-xs text-zinc-400">Votes will appear here in real-time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Hash className="h-4 w-4" />
          <span className="font-semibold">{responses.length}</span>
          <span>response{responses.length !== 1 ? "s" : ""}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchResponses}
          className="h-8 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Response list */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {responses.map((response, index) => (
          <div
            key={response.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 hover:bg-white/50 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
            style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
          >
            {/* Voter avatar */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
              V{responses.length - index}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-800 truncate">
                {response.option_text}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {maskIp(response.voter_ip)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(response.created_at)}
                </span>
              </div>
            </div>

            {/* Index badge */}
            <div className="text-[10px] font-mono text-zinc-400 bg-white/50 px-1.5 py-0.5 rounded-md shrink-0">
              #{responses.length - index}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
