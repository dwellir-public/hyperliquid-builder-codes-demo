"use client";

import { useEffect } from "react";
import { MIN_DEPOSIT_USDC } from "@/config/constants";
import { useAccountState } from "@/hooks/useAccountState";
import { useDeposit } from "@/hooks/useDeposit";

interface DepositStepProps {
  onComplete: () => void;
}

export default function DepositStep({ onComplete }: DepositStepProps) {
  const { data: account } = useAccountState();
  const deposit = useDeposit();

  const {
    amount,
    setAmount,
    step,
    setStep,
    txError,
    setTxError,
    balance,
    ethBalance,
    hasEnoughUsdc,
    hasEnoughGas,
    gasDisplay,
    isValidAmount,
    parsedAmount,
    isTransferPending,
    handleDeposit,
    chainId,
    usdcAddress,
  } = deposit;

  // Show success state when HL balance appears, then advance after a delay
  useEffect(() => {
    if (account && account.balance > 0 && step !== "success") {
      setStep("success");
      const timer = setTimeout(() => onComplete(), 2500);
      return () => clearTimeout(timer);
    }
  }, [account, step, onComplete, setStep]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Deposit USDC</h2>
        <p className="text-sm text-hl-muted mt-1">
          You need USDC on Hyperliquid to place orders. Deposit from your Arbitrum wallet.
        </p>
      </div>

      {step === "success" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hl-green" />
            <span className="text-sm font-medium text-hl-green">
              Deposit confirmed — ${account?.balance.toFixed(2)} available on Hyperliquid
            </span>
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 transition-colors"
          >
            Continue
          </button>
        </div>
      ) : balance === undefined || ethBalance === undefined ? (
        <p className="text-sm text-hl-muted">Checking Arbitrum balances...</p>
      ) : hasEnoughUsdc && hasEnoughGas ? (
        <DepositForm
          balance={balance}
          ethBalance={ethBalance}
          gasDisplay={gasDisplay}
          amount={amount}
          setAmount={setAmount}
          isValidAmount={isValidAmount}
          parsedAmount={parsedAmount}
          step={step}
          isTransferPending={isTransferPending}
          txError={txError}
          setTxError={setTxError}
          handleDeposit={handleDeposit}
        />
      ) : (
        <BalanceGuidance
          balance={balance}
          ethBalance={ethBalance}
          hasEnoughUsdc={hasEnoughUsdc}
          hasEnoughGas={hasEnoughGas}
          gasDisplay={gasDisplay}
          chainId={chainId}
          usdcAddress={usdcAddress}
        />
      )}
    </div>
  );
}

