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

interface CompletionStepProps {
  variant?: "step" | "sidebar";
}

export default function CompletionStep({ variant = "step" }: CompletionStepProps) {
  return (
    <div className="space-y-5">
      <div>
        {variant === "step" ? (
          <>
            <h2 className="text-base font-semibold">
              You've completed the builder codes workflow!
            </h2>
            <p className="text-sm text-hl-muted mt-1">
              You walked through the full lifecycle: approving a builder, depositing funds, placing
              orders with builder fees, and revoking approval. Here's what to explore next.
            </p>
          </>
        ) : (
          <h2 className="text-sm font-semibold">Resources</h2>
        )}
      </div>

      <div className={`grid gap-3 ${variant === "step" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {CARDS.map((card) => (
          <a
            key={card.href}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col rounded-xl p-4 transition-colors ${
              variant === "sidebar"
                ? "bg-hl-card border border-hl-border hover:border-hl-green/60"
                : "bg-hl-card border border-hl-green/30 hover:border-hl-green/60"
            }`}
          >
            <h3 className="text-sm font-semibold text-hl-green">{card.title}</h3>
            <p className="text-xs text-hl-muted mt-1">{card.description}</p>
            <span className="inline-block text-xs font-medium text-hl-green mt-auto pt-2">
              {card.linkText} &rarr;
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
