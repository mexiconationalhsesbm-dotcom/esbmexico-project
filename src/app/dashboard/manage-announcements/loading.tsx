import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      {/* Loader */}
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-6 dark:text-white" />

      {/* Main message */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        Getting Announcements...
      </h2>

      {/* Sub-message */}
      <p className="text-gray-500 dark:text-gray-400">
        Please wait a moment.
      </p>
    </div>
  );
}
