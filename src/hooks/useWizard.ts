"use client";

import { useReducer } from "react";

export interface WizardStep {
  id: string;
  label: string;
}

interface WizardState {
  steps: WizardStep[];
  currentStep: number;
  /** The furthest step reached through natural progression */
  progressStep: number;
  completedSteps: Set<string>;
  alwaysClickable: Set<string>;
}

type WizardAction = { type: "COMPLETE_STEP" } | { type: "GO_TO_STEP"; index: number };

const PRE_DEPOSIT_STEPS: WizardStep[] = [
  { id: "check-approval", label: "Check Approval" },
  { id: "approve-builder", label: "Approve Builder" },
];

const DEPOSIT_STEP: WizardStep = { id: "deposit", label: "Deposit USDC" };

const POST_DEPOSIT_STEPS: WizardStep[] = [
  { id: "activate-agent", label: "Activate Agent" },
  { id: "place-order", label: "Place Order" },
  { id: "revoke", label: "Revoke Approval" },
  { id: "complete", label: "What's Next" },
];

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "COMPLETE_STEP": {
      const currentId = state.steps[state.currentStep]?.id;
      if (!currentId) return state;
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(currentId);
      const nextStep = Math.min(state.currentStep + 1, state.steps.length - 1);
      return {
        ...state,
        completedSteps,
        currentStep: nextStep,
        progressStep: Math.max(state.progressStep, nextStep),
      };
    }
    case "GO_TO_STEP": {
      const targetId = state.steps[action.index]?.id;
      if (!targetId) return state;
      const isAllowed =
        state.completedSteps.has(targetId) ||
        action.index === state.currentStep ||
        action.index <= state.progressStep ||
        state.alwaysClickable.has(targetId);
      if (!isAllowed) return state;
      return { ...state, currentStep: action.index };
    }
  }
}

interface WizardOptions {
  includeDeposit: boolean;
  preCompleted?: string[];
  alwaysClickable?: string[];
}

function init(options: WizardOptions): WizardState {
  const steps = options.includeDeposit
    ? [...PRE_DEPOSIT_STEPS, DEPOSIT_STEP, ...POST_DEPOSIT_STEPS]
    : [...PRE_DEPOSIT_STEPS, ...POST_DEPOSIT_STEPS];

  const completedSteps = new Set<string>(options.preCompleted ?? []);

  // Advance currentStep past all pre-completed steps
  let currentStep = 0;
  while (currentStep < steps.length && completedSteps.has(steps[currentStep].id)) {
    currentStep++;
  }
  // Clamp to last step if everything is completed
  if (currentStep >= steps.length) {
    currentStep = steps.length - 1;
  }

  const alwaysClickable = new Set<string>(options.alwaysClickable ?? []);

  return { steps, currentStep, progressStep: currentStep, completedSteps, alwaysClickable };
}

export function useWizard(options: WizardOptions) {
  const [state, dispatch] = useReducer(reducer, options, init);

  return {
    steps: state.steps,
    currentStep: state.currentStep,
    progressStep: state.progressStep,
    currentStepId: state.steps[state.currentStep]?.id ?? "",
    completedSteps: state.completedSteps,
    alwaysClickable: state.alwaysClickable,
    completeStep: () => dispatch({ type: "COMPLETE_STEP" }),
    goToStep: (index: number) => dispatch({ type: "GO_TO_STEP", index }),
  };
}

export type WizardApi = ReturnType<typeof useWizard>;
