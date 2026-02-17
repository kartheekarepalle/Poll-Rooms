"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareLinkProps {
  pollId: string;
}

/**
 * Copy-to-clipboard button for the poll's shareable link.
 * Shows a brief checkmark animation after copying.
 */
export function ShareLink({ pollId }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/poll/${pollId}`
        : "";

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/30 backdrop-blur-sm border border-white/30 text-sm text-zinc-600 overflow-hidden">
        <LinkIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {typeof window !== "undefined"
            ? `${window.location.origin}/poll/${pollId}`
            : `/poll/${pollId}`}
        </span>
      </div>
      <Button
        onClick={handleCopy}
        variant="outline"
        size="icon"
        className="shrink-0 transition-all duration-200"
        aria-label="Copy share link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500 animate-in zoom-in duration-150" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
