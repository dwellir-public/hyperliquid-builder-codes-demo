export type ResultContext = "order" | "approve" | "revoke" | "cancel";

export interface ParsedResult {
  icon: "success" | "error" | "info";
  message: string;
}

export function parseHLResult(
  result: unknown,
  context: ResultContext
): ParsedResult {
  if (result == null) {
    return { icon: "info", message: "No response received." };
  }

  try {
    if (context === "approve") {
      return { icon: "success", message: "Builder fee approved." };
    }

    if (context === "revoke") {
      return { icon: "success", message: "Builder approval revoked." };
    }

    if (context === "cancel") {
      return { icon: "success", message: "Order cancelled." };
    }

    // Order context — parse the Hyperliquid order response
    if (context === "order") {
      return parseOrderResult(result);
    }

    return { icon: "info", message: "Action completed." };
  } catch {
    return { icon: "info", message: "Action completed." };
  }
}

function parseOrderResult(result: unknown): ParsedResult {
  // Hyperliquid order response shape:
  // { status: "ok", response: { type: "order", data: { statuses: [...] } } }
  const r = result as Record<string, unknown>;

  if (r.status === "err") {
    return { icon: "error", message: `Error: ${String(r.response ?? r)}` };
  }

  const response = r.response as Record<string, unknown> | undefined;
  if (!response) {
    return { icon: "success", message: "Order submitted." };
  }

  const data = response.data as Record<string, unknown> | undefined;
  if (!data) {
    return { icon: "success", message: "Order submitted." };
  }

  const statuses = data.statuses as Array<Record<string, unknown>> | undefined;
  if (!statuses || statuses.length === 0) {
    return { icon: "success", message: "Order submitted." };
  }

  const s = statuses[0];

  // Resting order: { resting: { oid: 123456 } }
  if (s.resting) {
    const resting = s.resting as Record<string, unknown>;
    return {
      icon: "success",
      message: `Order resting on book (ID: ${resting.oid})`,
    };
  }

  // Filled order: { filled: { totalSz: "0.01", avgPx: "3241.5", oid: 123 } }
  if (s.filled) {
    const filled = s.filled as Record<string, unknown>;
    const sz = filled.totalSz ?? filled.sz;
    const px = filled.avgPx ?? filled.px;
    return {
      icon: "success",
      message: `Filled ${sz} at $${Number(px).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }

  // Error status
  if (s.error) {
    return { icon: "error", message: `Error: ${String(s.error)}` };
  }

  return { icon: "success", message: "Order submitted." };
}
