import type { ApiError, ApiErrorCode, AnalyzeResponse, ScanStatusResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  INVALID_ADDRESS:
    "That doesn't look like a valid Sui address. Sui addresses start with 0x and are 64 hex characters.",
  NO_TRANSACTIONS:
    "This wallet exists but has no transaction history yet. It may be unfunded.",
  RPC_TIMEOUT: "Tatum RPC is taking too long. Try again in a few seconds.",
  RATE_LIMIT: "Too many requests. Please wait a moment.",
  ANALYSIS_FAILED: "Something went wrong. Please try again.",
};

export function parseApiError(data: ApiError, status: number): string {
  if (data.code && ERROR_MESSAGES[data.code]) {
    return ERROR_MESSAGES[data.code];
  }
  if (status === 429) return ERROR_MESSAGES.RATE_LIMIT;
  if (status === 504) return ERROR_MESSAGES.RPC_TIMEOUT;
  return data.error ?? ERROR_MESSAGES.ANALYSIS_FAILED;
}

export async function analyzeAddress(address: string): Promise<AnalyzeResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address.trim() }),
      signal: controller.signal,
    });

    const data = (await response.json()) as AnalyzeResponse & ApiError;

    if (!response.ok) {
      throw new Error(parseApiError(data, response.status));
    }

    return data as AnalyzeResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(ERROR_MESSAGES.RPC_TIMEOUT);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchScanStatus(scanId: string): Promise<ScanStatusResponse> {
  const response = await fetch(`${API_BASE}/api/status/${scanId}`);
  const data = (await response.json()) as ScanStatusResponse & ApiError;

  if (!response.ok) {
    throw new Error(parseApiError(data, response.status));
  }

  return data;
}

export async function pollWalrusStatus(
  scanId: string,
  onUpdate: (status: ScanStatusResponse) => void,
  maxAttempts = 30,
): Promise<ScanStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await fetchScanStatus(scanId);
    onUpdate(status);

    if (status.status !== "pending") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return fetchScanStatus(scanId);
}

export async function fetchWalrusReport(blobId: string): Promise<AnalyzeResponse["analysis"]> {
  const response = await fetch(`${API_BASE}/api/report/${encodeURIComponent(blobId)}`);
  if (!response.ok) {
    throw new Error("Could not load report from Walrus.");
  }
  const json = (await response.json()) as AnalyzeResponse["analysis"];
  return {
    ...json,
    security: json.security ?? { flagged: false, status: "unknown" as const },
  };
}
