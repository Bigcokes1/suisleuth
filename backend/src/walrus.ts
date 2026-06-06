import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { walrus } from "@mysten/walrus";
import type { WalletAnalysis } from "./sui.js";
import { walrusBlobUrl } from "./walrusFetch.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

export interface WalrusStorageResult {
  blobId: string;
  shareableUrl: string;
  aggregatorUrl: string;
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

function createWalrusClient() {
  const baseUrl = process.env.SUI_RPC_URL ?? "https://fullnode.mainnet.sui.io:443";

  return new SuiGrpcClient({
    network: "mainnet",
    baseUrl,
  }).$extend(
    walrus({
      uploadRelay: {
        host: "https://upload-relay.mainnet.walrus.space",
        sendTip: {
          max: 50_000_000,
        },
      },
    }),
  );
}

export async function storeAnalysisOnWalrus(
  analysis: WalletAnalysis,
): Promise<WalrusStorageResult | null> {
  try {
    const client = createWalrusClient();
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

    const { blobId } = await client.walrus.writeBlob({
      blob,
      deletable: true,
      epochs: 3,
      signer: keypair,
    });

    return {
      blobId,
      shareableUrl: `${FRONTEND_ORIGIN}/report/${blobId}`,
      aggregatorUrl: walrusBlobUrl(blobId),
    };
  } catch (error) {
    console.warn(
      "Walrus storage failed (analysis still returned):",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
