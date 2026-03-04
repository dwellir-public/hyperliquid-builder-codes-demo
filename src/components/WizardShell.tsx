"use client";

import type { ReactNode } from "react";
import type { WizardApi } from "@/hooks/useWizard";
import WizardStepper from "./WizardStepper";

interface WizardShellProps {
  wizard: WizardApi;
  children: ReactNode;
}

export default function WizardShell({ wizard, children }: WizardShellProps) {
  return (
    <div className="space-y-6">
      <WizardStepper wizard={wizard} />
      <div className="bg-hl-card border border-hl-border rounded-xl p-6">{children}</div>
    </div>
  );
}
