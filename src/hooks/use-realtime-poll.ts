"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { Poll, PollOption } from "@/types";

/**
 * Custom hook that polls the server every 2 seconds
 * to get fresh vote counts — no Supabase required.
 */
export function useRealtimePoll(poll: Poll | null) {
  const [options, setOptions] = useState<PollOption[]>(poll?.options || []);
  const [isConnected, setIsConnected] = useState(false);
  const pollId = poll?.id ?? null;

  // Sync initial options from poll data
  useEffect(() => {
    if (poll?.options) {
      setOptions(poll.options);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll?.id]);

  // Refresh function for manual calls
  const refreshOptions = useCallback(async () => {
    if (!pollId) return;
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.options) {
          setOptions(data.options);
        }
      }
    } catch (err) {
      console.error("Failed to refresh poll options:", err);
    }
  }, [pollId]);

  // Poll every 2 seconds for live updates
  useEffect(() => {
    if (!pollId) return;

    setIsConnected(true);

    const interval = setInterval(refreshOptions, 2000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [pollId, refreshOptions]);

  const totalVotes = useMemo(
    () => options.reduce((sum, opt) => sum + opt.vote_count, 0),
    [options]
  );

  return {
    options,
    totalVotes,
    isConnected,
    refreshOptions,
  };
}
