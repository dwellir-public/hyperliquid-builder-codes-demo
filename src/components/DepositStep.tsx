"use client";

import { useEffect, useState } from "react";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { BRIDGE2_ADDRESS, MIN_DEPOSIT_USDC, USDC_ADDRESS } from "@/config/constants";
import { useAccountState } from "@/hooks/useAccountState";
import { useNetwork } from "@/hooks/useNetwork";

interface DepositStepProps {
  onComplete: () => void;
}

export default function DepositStep({ onComplete }: DepositStepProps) {
  const { address } = useAccount();
  const { network } = useNetwork();
  const { data: account } = useAccountState();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"idle" | "transferring" | "waiting">("idle");
  const [txError, setTxError] = useState<string | null>(null);

  const usdcAddress = USDC_ADDRESS[network];
  const bridgeAddress = BRIDGE2_ADDRESS[network];
  const chainId = network === "mainnet" ? 42161 : 421614;

  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const balance = rawBalance !== undefined ? Number(formatUnits(rawBalance, 6)) : undefined;
  const hasEnough = balance !== undefined && balance >= MIN_DEPOSIT_USDC;

  useEffect(() => {
    if (balance !== undefined && amount === "") {
      const truncated = Math.floor(balance * 100) / 100;
      setAmount(truncated.toFixed(2));
    }
  }, [balance, amount]);

  // Auto-complete when HL balance appears
  useEffect(() => {
    if (account && account.balance > 0) {
      onComplete();
    }
  }, [account, onComplete]);

  // Transfer to Bridge2 (direct ERC-20 transfer, no approve needed)
  const {
    writeContract: transferUsdc,
    data: transferTxHash,
    isPending: isTransferPending,
    error: transferError,
  } = useWriteContract();

  const { isSuccess: isTransferConfirmed } = useWaitForTransactionReceipt({
    hash: transferTxHash,
  });

  // Handle transfer error — reset to idle
  useEffect(() => {
    if (transferError && step === "transferring") {
      setStep("idle");
      setTxError(transferError.message);
    }
  }, [transferError, step]);

  // Transfer confirmed → waiting for HL credit
  useEffect(() => {
    if (isTransferConfirmed && step === "transferring") {
      setStep("waiting");
      setTxError(null);
      refetchBalance();
    }
  }, [isTransferConfirmed, step, refetchBalance]);

  const handleDeposit = () => {
    setTxError(null);
    setStep("transferring");
    const parsedAmount = parseUnits(amount, 6);
    transferUsdc({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [bridgeAddress, parsedAmount],
      chainId,
    });
  };

  const parsedAmount = amount ? Number(amount) : 0;
  const isValidAmount = parsedAmount >= MIN_DEPOSIT_USDC && parsedAmount <= (balance ?? 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Deposit USDC</h2>
        <p className="text-sm text-hl-muted mt-1">
          You need USDC on Hyperliquid to place orders. Deposit from your Arbitrum wallet.
        </p>
      </div>

      {balance === undefined ? (
        <p className="text-sm text-hl-muted">Checking Arbitrum USDC balance...</p>
      ) : hasEnough ? (
        <div className="space-y-3">
          <p className="text-sm">
            You have <span className="font-mono font-medium">{balance.toFixed(2)}</span> USDC on
            Arbitrum
          </p>

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
                {parsedAmount < MIN_DEPOSIT_USDC
                  ? `Minimum ${MIN_DEPOSIT_USDC} USDC`
                  : "Exceeds balance"}
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
      ) : (
        <div className="space-y-3">
          <div className="bg-hl-bg/50 border border-hl-border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">
              You need at least {MIN_DEPOSIT_USDC} USDC on Arbitrum to deposit
            </p>
            <p className="text-sm text-hl-muted">
              {balance > 0
                ? `Current balance: ${balance.toFixed(2)} USDC`
                : "No USDC found on Arbitrum"}
            </p>
            <p className="text-sm text-hl-muted">
              Buy USDC on Coinbase, Binance, Kraken, or another exchange and withdraw to your wallet
              on Arbitrum.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-hl-muted">
            <Spinner />
            Checking for USDC balance...
          </div>
        </div>
      )}
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
