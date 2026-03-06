"use client";

import type { WizardApi } from "@/hooks/useWizard";

interface WizardStepperProps {
  wizard: WizardApi;
}

export default function WizardStepper({ wizard }: WizardStepperProps) {
  const { steps, currentStep, completedSteps, alwaysClickable, progressStep, goToStep } = wizard;

  return (
    <nav aria-label="Wizard progress" className="flex items-start justify-center gap-0">
      {steps.map((step, i) => {
        const isCompleted = completedSteps.has(step.id);
        const isCurrent = i === currentStep;
        const isReachable = i <= progressStep;
        const isAlwaysClickable = alwaysClickable.has(step.id);
        const isFuture = !isCompleted && !isCurrent && !isReachable && !isAlwaysClickable;
        const isClickable = isCompleted || isCurrent || isReachable || isAlwaysClickable;

        return (
          <div key={step.id} className="flex items-start">
            {i > 0 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mt-4 ${isCompleted || isCurrent ? "bg-hl-green" : "bg-hl-border"}`}
              />
            )}
            <button
              type="button"
              onClick={() => goToStep(i)}
              disabled={isFuture}
              aria-current={isCurrent ? "step" : undefined}
              className="flex flex-col items-center gap-1 group"
              title={step.label}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-hl-green text-white"
                    : isCurrent
                      ? "ring-2 ring-hl-green bg-hl-green/20 text-hl-green"
                      : "bg-hl-border/50 text-hl-muted"
                } ${isClickable && !isCurrent ? "cursor-pointer hover:brightness-110" : ""} ${isFuture ? "cursor-default" : ""}`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-[10px] max-w-[60px] text-center leading-tight hidden sm:block ${
                  isCurrent ? "text-hl-green font-medium" : "text-hl-muted"
                }`}
              >
                {step.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
