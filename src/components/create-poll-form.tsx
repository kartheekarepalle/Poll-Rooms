"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PollSuccessModal } from "@/components/poll-success-modal";
import { toast } from "sonner";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export function CreatePollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ question?: string; options?: string }>(
    {}
  );
  const [createdPoll, setCreatedPoll] = useState<{ id: string; question: string } | null>(null);

  // ── Option Management ─────────────────────────────────────

  function addOption() {
    if (options.length >= MAX_OPTIONS) {
      toast.error(`Maximum ${MAX_OPTIONS} options allowed.`);
      return;
    }
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) {
      toast.error(`At least ${MIN_OPTIONS} options required.`);
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    // Clear option errors on type
    if (errors.options) {
      setErrors((prev) => ({ ...prev, options: undefined }));
    }
  }

  // ── Validation ────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (!question.trim()) {
      newErrors.question = "Please enter your poll question.";
    } else if (question.trim().length > 500) {
      newErrors.question = "Question must be 500 characters or less.";
    }

    const filledOptions = options.filter((o) => o.trim().length > 0);
    if (filledOptions.length < MIN_OPTIONS) {
      newErrors.options = `At least ${MIN_OPTIONS} non-empty options are required.`;
    }

    const tooLong = options.find((o) => o.trim().length > 200);
    if (tooLong) {
      newErrors.options = "Each option must be 200 characters or less.";
    }

    const unique = new Set(filledOptions.map((o) => o.trim().toLowerCase()));
    if (unique.size !== filledOptions.length) {
      newErrors.options = "Duplicate options are not allowed.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          options: options.filter((o) => o.trim().length > 0).map((o) => o.trim()),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create poll.");
        return;
      }

      toast.success("Poll created successfully!");
      setCreatedPoll({ id: data.poll.id, question: question.trim() });
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* Success Modal */}
      {createdPoll && (
        <PollSuccessModal
          pollId={createdPoll.id}
          question={createdPoll.question}
          onOpenPoll={() => router.push(`/poll/${createdPoll.id}`)}
        />
      )}

      <Card className="w-full max-w-lg mx-auto page-enter">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Vote className="h-6 w-6 text-indigo-600" />
          <CardTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Create a Poll</CardTitle>
        </div>
        <CardDescription>
          Ask a question, add options, and share with anyone.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Your Question</Label>
            <Input
              id="question"
              placeholder="What should we have for lunch?"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (errors.question) {
                  setErrors((prev) => ({ ...prev, question: undefined }));
                }
              }}
              maxLength={500}
              autoFocus
            />
            {errors.question && (
              <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                {errors.question}
              </p>
            )}
            <p className="text-xs text-zinc-400/80 text-right">
              {question.length}/500
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div
                key={index}
                className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
              >
                <span className="text-sm font-medium text-indigo-400 w-6 text-center shrink-0">
                  {index + 1}
                </span>
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  maxLength={200}
                />
                {options.length > MIN_OPTIONS && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {errors.options && (
              <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                {errors.options}
              </p>
            )}

            {options.length < MAX_OPTIONS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full text-base"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Poll...
              </>
            ) : (
              "Create Poll"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
    </>
  );
}
