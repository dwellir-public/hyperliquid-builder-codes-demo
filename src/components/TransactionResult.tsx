"use client";

import { useState, useEffect } from "react";
import { parseHLResult, type ResultContext } from "@/lib/parseHLResult";

interface TransactionResultProps {
  result: unknown;
  error: string | null;
  context?: ResultContext;
}

const AUTO_DISMISS_MS = 4000;
const FADE_DURATION_MS = 500;

const ICONS = {
  success: (
    <svg className="w-4 h-4 text-hl-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-hl-red flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/**
 * Inner component that manages its own fade lifecycle.
 * Keyed by content identity so it remounts on new results.
 */
function ResultBubble({
  result,
  error,
  context,
}: TransactionResultProps) {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const isError = error != null;
    const parsed = result != null ? parseHLResult(result, context ?? "order") : null;
    const isResultError = parsed?.icon === "error";

    if (isError || isResultError) return;

    const fadeTimer = setTimeout(() => setFading(true), AUTO_DISMISS_MS);
    const hideTimer = setTimeout(() => setHidden(true), AUTO_DISMISS_MS + FADE_DURATION_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hidden) return null;

  const rawJson =
    result != null
      ? typeof result === "string"
        ? result
        : JSON.stringify(result, null, 2)
      : null;

  return (
    <div
      className={`mt-4 space-y-2 animate-toast-enter transition-all ease-in-out ${
        fading ? "opacity-0 translate-y-1" : ""
      }`}
      style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
    >
      {error ? (
        <div className="bg-hl-red/10 border border-hl-red/30 rounded-lg p-3 flex items-start gap-2">
          {ICONS.error}
          <p className="text-sm text-hl-red break-all">{error}</p>
        </div>
      ) : null}
      {result != null ? (
        <>
          {(() => {
            const parsed = parseHLResult(result, context ?? "order");
            return (
              <div
                className={`border rounded-lg p-3 flex items-start gap-2 ${
                  parsed.icon === "error"
                    ? "bg-hl-red/10 border-hl-red/30"
                    : "bg-hl-green/10 border-hl-green/30"
                }`}
              >
                {ICONS[parsed.icon]}
                <p
                  className={`text-sm font-medium ${
                    parsed.icon === "error" ? "text-hl-red" : "text-hl-green"
                  }`}
                >
                  {parsed.message}
                </p>
              </div>
            );
          })()}
          {rawJson && !fading && (
            <details className="text-xs">
              <summary className="text-hl-muted cursor-pointer hover:text-white">
                Raw response
              </summary>
              <pre className="mt-1 p-2 bg-hl-bg border border-hl-border rounded text-hl-muted font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">
                {rawJson}
              </pre>
            </details>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function TransactionResult({
  result,
  error,
  context = "order",
}: TransactionResultProps) {
  if (!result && !error) return null;

  // Key by content identity so the inner component remounts on new results,
  // giving it a fresh animation and auto-dismiss timer.
  const contentKey =
    (result != null ? JSON.stringify(result) : "") +
    (error ?? "");

  return (
    <ResultBubble
      key={contentKey}
      result={result}
      error={error}
      context={context}
    />
  );
}
