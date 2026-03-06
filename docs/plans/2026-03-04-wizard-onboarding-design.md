# Wizard Onboarding Flow Design

## Problem

All six builder-code steps are displayed as a flat list. Users see everything at once, with no guidance on order. When a user has no Hyperliquid deposit, they hit a confusing "Must deposit before performing actions" error with no recovery path.

## Solution

Replace the flat list with a step-by-step wizard that guides users through the builder code lifecycle. Proactively detect missing deposits and branch into a deposit sub-flow.

## Step Flow

| # | ID | Label | Condition |
|---|-----|-------|-----------|
| 1 | `deposit` | Deposit USDC | Only shown if Hyperliquid balance = 0 |
| 2 | `check-approval` | Check Approval | Always |
| 3 | `approve-builder` | Approve Builder | Always |
| 4 | `activate-agent` | Activate Agent | Always |
| 5 | `place-order` | Place Order | Always |
| 6 | `revoke` | Revoke Approval | Always |

## Wizard Shell

### `useWizard` Hook

A `useReducer`-based hook managing:

- `steps`: ordered array of `{ id, label }` — deposit step conditionally prepended
- `currentStep`: index into the steps array
- `completedSteps`: `Set<string>` of completed step IDs

Actions:

- `COMPLETE_STEP` — marks current step done, advances to next
- `GO_TO_STEP` — navigate to any completed step (click in stepper bar)
- `INSERT_DEPOSIT_STEP` — prepend deposit step when balance = 0
- `REMOVE_DEPOSIT_STEP` — remove deposit step if balance appears before completion

### `WizardStepper` Component

Horizontal progress bar at the top of the page. Each step rendered as a numbered circle. Completed steps show a checkmark and are clickable. Current step is highlighted. Future steps are dimmed.

### `WizardShell` Component

Layout wrapper: stepper bar on top, active step's component rendered below. Only one step visible at a time.

## Deposit Step

On entry, check the connected wallet's USDC balance on Arbitrum via `useReadContract` (wagmi public RPC, no API key needed):

```ts
useReadContract({
  address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC on Arbitrum
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [userAddress],
  chainId: 42161,
})
```

### Branch A: Has >= 5 USDC on Arbitrum

- Show balance: "You have X USDC on Arbitrum"
- Amount input (default: full balance, min 5 USDC)
- "Deposit to Hyperliquid" button triggers USDC `approve` + `transfer` to Bridge2 (`0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7`)
- Progress indicator while waiting for Hyperliquid L1 to credit (polls `clearinghouseState`)
- Fallback link: "Or deposit via app.hyperliquid.xyz"

### Branch B: Has < 5 USDC on Arbitrum

- "You need at least 5 USDC on Arbitrum to deposit to Hyperliquid"
- Guidance: "Buy USDC on Coinbase, Binance, Kraken, or another exchange and withdraw to your wallet on Arbitrum"
- Polls Arbitrum USDC balance — auto-transitions to Branch A when balance appears

### Auto-completion

Step auto-completes when `useAccountState` detects Hyperliquid balance > 0. Wizard advances to next step.

## Approve Builder Step

- Remove the free-form fee input
- Show the configured fee as read-only: "Builder fee: 0.01%"
- Info icon with tooltip: "The minimum fee for this builder is 0.01% (1 bps). Orders below this will be rejected."
- Single "Approve" button using `DEFAULT_BUILDER_FEE`

## Place Order Step (Consolidated)

Merge the separate limit and market order components into one step.

- Tab selector: **Market** (default) | **Limit**
- Market tab: coin selector, buy/sell side, size input
- Limit tab: coin selector, buy/sell side, size input, price input
- Banner when Limit tab selected: "Limit orders may not fill immediately. Market order is recommended for testing."
- Builder fee automatically attached to all orders

## Unchanged Steps

- **Check Approval**: same functionality, rendered inside wizard shell
- **Activate Agent**: same functionality, rendered inside wizard shell
- **Revoke Approval**: same functionality, rendered inside wizard shell

All step components receive an `onComplete` callback prop.

## Component Changes

### Create

- `WizardStepper` — horizontal step progress bar
- `WizardShell` — layout wrapper (stepper + active step)
- `useWizard` — reducer hook for step state
- `DepositStep` — deposit flow with Arbitrum balance check
- `PlaceOrderStep` — consolidated market/limit order with tabs

### Modify

- `ApproveBuilder` — remove fee input, add read-only fee display with info tooltip
- `page.tsx` — replace flat step list with `WizardShell`
- All step components — add `onComplete` callback prop

### Remove

- `StepCard` — replaced by wizard shell rendering
- `MarketOrder` — merged into `PlaceOrderStep`

## Key Constants

| Constant | Value |
|----------|-------|
| Bridge2 (mainnet) | `0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7` |
| Bridge2 (testnet) | `0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89` |
| USDC (Arbitrum mainnet) | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| USDC (Arbitrum Sepolia) | `0x1baAbB04529D43a73232B713C0FE471f7c7334d5` |
| Minimum deposit | 5 USDC |
| Deposit confirmation | ~1 minute |
