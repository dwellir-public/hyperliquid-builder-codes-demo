"use client";

import { useEffect, useState } from "react";
import { erc20Abi, formatEther, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useBalance,
  useGasPrice,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { BRIDGE2_ADDRESS, MIN_DEPOSIT_USDC, USDC_ADDRESS } from "@/config/constants";
import { useAccountState } from "@/hooks/useAccountState";
import { useNetwork } from "@/hooks/useNetwork";

// ERC-20 transfer gas limit (generous estimate)
const TRANSFER_GAS_LIMIT = BigInt(65_000);

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

  // USDC balance
  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const balance = rawBalance !== undefined ? Number(formatUnits(rawBalance, 6)) : undefined;
  const hasEnoughUsdc = balance !== undefined && balance >= MIN_DEPOSIT_USDC;

  // ETH balance for gas
  const { data: ethBalanceData } = useBalance({
    address,
    chainId,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const ethBalance = ethBalanceData ? Number(formatEther(ethBalanceData.value)) : undefined;

  // Live gas price
  const { data: gasPrice } = useGasPrice({
    chainId,
    query: { refetchInterval: 15_000 },
  });

  const estimatedGasEth =
    gasPrice !== undefined ? Number(formatEther(gasPrice * TRANSFER_GAS_LIMIT)) : undefined;

  // Add 50% buffer for safety
  const requiredGasEth = estimatedGasEth !== undefined ? estimatedGasEth * 1.5 : undefined;
  const hasEnoughGas =
    ethBalance !== undefined && requiredGasEth !== undefined && ethBalance >= requiredGasEth;

  useEffect(() => {
    if (balance !== undefined && amount === "") {
      setAmount(String(MIN_DEPOSIT_USDC));
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
    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(amount, 6);
    } catch {
      setTxError("Invalid amount");
      return;
    }
    setStep("transferring");
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

  // Format gas estimate for display
  const gasDisplay =
    estimatedGasEth !== undefined
      ? estimatedGasEth < 0.0001
        ? "<0.0001 ETH"
        : `~${estimatedGasEth.toFixed(4)} ETH`
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Deposit USDC</h2>
        <p className="text-sm text-hl-muted mt-1">
          You need USDC on Hyperliquid to place orders. Deposit from your Arbitrum wallet.
        </p>
      </div>

      {balance === undefined || ethBalance === undefined ? (
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
  step: "idle" | "transferring" | "waiting";
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
