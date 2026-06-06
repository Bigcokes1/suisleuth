/**
 * Tatum MCP-equivalent client for SuiSleuth.
 * Mirrors @tatumio/blockchain-mcp tool calls via Tatum Data API + RPC Gateway.
 *
 * MCP tools used:
 * - get_transaction_history
 * - get_wallet_portfolio
 * - check_malicious_address
 * - gateway_execute_rpc
 */

import { RPC_TIMEOUT_MS, withRpcTimeout } from "./rpcTimeout.js";

const TATUM_API_BASE = process.env.TATUM_API_BASE ?? "https://api.tatum.io";
const TATUM_API_KEY = process.env.TATUM_API_KEY ?? "";
const TATUM_SUI_GATEWAY =
  process.env.TATUM_SUI_RPC_URL ?? "https://sui-mainnet.gateway.tatum.io";
const SUI_FALLBACK_RPC =
  process.env.SUI_RPC_FALLBACK_URL ?? "https://fullnode.mainnet.sui.io:443";

export const SUI_CHAIN = "sui-mainnet";

interface TatumApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status?: number;
}

interface JsonRpcEnvelope<T = unknown> {
  result?: T;
  error?: { message: string; code?: number };
}

export interface MaliciousAddressResult {
  flagged: boolean;
  status: "valid" | "invalid" | "unknown";
  source?: string;
  description?: string;
}

export interface TatumTransactionPage {
  data: unknown[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface TatumPortfolioResult {
  suiBalance: string | null;
  objects: unknown[];
  truncated: boolean;
  source: "data_api" | "gateway_rpc";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tatumDataGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<TatumApiResponse<T>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.set(key, String(value));
    }
  }

  const url = `${TATUM_API_BASE}${path}${query.size ? `?${query}` : ""}`;

  try {
    const response = await withRpcTimeout(
      fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TATUM_API_KEY,
        },
      }),
      `tatum:${path}`,
    );

    const data = (await response.json()) as T;
    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message?: string }).message === "string"
          ? (data as { message: string }).message
          : response.statusText;

      return { error: message, status: response.status };
    }

    return { data, status: response.status };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Tatum Data API request failed",
      status: 0,
    };
  }
}

/** MCP tool: gateway_execute_rpc */
export async function gatewayExecuteRpc<T>(
  method: string,
  params: unknown[] = [],
  retry = 0,
  useFallback = false,
): Promise<T> {
  const gatewayUrl = useFallback ? SUI_FALLBACK_RPC : TATUM_SUI_GATEWAY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!useFallback) {
    headers["x-api-key"] = TATUM_API_KEY;
  }

  const execute = async (): Promise<T> => {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method,
        params,
      }),
    });

    if (response.status === 429 && retry < 4) {
      await sleep(400 * 2 ** retry);
      return gatewayExecuteRpc<T>(method, params, retry + 1, useFallback);
    }

    if (!response.ok) {
      if (!useFallback) {
        return gatewayExecuteRpc<T>(method, params, 0, true);
      }
      throw new Error(`RPC HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = (await response.json()) as JsonRpcEnvelope<T>;
    if (payload.error) {
      throw new Error(`Sui RPC error (${method}): ${payload.error.message}`);
    }

    if (payload.result === undefined) {
      throw new Error(`Sui RPC error (${method}): empty result`);
    }

    return payload.result;
  };

  return withRpcTimeout(execute(), method);
}

/** MCP tool: get_transaction_history (Data API → gateway_execute_rpc fallback on Sui) */
export async function getTransactionHistory(args: {
  address: string;
  sort?: "ASC" | "DESC";
  pageSize?: number;
  offset?: number;
  transactionSubtype?: "incoming" | "outgoing";
}): Promise<TatumApiResponse<{ result?: unknown[]; data?: unknown[] }>> {
  const dataApi = await tatumDataGet<{ result?: unknown[]; data?: unknown[] }>(
    "/v4/data/transactions",
    {
      chain: SUI_CHAIN,
      addresses: args.address,
      pageSize: args.pageSize ?? 50,
      offset: args.offset ?? 0,
      sort: args.sort ?? "DESC",
      transactionSubtype: args.transactionSubtype,
    },
  );

  if (!dataApi.error) {
    return dataApi;
  }

  const filterKey =
    args.transactionSubtype === "incoming" ? "ToAddress" : "FromAddress";
  const descending = (args.sort ?? "DESC") === "DESC";

  const rpcResult = await gatewayExecuteRpc<TatumTransactionPage>(
    "suix_queryTransactionBlocks",
    [
      {
        filter: { [filterKey]: args.address },
        options: {
          showInput: true,
          showEffects: true,
          showBalanceChanges: true,
        },
      },
      null,
      args.pageSize ?? 50,
      descending,
    ],
  );

  return {
    data: { data: rpcResult.data, result: rpcResult.data },
    status: 200,
  };
}

/** MCP tool: get_wallet_portfolio (Data API → gateway_execute_rpc fallback on Sui) */
export async function getWalletPortfolio(
  address: string,
  pageSize = 50,
): Promise<TatumPortfolioResult> {
  const nativePortfolio = await tatumDataGet<{ result?: unknown[] }>(
    "/v4/data/wallet/portfolio",
    {
      chain: SUI_CHAIN,
      addresses: address,
      tokenTypes: "native",
      pageSize,
    },
  );

  if (!nativePortfolio.error && nativePortfolio.data) {
    return {
      suiBalance: null,
      objects: nativePortfolio.data.result ?? [],
      truncated: false,
      source: "data_api",
    };
  }

  const [balanceResult, objectsResult] = await Promise.all([
    gatewayExecuteRpc<{ totalBalance: string }>("suix_getBalance", [address]).catch(
      () => null,
    ),
    gatewayExecuteRpc<TatumTransactionPage>("suix_getOwnedObjects", [
      address,
      { showType: true, showContent: true },
      null,
      pageSize,
    ]).catch(() => ({ data: [], hasNextPage: false, nextCursor: null })),
  ]);

  const suiBalance = balanceResult?.totalBalance
    ? mistToSui(balanceResult.totalBalance)
    : null;

  return {
    suiBalance,
    objects: objectsResult.data ?? [],
    truncated: Boolean(objectsResult.hasNextPage),
    source: "gateway_rpc",
  };
}

/** MCP tool: check_malicious_address */
export async function checkMaliciousAddress(
  address: string,
): Promise<MaliciousAddressResult> {
  const response = await tatumDataGet<{
    status?: string;
    source?: string;
    description?: string;
  }>(`/v3/security/address/${encodeURIComponent(address)}`);

  if (response.error || !response.data) {
    return { flagged: false, status: "unknown" };
  }

  const { status, source, description } = response.data;
  const flagged = status === "invalid";

  return {
    flagged,
    status: flagged ? "invalid" : status === "valid" ? "valid" : "unknown",
    source,
    description,
  };
}

function mistToSui(mist: string): string {
  const value = BigInt(mist);
  const whole = value / 1_000_000_000n;
  const frac = value % 1_000_000_000n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}
