"use client";

import "./globals.css";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the whole
 * document, so it renders its own <html>/<body> and avoids any app components.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 font-sans text-foreground">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium">
            ACME Salary Manager hit an unexpected error.
          </p>
          <p className="text-sm text-muted-foreground">
            Try again. If it keeps happening, share the reference below.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
