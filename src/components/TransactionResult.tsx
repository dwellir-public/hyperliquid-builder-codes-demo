"use client";

import { parseHLResult, type ResultContext } from "@/lib/parseHLResult";

interface TransactionResultProps {
  result: unknown;
  error: string | null;
  context?: ResultContext;
}

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

export default function TransactionResult({
  result,
  error,
  context = "order",
}: TransactionResultProps) {
  if (!result && !error) return null;

  const rawJson =
    result != null
      ? typeof result === "string"
        ? result
        : JSON.stringify(result, null, 2)
      : null;

  return (
    <div className="mt-4 space-y-2">
      {error ? (
        <div className="bg-hl-red/10 border border-hl-red/30 rounded-lg p-3 flex items-start gap-2">
          {ICONS.error}
          <p className="text-sm text-hl-red break-all">{error}</p>
        </div>
      ) : null}
      {result != null ? (
        <>
          {(() => {
            const parsed = parseHLResult(result, context);
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
          {rawJson && (
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
