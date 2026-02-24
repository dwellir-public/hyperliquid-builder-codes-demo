"use client";

import { useBuilderIncome } from "@/hooks/useBuilderIncome";
import { DWELLIR_BUILDER_ADDRESS, feeToHuman, DEFAULT_BUILDER_FEE } from "@/config/constants";

export default function BuilderIncomeBar() {
  const { data, isLoading } = useBuilderIncome();

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-hl-card/95 backdrop-blur border-t border-hl-border">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="text-hl-muted">Builder Fee Income</span>
          {isLoading ? (
            <span className="text-hl-muted/50 font-mono">...</span>
          ) : data ? (
            <span className="text-hl-green font-mono font-medium">
              ${data.builderRewards.toFixed(8)} USDC
            </span>
          ) : (
            <span className="text-hl-muted/50 font-mono">unavailable</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-hl-muted">
          <span className="font-mono text-[10px] hidden sm:inline truncate max-w-[180px]">
            {DWELLIR_BUILDER_ADDRESS}
          </span>
          <span className="text-[10px]">
            Fee: {feeToHuman(DEFAULT_BUILDER_FEE)}
          </span>
          <a
            href="https://dwellir.com"
            className="text-hl-green hover:underline whitespace-nowrap"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dwellir
          </a>
        </div>
      </div>
    </div>
  );
}
