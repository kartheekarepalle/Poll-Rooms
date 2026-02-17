import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="w-full max-w-lg mx-auto">
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <h2 className="text-4xl font-bold text-zinc-300 dark:text-zinc-700">
            404
          </h2>
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
            Page not found
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button variant="outline" asChild>
            <a href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
