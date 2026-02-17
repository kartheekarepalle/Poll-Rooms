const STORAGE_KEY = "poll_rooms_voted";

/**
 * Generate a simple browser fingerprint based on available navigator properties.
 * Not cryptographically strong, but sufficient for casual anti-abuse.
 */
export function generateFingerprint(): string {
  if (typeof window === "undefined") return "server";

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() ?? "unknown",
  ];

  // Simple hash from string components
  const raw = components.join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if user has already voted on a given poll (localStorage check).
 */
export function hasVotedLocally(pollId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const voted = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return !!voted[pollId];
  } catch {
    return false;
  }
}

/**
 * Mark a poll as voted in localStorage.
 */
export function markVotedLocally(pollId: string, optionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const voted = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    voted[pollId] = optionId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(voted));
  } catch {
    // Silently fail — localStorage might be disabled
  }
}

/**
 * Get the option the user voted for locally (if any).
 */
export function getLocalVote(pollId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const voted = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return voted[pollId] || null;
  } catch {
    return null;
  }
}