function DepositForm({
  balance,
  ethBalance,
  gasDisplay,
  amount,
  setAmount,
  isValidAmount,
  parsedAmount,
  step,
  isTransferPending,
  txError,
  setTxError,
  handleDeposit,
}: {
  balance: number;
  ethBalance: number;
  gasDisplay: string | null;
  amount: string;
  setAmount: (v: string) => void;
  isValidAmount: boolean;
  parsedAmount: number;
  step: "idle" | "transferring" | "waiting" | "success";
  isTransferPending: boolean;
  txError: string | null;
  setTxError: (v: string | null) => void;
  handleDeposit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm space-y-1">
        <p>
          <span className="font-mono font-medium">{balance.toFixed(2)}</span> USDC on Arbitrum
        </p>
        <p className="text-hl-muted">
          <span className="font-mono">{ethBalance.toFixed(5)}</span> ETH for gas
          {gasDisplay && <span className="text-xs"> (est. fee: {gasDisplay})</span>}
        </p>
      </div>

      <div>
        <label htmlFor="deposit-amount" className="text-xs text-hl-muted block mb-1">
          Amount to deposit (USDC)
        </label>
        <input
          id="deposit-amount"
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 bg-hl-bg border border-hl-border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-hl-green"
        />
        {amount && !isValidAmount && (
          <p className="text-xs text-hl-red mt-1">
            {parsedAmount < 1 ? "Minimum 1 USDC" : "Exceeds balance"}
          </p>
        )}
      </div>

      {step === "idle" && (
        <button
          type="button"
          onClick={handleDeposit}
          disabled={!isValidAmount}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-hl-green text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Deposit to Hyperliquid
        </button>
      )}

      {step === "transferring" && (
        <div className="flex items-center gap-2 text-sm text-hl-muted">
          <Spinner />
          {isTransferPending
            ? "Confirm transfer in your wallet..."
            : "Waiting for transfer confirmation..."}
        </div>
      )}

      {step === "waiting" && (
        <div className="flex items-center gap-2 text-sm text-hl-green">
          <Spinner />
          Transfer confirmed! Waiting for Hyperliquid to credit your account (~1 min)...
        </div>
      )}

      {txError && (
        <div className="space-y-2">
          <p className="text-sm text-hl-red">Transaction failed: {txError}</p>
          <button
            type="button"
            onClick={() => setTxError(null)}
            className="text-xs text-hl-muted hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <p className="text-xs text-hl-muted">
        Or deposit via{" "}
        <a
          href="https://app.hyperliquid.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="text-hl-green hover:underline"
        >
          app.hyperliquid.xyz
        </a>
      </p>
    </div>
  );
}

function BalanceGuidance({
  balance,
  ethBalance,
  hasEnoughUsdc,
  hasEnoughGas,
  gasDisplay,
  chainId,
  usdcAddress,
}: {
  balance: number;
  ethBalance: number;
  hasEnoughUsdc: boolean;
  hasEnoughGas: boolean;
  gasDisplay: string | null;
  chainId: number;
  usdcAddress: `0x${string}`;
}) {
  const needsUsdc = !hasEnoughUsdc;
  const needsGas = !hasEnoughGas;

  // Matcha gasless swap URL: USDC → ETH on Arbitrum
  const matchaUrl = `https://matcha.xyz/tokens/arbitrum/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee?buyChain=${chainId}&sellAddress=${usdcAddress}`;
  // Uniswap: ETH → USDC on Arbitrum
  const uniswapUrl = `https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=${usdcAddress}`;

  return (
    <div className="space-y-3">
      <div className="bg-hl-bg/50 border border-hl-border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">
          {needsUsdc && needsGas
            ? "You need USDC and ETH (for gas) on Arbitrum"
            : needsGas
              ? "You need ETH on Arbitrum for gas fees"
              : `You need at least ${MIN_DEPOSIT_USDC} USDC on Arbitrum`}
        </p>

        <div className="text-sm text-hl-muted space-y-1">
          <p>
            USDC:{" "}
            <span className={`font-mono ${hasEnoughUsdc ? "text-hl-green" : "text-hl-red"}`}>
              {balance.toFixed(2)}
            </span>
            {!hasEnoughUsdc && ` (need at least ${MIN_DEPOSIT_USDC})`}
          </p>
          <p>
            ETH:{" "}
            <span className={`font-mono ${hasEnoughGas ? "text-hl-green" : "text-hl-red"}`}>
              {ethBalance.toFixed(5)}
            </span>
            {!hasEnoughGas && gasDisplay && ` (need ${gasDisplay} for gas)`}
          </p>
        </div>

        {needsGas && hasEnoughUsdc && (
          <a
            href={matchaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-hl-green/30 bg-hl-green/5 rounded-lg p-3 hover:bg-hl-green/10 transition-colors cursor-pointer"
          >
            <p className="text-sm font-medium text-hl-green">Swap USDC → ETH (gasless) ↗</p>
            <p className="text-xs text-hl-muted mt-1">
              Matcha supports gasless swaps on Arbitrum — swap a small amount of USDC for ETH
              without needing gas to initiate the swap.
            </p>
          </a>
        )}

        {needsUsdc && !needsGas && (
          <a
            href={uniswapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-hl-green/30 bg-hl-green/5 rounded-lg p-3 hover:bg-hl-green/10 transition-colors cursor-pointer"
          >
            <p className="text-sm font-medium text-hl-green">Swap ETH → USDC on Uniswap ↗</p>
            <p className="text-xs text-hl-muted mt-1">
              You have ETH but not enough USDC. Swap on Uniswap to get USDC on Arbitrum.
            </p>
          </a>
        )}

        {needsUsdc && needsGas && (
          <div className="border-t border-hl-border pt-3 space-y-2">
            <p className="text-xs text-hl-muted">
              Buy USDC or ETH on{" "}
              <a
                href="https://coinbase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hl-green hover:underline"
              >
                Coinbase
              </a>
              ,{" "}
              <a
                href="https://binance.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hl-green hover:underline"
              >
                Binance
              </a>
              ,{" "}
              <a
                href="https://kraken.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hl-green hover:underline"
              >
                Kraken
              </a>
              , or another exchange and withdraw to your wallet on Arbitrum.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-hl-muted">
        <Spinner />
        Watching for balance changes...
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
