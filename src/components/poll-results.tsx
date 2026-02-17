"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Trophy, TrendingUp, Users } from "lucide-react";
import type { PollOption } from "@/types";

interface PollResultsProps {
  options: PollOption[];
  totalVotes: number;
  votedOptionId: string | null;
}

// Vibrant gradient-matching color palette for chart bars
const COLORS = [
  "#667eea", // indigo
  "#764ba2", // purple
  "#f093fb", // pink
  "#5ee7df", // teal
  "#f5576c", // rose
  "#4facfe", // blue
  "#fa709a", // magenta
  "#fee140", // yellow
  "#a18cd1", // lavender
  "#fbc2eb", // light pink
];

/**
 * Premium results display with animated bars, Recharts chart,
 * winner highlight, and total vote counter.
 */
export function PollResults({
  options,
  totalVotes,
  votedOptionId,
}: PollResultsProps) {
  // Find leading option
  const maxVotes = useMemo(() => Math.max(...options.map(o => o.vote_count)), [options]);
  const winnerCount = useMemo(() => options.filter(o => o.vote_count === maxVotes).length, [options, maxVotes]);

  const chartData = options.map((opt) => ({
    name: opt.text.length > 25 ? opt.text.slice(0, 25) + "…" : opt.text,
    fullName: opt.text,
    votes: opt.vote_count,
    percentage: totalVotes > 0 ? ((opt.vote_count / totalVotes) * 100).toFixed(1) : "0.0",
    isVoted: opt.id === votedOptionId,
    isWinner: opt.vote_count === maxVotes && maxVotes > 0 && winnerCount === 1,
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{totalVotes}</p>
            <p className="text-xs text-zinc-500">Total Votes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-800">{options.length}</p>
            <p className="text-xs text-zinc-500">Options</p>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="w-full h-64 p-3 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12, fill: "#52525b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="glass-card rounded-lg px-3 py-2">
                    <p className="text-sm font-medium text-zinc-800">{data.fullName}</p>
                    <p className="text-xs text-zinc-500">
                      {data.votes} vote{data.votes !== 1 ? "s" : ""} ({data.percentage}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="votes"
              radius={[0, 6, 6, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.fullName}
                  fill={entry.isVoted ? "#16a34a" : entry.isWinner ? "#f59e0b" : COLORS[index % COLORS.length]}
                  opacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const percentage =
            totalVotes > 0
              ? ((option.vote_count / totalVotes) * 100).toFixed(1)
              : "0.0";
          const isVoted = option.id === votedOptionId;
          const isWinner = option.vote_count === maxVotes && maxVotes > 0 && winnerCount === 1;

          return (
            <div
              key={option.id}
              className={`space-y-1.5 p-3 rounded-xl transition-all duration-300 ${
                isWinner ? "bg-amber-50/80 border border-amber-200/50 winner-glow" :
                isVoted ? "bg-green-50/60 border border-green-200/50" :
                "bg-white/20"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold break-words max-w-[65%] flex items-center gap-1.5 ${
                  isWinner ? "text-amber-700" :
                  isVoted ? "text-green-700" :
                  "text-zinc-800"
                }`}>
                  {isWinner && <Trophy className="h-4 w-4 text-amber-500 shrink-0" />}
                  {option.text}
                  {isVoted && " ✓"}
                </span>
                <div className="text-right shrink-0 ml-2">
                  <span className={`text-lg font-bold ${
                    isWinner ? "text-amber-600" :
                    isVoted ? "text-green-600" :
                    "text-zinc-700"
                  }`}>
                    {percentage}%
                  </span>
                  <p className="text-xs text-zinc-500">
                    {option.vote_count} vote{option.vote_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {/* Animated progress bar */}
              <div className="w-full h-2.5 bg-white/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out progress-bar-animated"
                  style={{
                    width: `${totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0}%`,
                    backgroundColor: isVoted ? "#16a34a" : isWinner ? "#f59e0b" : COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
