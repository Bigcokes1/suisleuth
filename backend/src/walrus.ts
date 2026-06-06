import { JsonRpcHTTPTransport, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { WalrusClient } from "@mysten/walrus";
import type { WalletAnalysis } from "./sui.js";
import { walrusBlobUrl } from "./walrusFetch.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const TATUM_SUI_RPC_URL =
  process.env.TATUM_SUI_RPC_URL ?? "https://sui-mainnet.gateway.tatum.io";
const TATUM_API_KEY = process.env.TATUM_API_KEY ?? "";

export interface WalrusStorageResult {
  blobId: string;
  shareableUrl: string;
  aggregatorUrl: string;
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

  console.log("[Walrus]   TATUM_SUI_RPC_URL:", TATUM_SUI_RPC_URL);
  console.log("[Walrus]   TATUM_API_KEY defined:", Boolean(TATUM_API_KEY));
  console.log("[Walrus]   Sui transport: HTTP JSON-RPC");
  console.log("[Walrus]   FRONTEND_ORIGIN:", FRONTEND_ORIGIN);
}

function createSuiHttpClient(): SuiJsonRpcClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (TATUM_API_KEY) {
    headers["x-api-key"] = TATUM_API_KEY;
  }

  return new SuiJsonRpcClient({
    network: "mainnet",
    transport: new JsonRpcHTTPTransport({
      url: TATUM_SUI_RPC_URL,
      rpc: { headers },
    }),
  });
}

function createWalrusClient(): WalrusClient {
  const suiClient = createSuiHttpClient();

  return new WalrusClient({
    network: "mainnet",
    suiClient,
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

export async function storeAnalysisOnWalrus(
  analysis: WalletAnalysis,
): Promise<WalrusStorageResult | null> {
  try {
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
      `(${blob.byteLength} bytes)`,
    );

    const { blobId } = await walrusClient.writeBlob({
      blob,
      deletable: true,
      epochs: 3,
      signer: keypair,
    });

    console.log("[Walrus] Upload succeeded, blobId:", blobId);

    return {
      blobId,
      shareableUrl: `${FRONTEND_ORIGIN}/report/${blobId}`,
      aggregatorUrl: walrusBlobUrl(blobId),
    };
  } catch (error) {
    logWalrusStorageError(error, analysis.address);
    return null;
  }
}
