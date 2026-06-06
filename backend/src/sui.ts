import {
  checkMaliciousAddress,
  gatewayExecuteRpc,
} from "./tatum.js";
import { RpcTimeoutError, withRpcTimeout } from "./rpcTimeout.js";

const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{1,64}$/;
const TX_SAMPLE_SIZE = 5;
const OWNED_OBJECTS_LIMIT = 50;

const TX_OPTIONS_LIGHT = {
  showInput: false,
  showEffects: false,
  showBalanceChanges: false,
};

const TX_OPTIONS_FULL = {
  showInput: true,
  showEffects: true,
  showBalanceChanges: true,
};

const EMPTY_TX_PAGE: TxQueryPage = {
  data: [],
  nextCursor: null,
  hasNextPage: false,
};

export interface BalanceChange {
  owner?: { AddressOwner?: string };
  coinType?: string;
  amount?: string;
}

export interface TransactionBlock {
  digest?: string;
  timestampMs?: string;
  balanceChanges?: BalanceChange[];
  transaction?: {
    data?: {
      sender?: string;
    };
  };
}

export interface OwnedObject {
  data?: {
    type?: string;
    content?: {
      fields?: {
        balance?: string;
      };
    };
  };
}

export interface WalletSecurity {
  flagged: boolean;
  status: "valid" | "invalid" | "unknown";
  source?: string;
  description?: string;
}

export interface WalletAnalysis {
  address: string;
  walletAge: {
    firstTransactionDate: string | null;
    daysOld: number | null;
  };
  transactionCount: number;
  transactionCountNote: string | null;
  firstActivity: {
    digest: string;
    timestamp: string | null;
    sender: string | null;
  } | null;
  fundingSource: {
    address: string | null;
    amountSui: string | null;
    transactionDigest: string | null;
  } | null;
  holdings: {
    totalObjects: number;
    coins: number;
    nfts: number;
    other: number;
    suiBalance: string | null;
  };
  security: WalletSecurity;
  ogScore: OGScore;
  analyzedAt: string;
  partialResults?: string[];
}

export interface OGScore {
  score: number;
  label: string;
  emoji: string;
  breakdown: {
    agePoints: number;
    txPoints: number;
    earlyAdopterPoints: number;
  };
}

