"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PollOption } from "@/types";

interface PollOptionsProps {
  options: PollOption[];
  pollId: string;
  hasVoted: boolean;
  votedOptionId: string | null;
  onVote: (optionId: string) => void;
  isVoting: boolean;
}

/**
 * Displays poll options as selectable cards.
 * After voting, options become non-interactive and show the user's choice.
 */
export function PollOptions({
  options,
  hasVoted,
  votedOptionId,
  onVote,
  isVoting,
}: PollOptionsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(optionId: string) {
    if (hasVoted || isVoting) return;
    setSelectedId(optionId);
  }

  function handleVote() {
    if (!selectedId || hasVoted || isVoting) return;
    onVote(selectedId);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedId === option.id;
          const isVotedFor = votedOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={hasVoted || isVoting}
              className={cn(
                "option-card w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
                "disabled:cursor-default disabled:hover:scale-100 disabled:hover:shadow-none",
                isSelected && !hasVoted
                  ? "border-indigo-500 bg-indigo-50/80 shadow-indigo-100"
                  : "border-white/30 bg-white/50 backdrop-blur-sm",
                isVotedFor &&
                  "border-green-500 bg-green-50/80"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium break-words">
                  {option.text}
                </span>
                {isSelected && !hasVoted && (
                  <div className="shrink-0 h-5 w-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center animate-in zoom-in duration-150">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {isVotedFor && (
                  <div className="shrink-0 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-150">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!hasVoted && (
        <Button
          onClick={handleVote}
          disabled={!selectedId || isVoting}
          className="w-full"
          size="lg"
        >
          {isVoting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting Vote...
            </>
          ) : (
            "Cast Your Vote"
          )}
        </Button>
      )}
    </div>
  );
}
