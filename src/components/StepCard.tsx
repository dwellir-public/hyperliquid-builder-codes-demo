"use client";

import type { ReactNode } from "react";

interface StepCardProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
  disabled?: boolean;
  completed?: boolean;
  locked?: boolean;
}

export default function StepCard({
  step,
  title,
  description,
  children,
  disabled,
  completed,
  locked,
}: StepCardProps) {
  return (
    <div
      className={`bg-hl-card border border-hl-border rounded-xl p-6 relative ${
        disabled || locked ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start gap-4 mb-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-hl-green/10 text-hl-green text-sm font-bold">
          {completed ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : locked ? (
            <svg
              className="w-4 h-4 text-hl-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ) : (
            step
          )}
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-hl-muted mt-1">
            {locked ? "Complete previous steps first." : description}
          </p>
        </div>
      </div>
      <div className={`ml-12 ${locked ? "pointer-events-none" : ""}`}>
        {children}
      </div>
    </div>
  );
}
