import { JsonRpcHTTPTransport, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { WalrusClient } from "@mysten/walrus";
import type { WalletAnalysis } from "./sui.js";
import { walrusBlobUrl } from "./walrusFetch.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const WALRUS_SUI_RPC_URL =
  process.env.SUI_RPC_URL ??
  process.env.SUI_RPC_FALLBACK_URL ??
  "https://fullnode.mainnet.sui.io:443";
const WALRUS_RETRY_DELAYS_MS = [2000, 4000, 8000];
const WALRUS_PRE_UPLOAD_DELAY_MS = 5000;
const WALRUS_UPLOAD_TIMEOUT_MS = 30_000;

class WalrusUploadTimeoutError extends Error {
  constructor() {
    super(`Walrus upload timed out after ${WALRUS_UPLOAD_TIMEOUT_MS / 1000} seconds`);
    this.name = "WalrusUploadTimeoutError";
  }
}

export interface WalrusStorageResult {
  blobId: string;
  shareableUrl: string;
  aggregatorUrl: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withWalrusUploadTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new WalrusUploadTimeoutError()),
      WALRUS_UPLOAD_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("too many requests")
    ) {
      return true;
    }
    if (error.cause !== undefined) {
      return isRateLimitError(error.cause);
    }
  }

  const text = String(error).toLowerCase();
  return (
    text.includes("429") ||
    text.includes("rate limit") ||
    text.includes("too many requests")
  );
}

function logWalrusStorageError(error: unknown, walletAddress: string): void {
  console.error("[Walrus] Blob storage failed for wallet:", walletAddress);

  if (error instanceof Error) {
    console.error("[Walrus] Error message:", error.message);
    console.error("[Walrus] Stack trace:", error.stack ?? "(no stack trace)");
    if (error.cause !== undefined) {
      console.error("[Walrus] Error cause:", error.cause);
    }
    return;
  }

  console.error("[Walrus] Non-Error thrown:", error);
}

export function logWalrusEnvStatus(): void {
  const privateKey = process.env.WALRUS_PRIVATE_KEY?.trim();
  const isDefined = Boolean(privateKey);

  console.log("[Walrus] Startup env check:");
  console.log("[Walrus]   WALRUS_PRIVATE_KEY defined:", isDefined);

  if (privateKey) {
    console.log("[Walrus]   WALRUS_PRIVATE_KEY length:", privateKey.length);
    try {
      const keypair = Ed25519Keypair.fromSecretKey(privateKey);
      console.log(
        "[Walrus]   Storage wallet address:",
        keypair.getPublicKey().toSuiAddress(),
      );
    } catch (error) {
      console.error("[Walrus]   WALRUS_PRIVATE_KEY is set but invalid");
      logWalrusStorageError(error, "(startup key validation)");
    }
  }

  console.log("[Walrus]   SUI RPC (Walrus only):", WALRUS_SUI_RPC_URL);
  console.log("[Walrus]   Sui transport: HTTP JSON-RPC (public fullnode)");
  console.log("[Walrus]   FRONTEND_ORIGIN:", FRONTEND_ORIGIN);
}

function createWalrusSuiClient(): SuiJsonRpcClient {
  return new SuiJsonRpcClient({
    network: "mainnet",
    transport: new JsonRpcHTTPTransport({
      url: WALRUS_SUI_RPC_URL,
      rpc: {
        headers: { "Content-Type": "application/json" },
      },
    }),
  });
}

function createWalrusClient(): WalrusClient {
  return new WalrusClient({
    network: "mainnet",
    suiClient: createWalrusSuiClient(),
    uploadRelay: {
      host: "https://upload-relay.mainnet.walrus.space",
      sendTip: {
        max: 50_000_000,
      },
    },
  });
}

// Requires WALRUS_PRIVATE_KEY in backend/.env — fund that address with SUI + WAL.
function getStorageKeypair(): Ed25519Keypair {
  const privateKey = process.env.WALRUS_PRIVATE_KEY?.trim();

  if (!privateKey) {
    throw new Error(
      "WALRUS_PRIVATE_KEY is not set. Run: npx tsx scripts/generate-walrus-key.ts — then fund the printed Sui address with SUI and WAL tokens.",
    );
  }

  try {
    return Ed25519Keypair.fromSecretKey(privateKey);
  } catch {
    throw new Error(
      "WALRUS_PRIVATE_KEY is invalid. Re-run: npx tsx scripts/generate-walrus-key.ts",
    );
  }
}

async function writeBlobWithRetry(
  walrusClient: WalrusClient,
  blob: Uint8Array,
  signer: Ed25519Keypair,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= WALRUS_RETRY_DELAYS_MS.length; attempt += 1) {
    console.log(
      `[Walrus] Waiting ${WALRUS_PRE_UPLOAD_DELAY_MS}ms before upload attempt ${attempt + 1}/${WALRUS_RETRY_DELAYS_MS.length + 1}...`,
    );
    await sleep(WALRUS_PRE_UPLOAD_DELAY_MS);

    try {
      const { blobId } = await walrusClient.writeBlob({
        blob,
        deletable: true,
        epochs: 3,
        signer,
      });
      return blobId;
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= WALRUS_RETRY_DELAYS_MS.length;

      if (!isRateLimitError(error) || isLastAttempt) {
        throw error;
      }

      const delayMs = WALRUS_RETRY_DELAYS_MS[attempt];
      console.warn(
        `[Walrus] HTTP 429 rate limit (attempt ${attempt + 1}/${WALRUS_RETRY_DELAYS_MS.length + 1}), retrying in ${delayMs}ms...`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

export async function storeAnalysisOnWalrus(
  analysis: WalletAnalysis,
): Promise<WalrusStorageResult | null> {
  try {
    return await withWalrusUploadTimeout(performWalrusUpload(analysis));
  } catch (error) {
    if (error instanceof WalrusUploadTimeoutError) {
      console.warn(
        "[Walrus] Upload aborted — exceeded 30s timeout for wallet:",
        analysis.address,
      );
      return null;
    }

    logWalrusStorageError(error, analysis.address);
    return null;
  }
}

async function performWalrusUpload(
  analysis: WalletAnalysis,
): Promise<WalrusStorageResult> {
  const walrusClient = createWalrusClient();
  const keypair = getStorageKeypair();
  const payload = JSON.stringify(
    {
      app: "SuiSleuth",
      version: 1,
      ...analysis,
    },
    null,
    2,
  );
  const blob = new TextEncoder().encode(payload);

  console.log(
    "[Walrus] Uploading blob for wallet:",
    analysis.address,
    `(${blob.byteLength} bytes) via ${WALRUS_SUI_RPC_URL}`,
  );

  const blobId = await writeBlobWithRetry(walrusClient, blob, keypair);

  console.log("[Walrus] Upload succeeded, blobId:", blobId);

  return {
    blobId,
    shareableUrl: `${FRONTEND_ORIGIN}/report/${blobId}`,
    aggregatorUrl: walrusBlobUrl(blobId),
  };
}
