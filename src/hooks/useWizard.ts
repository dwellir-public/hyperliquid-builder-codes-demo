"use client";

import { useReducer } from "react";

export interface WizardStep {
  id: string;
  label: string;
}

interface WizardState {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: Set<string>;
}

type WizardAction = { type: "COMPLETE_STEP" } | { type: "GO_TO_STEP"; index: number };

const BASE_STEPS: WizardStep[] = [
  { id: "check-approval", label: "Check Approval" },
  { id: "approve-builder", label: "Approve Builder" },
  { id: "activate-agent", label: "Activate Agent" },
  { id: "place-order", label: "Place Order" },
  { id: "revoke", label: "Revoke Approval" },
];

const DEPOSIT_STEP: WizardStep = { id: "deposit", label: "Deposit USDC" };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "COMPLETE_STEP": {
      const currentId = state.steps[state.currentStep]?.id;
      if (!currentId) return state;
      const completedSteps = new Set(state.completedSteps);
      completedSteps.add(currentId);
      const nextStep = Math.min(state.currentStep + 1, state.steps.length - 1);
      return { ...state, completedSteps, currentStep: nextStep };
    }
    case "GO_TO_STEP": {
      const targetId = state.steps[action.index]?.id;
      if (!targetId) return state;
      if (!state.completedSteps.has(targetId) && action.index !== state.currentStep) return state;
      return { ...state, currentStep: action.index };
    }
  }
}

function init(includeDeposit: boolean): WizardState {
  const steps = includeDeposit ? [DEPOSIT_STEP, ...BASE_STEPS] : [...BASE_STEPS];
  return {
    steps,
    currentStep: 0,
    completedSteps: new Set<string>(),
  };
}

export function useWizard(includeDeposit: boolean) {
  const [state, dispatch] = useReducer(reducer, includeDeposit, init);

  return {
    steps: state.steps,
    currentStep: state.currentStep,
    currentStepId: state.steps[state.currentStep]?.id ?? "",
    completedSteps: state.completedSteps,
    completeStep: () => dispatch({ type: "COMPLETE_STEP" }),
    goToStep: (index: number) => dispatch({ type: "GO_TO_STEP", index }),
  };
}

export type WizardApi = ReturnType<typeof useWizard>;
