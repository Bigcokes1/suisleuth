export type ApiErrorCode =
  | "INVALID_ADDRESS"
  | "NO_TRANSACTIONS"
  | "RPC_TIMEOUT"
  | "RATE_LIMIT"
  | "ANALYSIS_FAILED";

export interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
}

export function mapAnalysisError(error: unknown): ApiErrorBody & { status: number } {
  const message = error instanceof Error ? error.message : "Failed to analyze wallet";

  if (message.includes("Invalid Sui address")) {
    return {
      status: 400,
      code: "INVALID_ADDRESS",
      error:
        "That doesn't look like a valid Sui address. Sui addresses start with 0x and are 64 hex characters.",
    };
  }

  if (
    message.toLowerCase().includes("rate limit") ||
    message.includes("429") ||
    message.toLowerCase().includes("too many requests")
  ) {
    return {
      status: 429,
      code: "RATE_LIMIT",
      error: "Too many requests. Please wait a moment.",
    };
  }

  if (
    message.toLowerCase().includes("timeout") ||
    message.includes("ETIMEDOUT") ||
    message.toLowerCase().includes("taking too long")
  ) {
    return {
      status: 504,
      code: "RPC_TIMEOUT",
      error: "Tatum RPC is taking too long. Try again in a few seconds.",
    };
  }

  return {
    status: 500,
    code: "ANALYSIS_FAILED",
    error: message,
  };
}

export function noTransactionsError(): ApiErrorBody & { status: number } {
  return {
    status: 404,
    code: "NO_TRANSACTIONS",
    error:
      "This wallet exists but has no transaction history yet. It may be unfunded.",
  };
}
