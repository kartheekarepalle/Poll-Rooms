import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

/**
 * Loading skeleton shown while poll data is being fetched.
 */
export function PollSkeleton() {
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg mt-4" />
      </CardContent>
    </Card>
  );
}
