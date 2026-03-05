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
import { useNetwork } from "@/hooks/useNetwork";

// ERC-20 transfer gas limit (generous estimate)
const TRANSFER_GAS_LIMIT = BigInt(65_000);

export type DepositStep = "idle" | "transferring" | "waiting" | "success";

export function useDeposit(hlBalance?: number) {
  const { address } = useAccount();
  const { network } = useNetwork();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep>("idle");
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

  // Default amount: top up to MIN_DEPOSIT_USDC based on existing HL balance
  useEffect(() => {
    if (balance !== undefined && amount === "") {
      const needed = Math.ceil(MIN_DEPOSIT_USDC - (hlBalance ?? 0));
      setAmount(String(Math.max(needed, 1)));
    }
  }, [balance, amount, hlBalance]);

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
  const isValidAmount = parsedAmount >= 1 && parsedAmount <= (balance ?? 0);

  // Format gas estimate for display
  const gasDisplay =
    estimatedGasEth !== undefined
      ? estimatedGasEth < 0.0001
        ? "<0.0001 ETH"
        : `~${estimatedGasEth.toFixed(4)} ETH`
      : null;

  return {
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
  };
}