interface TxQueryPage {
  data: TransactionBlock[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

interface OwnedObjectsPage {
  data: OwnedObject[];
  hasNextPage: boolean;
  nextCursor: string | null;
}

export function isValidSuiAddress(address: string): boolean {
  return SUI_ADDRESS_REGEX.test(address);
}

export function normalizeSuiAddress(address: string): string {
  const hex = address.slice(2);
  return `0x${hex.padStart(64, "0")}`;
}

type TxFilterKind = "FromAddress" | "ToAddress";

async function queryTransactionPage(
  address: string,
  filterKind: TxFilterKind,
  cursor: string | null,
  limit: number,
  descending: boolean,
  options: typeof TX_OPTIONS_LIGHT | typeof TX_OPTIONS_FULL,
): Promise<TxQueryPage> {
  return withRpcTimeout(
    gatewayExecuteRpc<TxQueryPage>("suix_queryTransactionBlocks", [
      {
        filter: { [filterKind]: address },
        options,
      },
      cursor,
      limit,
      descending,
    ]),
    "suix_queryTransactionBlocks",
    EMPTY_TX_PAGE,
  );
}

async function safeQueryTransactionPage(
  address: string,
  filterKind: TxFilterKind,
  limit: number,
  descending: boolean,
  options: typeof TX_OPTIONS_LIGHT | typeof TX_OPTIONS_FULL,
): Promise<{ page: TxQueryPage; timedOut: boolean }> {
  try {
    const page = await queryTransactionPage(
      address,
      filterKind,
      null,
      limit,
      descending,
      options,
    );
    return { page, timedOut: false };
  } catch (error) {
    if (error instanceof RpcTimeoutError) {
      return { page: EMPTY_TX_PAGE, timedOut: true };
    }
    return { page: EMPTY_TX_PAGE, timedOut: false };
  }
}

async function safeCheckMaliciousAddress(
  address: string,
): Promise<{ security: WalletSecurity; timedOut: boolean }> {
  try {
    const security = await withRpcTimeout(
      checkMaliciousAddress(address),
      "check_malicious_address",
      { flagged: false, status: "unknown" },
    );
    return { security, timedOut: false };
  } catch (error) {
    if (error instanceof RpcTimeoutError) {
      return {
        security: { flagged: false, status: "unknown" },
        timedOut: true,
      };
    }
    return {
      security: { flagged: false, status: "unknown" },
      timedOut: false,
    };
  }
}

async function safeGetBalance(
  address: string,
): Promise<{ suiBalance: string | null; timedOut: boolean }> {
  try {
    const result = await withRpcTimeout(
      gatewayExecuteRpc<{ totalBalance: string }>("suix_getBalance", [address]),
      "suix_getBalance",
    );
    return {
      suiBalance: result?.totalBalance ? mistToSui(result.totalBalance) : null,
      timedOut: false,
    };
  } catch (error) {
    if (error instanceof RpcTimeoutError) {
      return { suiBalance: null, timedOut: true };
    }
    return { suiBalance: null, timedOut: false };
  }
}

async function safeGetOwnedObjects(
  address: string,
): Promise<{ objects: OwnedObject[]; truncated: boolean; timedOut: boolean }> {
  try {
    const result = await withRpcTimeout(
      gatewayExecuteRpc<OwnedObjectsPage>("suix_getOwnedObjects", [
        address,
        { showType: true, showContent: true },
        null,
        OWNED_OBJECTS_LIMIT,
      ]),
      "suix_getOwnedObjects",
      { data: [], hasNextPage: false, nextCursor: null },
    );
    return {
      objects: result.data ?? [],
      truncated: Boolean(result.hasNextPage),
      timedOut: false,
    };
  } catch (error) {
    if (error instanceof RpcTimeoutError) {
      return { objects: [], truncated: false, timedOut: true };
    }
    return { objects: [], truncated: false, timedOut: false };
  }
}

function pickEarliestBlock(
  blocks: TransactionBlock[],
): TransactionBlock | null {
  if (blocks.length === 0) return null;

  return [...blocks].sort(
    (a, b) => Number(a.timestampMs ?? 0) - Number(b.timestampMs ?? 0),
  )[0];
}

function estimateTransactionCount(
  fromRecent: TxQueryPage,
  toRecent: TxQueryPage,
): { count: number; note: string | null } {
  const fromCount = fromRecent.data.length;
  const toCount = toRecent.data.length;
  const truncated = fromRecent.hasNextPage || toRecent.hasNextPage;

  if (!truncated) {
    return { count: fromCount + toCount, note: null };
  }

  const minimum = fromCount + toCount;
  const parts: string[] = [];
  if (fromRecent.hasNextPage) parts.push(`sent ≥${fromCount}`);
  if (toRecent.hasNextPage) parts.push(`received ≥${toCount}`);

  return {
    count: minimum,
    note: `TX count sampled (last ${TX_SAMPLE_SIZE} per direction): ${parts.join(", ")}`,
  };
}

function normalizeAddress(addr: string): string {
  return addr.toLowerCase();
}

function isSuiCoinType(coinType: string | undefined): boolean {
  if (!coinType) return false;
  return coinType.includes("0x2::sui::SUI") || coinType.endsWith("::sui::SUI");
}

function mistToSui(mist: string | number): string {
  const value = typeof mist === "string" ? BigInt(mist) : BigInt(mist);
  const whole = value / 1_000_000_000n;
  const frac = value % 1_000_000_000n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

function summarizeHoldings(
  objects: OwnedObject[],
  suiBalance: string | null,
  truncated: boolean,
): WalletAnalysis["holdings"] {
  let coins = 0;
  let nfts = 0;
  let other = 0;

  for (const obj of objects) {
    const type = obj.data?.type ?? "";
    if (type.includes("0x2::coin::Coin")) {
      coins += 1;
      if (isSuiCoinType(type) && !suiBalance) {
        const balance = obj.data?.content?.fields?.balance;
        if (balance) {
          suiBalance = mistToSui(balance);
        }
      }
    } else if (
      type.includes("0x2::package::UpgradeCap") ||
      type.includes("0x2::display::Display")
    ) {
      other += 1;
    } else if (type.includes("::") && !type.startsWith("0x2::")) {
      nfts += 1;
    } else {
      other += 1;
    }
  }

  return {
    totalObjects: objects.length,
    coins,
    nfts,
    other,
    suiBalance,
  };
}

function findFundingSource(
  address: string,
  earliestBlock: TransactionBlock | undefined,
): WalletAnalysis["fundingSource"] {
  if (!earliestBlock?.digest) return null;

  const normalized = normalizeAddress(address);
  const changes = earliestBlock.balanceChanges ?? [];

  const received = changes.find((change) => {
    const owner = change.owner?.AddressOwner;
    if (!owner || normalizeAddress(owner) !== normalized) return false;
    if (!isSuiCoinType(change.coinType)) return false;
    const amount = BigInt(change.amount ?? "0");
    return amount > 0n;
  });

  if (!received) {
    return {
      address: earliestBlock.transaction?.data?.sender ?? null,
      amountSui: null,
      transactionDigest: earliestBlock.digest,
    };
  }

  const sender = changes.find((change) => {
    const owner = change.owner?.AddressOwner;
    if (!owner || normalizeAddress(owner) === normalized) return false;
    if (!isSuiCoinType(change.coinType)) return false;
    const amount = BigInt(change.amount ?? "0");
    return amount < 0n;
  });

  return {
    address:
      sender?.owner?.AddressOwner ??
      earliestBlock.transaction?.data?.sender ??
      null,
    amountSui: received.amount ? mistToSui(received.amount) : null,
    transactionDigest: earliestBlock.digest,
  };
}

export function calculateOGScore(
  firstTransactionDate: Date | null,
  transactionCount: number,
): OGScore {
  const now = new Date();
  let agePoints = 5;
  let txPoints = 2;
  let earlyAdopterPoints = 0;

  if (firstTransactionDate) {
    const ageMs = now.getTime() - firstTransactionDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const ageYears = ageDays / 365.25;

    if (ageYears >= 3) agePoints = 40;
    else if (ageYears >= 2) agePoints = 30;
    else if (ageYears >= 1) agePoints = 20;
    else if (ageDays >= 180) agePoints = 10;
    else agePoints = 5;

    if (firstTransactionDate < new Date("2023-01-01T00:00:00.000Z")) {
      earlyAdopterPoints = 30;
    }
  }

  if (transactionCount >= 1000) txPoints = 30;
  else if (transactionCount >= 500) txPoints = 20;
  else if (transactionCount >= 100) txPoints = 10;
  else if (transactionCount >= 10) txPoints = 5;
  else txPoints = 2;

  const score = Math.min(100, agePoints + txPoints + earlyAdopterPoints);

  let label = "Newcomer";
  let emoji = "🌱";
  if (score >= 80) {
    label = "OG Whale";
    emoji = "🏆";
  } else if (score >= 60) {
    label = "Diamond Hands";
    emoji = "💎";
  } else if (score >= 40) {
    label = "Degen Veteran";
    emoji = "🔥";
  } else if (score >= 20) {
    label = "Early Mover";
    emoji = "📈";
  }

  return {
    score,
    label,
    emoji,
    breakdown: { agePoints, txPoints, earlyAdopterPoints },
  };
}

export async function analyzeWallet(address: string): Promise<WalletAnalysis> {
  if (!isValidSuiAddress(address)) {
    throw new Error(
      "Invalid Sui address. Expected 0x followed by up to 64 hex characters.",
    );
  }

  const normalizedAddress = normalizeSuiAddress(address);
  const partialResults: string[] = [];

  const [
    fromEarliestResult,
    toEarliestResult,
    fromRecentResult,
    toRecentResult,
    securityResult,
    balanceResult,
    ownedResult,
  ] = await Promise.all([
    safeQueryTransactionPage(
      normalizedAddress,
      "FromAddress",
      1,
      false,
      TX_OPTIONS_FULL,
    ),
    safeQueryTransactionPage(
      normalizedAddress,
      "ToAddress",
      1,
      false,
      TX_OPTIONS_FULL,
    ),
    safeQueryTransactionPage(
      normalizedAddress,
      "FromAddress",
      TX_SAMPLE_SIZE,
      true,
      TX_OPTIONS_LIGHT,
    ),
    safeQueryTransactionPage(
      normalizedAddress,
      "ToAddress",
      TX_SAMPLE_SIZE,
      true,
      TX_OPTIONS_LIGHT,
    ),
    safeCheckMaliciousAddress(normalizedAddress),
    safeGetBalance(normalizedAddress),
    safeGetOwnedObjects(normalizedAddress),
  ]);

  if (fromEarliestResult.timedOut || toEarliestResult.timedOut) {
    partialResults.push("Wallet age lookup timed out");
  }
  if (fromRecentResult.timedOut || toRecentResult.timedOut) {
    partialResults.push("Transaction activity lookup timed out");
  }
  if (securityResult.timedOut) {
    partialResults.push("Security check timed out");
  }
  if (balanceResult.timedOut) {
    partialResults.push("SUI balance lookup timed out");
  }
  if (ownedResult.timedOut) {
    partialResults.push("Owned objects lookup timed out");
  }

  const earliestBlock = pickEarliestBlock([
    ...(fromEarliestResult.page.data ?? []),
    ...(toEarliestResult.page.data ?? []),
  ]);

  const { count: transactionCount, note: txNote } = estimateTransactionCount(
    fromRecentResult.page,
    toRecentResult.page,
  );

  const notes: string[] = [];
  if (txNote) notes.push(txNote);
  if (ownedResult.truncated) {
    notes.push(`Holdings sampled at ${OWNED_OBJECTS_LIMIT}+ objects`);
  }

  const firstTimestampMs = earliestBlock?.timestampMs
    ? Number(earliestBlock.timestampMs)
    : null;
  const firstTransactionDate =
    firstTimestampMs && !Number.isNaN(firstTimestampMs)
      ? new Date(firstTimestampMs)
      : null;

  const holdings = summarizeHoldings(
    ownedResult.objects,
    balanceResult.suiBalance,
    ownedResult.truncated,
  );
  const fundingSource = findFundingSource(
    normalizedAddress,
    earliestBlock ?? undefined,
  );
  const ogScore = calculateOGScore(firstTransactionDate, transactionCount);

  return {
    address: normalizedAddress,
    walletAge: {
      firstTransactionDate: firstTransactionDate?.toISOString() ?? null,
      daysOld: firstTransactionDate
        ? Math.floor(
            (Date.now() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24),
          )
        : null,
    },
    transactionCount,
    transactionCountNote: notes.length > 0 ? notes.join(" · ") : null,
    firstActivity: earliestBlock?.digest
      ? {
          digest: earliestBlock.digest,
          timestamp: firstTransactionDate?.toISOString() ?? null,
          sender: earliestBlock.transaction?.data?.sender ?? null,
        }
      : null,
    fundingSource,
    holdings,
    security: {
      flagged: securityResult.security.flagged,
      status: securityResult.security.status,
      source: securityResult.security.source,
      description: securityResult.security.description,
    },
    ogScore,
    analyzedAt: new Date().toISOString(),
    partialResults: partialResults.length > 0 ? partialResults : undefined,
  };
}
