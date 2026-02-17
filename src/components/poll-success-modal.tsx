"use client";

import { useState, useEffect } from "react";
import { Check, Copy, ExternalLink, Sparkles, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PollSuccessModalProps {
  pollId: string;
  question: string;
  onOpenPoll: () => void;
}

/**
 * Premium success modal shown after poll creation.
 * Includes confetti effect, shareable link, copy button, and open poll button.
 */
export function PollSuccessModal({ pollId, question, onOpenPoll }: PollSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);

  const pollUrl = typeof window !== "undefined"
    ? `${window.location.origin}/poll/${pollId}`
    : `/poll/${pollId}`;

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setShow(true));
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement("input");
      input.value = pollUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${show ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Confetti particles */}
      <div className="confetti-container absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              backgroundColor: ["#667eea", "#764ba2", "#f093fb", "#5ee7df", "#f5576c", "#4facfe", "#fee140", "#22c55e"][i % 8],
            }}
          />
        ))}
      </div>

      {/* Modal */}
      <div className={`relative glass-card rounded-2xl p-8 max-w-md w-full space-y-6 transition-all duration-700 ${show ? "scale-100 translate-y-0" : "scale-90 translate-y-8"}`}>
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 success-icon-pop">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20" />
            <div className="absolute -inset-2 rounded-full border border-green-300 animate-ping opacity-10" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-zinc-800">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Poll Created!
              <Sparkles className="h-5 w-5 text-amber-500" />
            </span>
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Your poll &ldquo;<span className="font-medium text-zinc-700">{question.length > 60 ? question.slice(0, 60) + "…" : question}</span>&rdquo; is live and ready to receive votes.
          </p>
        </div>

        {/* Share link section */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <Share2 className="h-3.5 w-3.5" />
            Shareable Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/60 border border-zinc-200/80 text-sm text-zinc-600 font-mono truncate">
              {pollUrl}
            </div>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="icon"
              className={`shrink-0 h-10 w-10 rounded-xl transition-all duration-300 ${copied ? "!bg-green-50 !border-green-300" : ""}`}
              aria-label="Copy share link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600 animate-in zoom-in duration-200" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
              Copied to clipboard!
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={onOpenPoll}
            className="w-full text-base"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Poll
          </Button>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy Link to Share"}
          </Button>
        </div>
      </div>
    </div>
  );
}
