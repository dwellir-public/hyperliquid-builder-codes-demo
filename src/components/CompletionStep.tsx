const CARDS = [
  {
    title: "Build your own",
    description: "Clone this repo as a starting point for your own builder codes integration.",
    linkText: "View on GitHub",
    href: "https://github.com/dwellir-public/hyperliquid-builder-codes-demo",
  },
  {
    title: "Dwellir endpoints",
    description: "Sign up for dedicated Hyperliquid API access — RPC, WebSocket, and gRPC.",
    linkText: "Create account",
    href: "https://dashboard.dwellir.com/register",
  },
  {
    title: "Dwellir CLI + HL skill",
    description: "Install the Dwellir CLI and Hyperliquid agent skill for AI-assisted development.",
    linkText: "Get started",
    href: "https://dwellir.com/agents",
  },
  {
    title: "Documentation",
    description: "Read the full Hyperliquid integration guide — endpoints, trading, and more.",
    linkText: "Read docs",
    href: "https://dwellir.com/docs/hyperliquid",
  },
];

export default function CompletionStep() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">You've completed the builder codes workflow!</h2>
        <p className="text-sm text-hl-muted mt-1">
          You walked through the full lifecycle: approving a builder, depositing funds, placing
          orders with builder fees, and revoking approval. Here's what to explore next.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <a
            key={card.href}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-hl-card border border-hl-green/30 rounded-xl p-4 space-y-2 hover:border-hl-green/60 transition-colors"
          >
            <h3 className="text-sm font-semibold text-hl-green">{card.title}</h3>
            <p className="text-xs text-hl-muted">{card.description}</p>
            <span className="inline-block text-xs font-medium text-hl-green">
              {card.linkText} &rarr;
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
