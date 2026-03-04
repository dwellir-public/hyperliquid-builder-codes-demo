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

type WizardAction =
  | { type: "COMPLETE_STEP" }
  | { type: "GO_TO_STEP"; index: number }
  | { type: "INSERT_DEPOSIT_STEP" }
  | { type: "REMOVE_DEPOSIT_STEP" };

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
    case "INSERT_DEPOSIT_STEP": {
      if (state.steps[0]?.id === "deposit") return state;
      return {
        ...state,
        steps: [DEPOSIT_STEP, ...state.steps],
        currentStep: state.currentStep + 1,
      };
    }
    case "REMOVE_DEPOSIT_STEP": {
      const idx = state.steps.findIndex((s) => s.id === "deposit");
      if (idx === -1 || state.completedSteps.has("deposit")) return state;
      const steps = state.steps.filter((s) => s.id !== "deposit");
      return {
        ...state,
        steps,
        currentStep: Math.max(0, state.currentStep - 1),
      };
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
    insertDeposit: () => dispatch({ type: "INSERT_DEPOSIT_STEP" }),
    removeDeposit: () => dispatch({ type: "REMOVE_DEPOSIT_STEP" }),
  };
}

export type WizardApi = ReturnType<typeof useWizard>;
