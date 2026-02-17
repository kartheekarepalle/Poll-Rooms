import { CreatePollForm } from "@/components/create-poll-form";

export default function HomePage() {
  return (
    <div className="w-full max-w-lg mx-auto space-y-8 page-enter">
      {/* Hero */}
      <div className="text-center space-y-3 stagger-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live Polling
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl shimmer-text">
          Real-Time Poll Rooms
        </h1>
        <p className="text-white/70 text-base max-w-md mx-auto">
          Create a poll in seconds. Share the link. Watch votes roll in live.
        </p>
      </div>

      {/* Create Poll Form */}
      <CreatePollForm />
    </div>
  );
}
