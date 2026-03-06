# Hyperliquid Builder Codes Demo

Interactive Next.js app that walks through the complete [Hyperliquid builder code](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#builder-fee) lifecycle: approve a builder, place orders with builder fees attached, and revoke approval.

Built by [Dwellir](https://dwellir.com) as a reference implementation for teams integrating builder codes.

## What It Does

The app is a guided wizard that walks you through the full builder code lifecycle:

1. **Check Approval Status** -- read-only query to see if your wallet has approved the builder address
2. **Approve Builder Fee** -- sign an EIP-712 message to authorize a max fee rate
3. **Deposit USDC** -- transfer USDC from Arbitrum to Hyperliquid (skipped if you already have a balance)
4. **Activate Agent** -- approve a temporary agent key for order signing (see [Architecture](#architecture) below)
5. **Place Order** -- submit a market or limit order with the builder code attached
6. **Revoke Approval** -- set the max fee to 0% to remove the builder's permission
7. **What's Next** -- links to clone the repo, sign up at Dwellir, and explore docs

The wizard auto-skips completed steps on load. Each step includes live account balance, an L2 orderbook feed, candlestick charts, and human-readable transaction results.

## Getting Started

### Prerequisites

- Node.js 18+
- A browser wallet (MetaMask recommended)
- A [WalletConnect](https://dashboard.reown.com) project ID (free)

### Install

```bash
git clone https://github.com/dwellir-public/hyperliquid-builder-codes-demo.git
cd hyperliquid-builder-codes-demo
npm install
```

### Configure

Copy the example env file and add your WalletConnect project ID:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start on **Testnet** to experiment without risk.

## Architecture

### Agent Wallet (Why It Exists)

Hyperliquid L1 actions (orders, cancels) use EIP-712 typed-data signatures with a domain `chainId` of **1337**. This does not match any real chain, and wallet providers (MetaMask, WalletConnect) reject the signature because the domain chain ID doesn't match the active chain.

The official Hyperliquid app solves this with **agent keys** -- the same approach used here:

1. The app generates a random private key in the browser and stores it in `sessionStorage`
2. You sign an `approveAgent` transaction via your wallet (this uses chainId 42161/421614, which your wallet accepts)
3. All subsequent orders are signed **locally in JavaScript** with the agent key -- no wallet RPC call, no chain-ID validation

The agent key is:
- Scoped to your wallet address
- Stored only in `sessionStorage` (cleared when you close the tab)
- Authorized only for trading actions (cannot withdraw funds)

### Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **wagmi + viem** for wallet connection and typed-data signing
- **RainbowKit** for the connect-wallet UI
- **@nktkas/hyperliquid** SDK for Hyperliquid API interaction
- **lightweight-charts** (TradingView) for candlestick charts
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** with a custom Hyperliquid-inspired dark theme

### Project Structure

```
src/
  app/          -- Next.js pages and layout
  components/   -- UI components (step cards, charts, panels)
  hooks/        -- React hooks (agent wallet, market data, account state)
  lib/          -- Hyperliquid API client and result parser
  config/       -- Constants (builder address, fee defaults) and wagmi config
```

## Configuration

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |

The builder address is configured in `src/config/constants.ts`:

```ts
export const DWELLIR_BUILDER_ADDRESS = "0xE94D5a0a377Afe26a461e8aAC2c7189D2006c8b9";
export const DEFAULT_BUILDER_FEE = 10; // 1 bps = 0.01%
```

Change these to use your own builder address and fee rate.

## Security Notes

- **Agent private keys** are generated in the browser and stored in `sessionStorage`. They are never sent to any server. They are cleared when the browser tab is closed. An XSS vulnerability could expose these keys, so this approach is appropriate for demos and tools but should be hardened (e.g. with CSP headers) for production use.
- **No funds at risk from agent keys.** Agent wallets can only place and cancel orders -- they cannot initiate withdrawals or transfers.
- **This is a demo application.** It is intended as a reference implementation, not a production trading interface. Use at your own risk.

## License

[MIT](./LICENSE)
