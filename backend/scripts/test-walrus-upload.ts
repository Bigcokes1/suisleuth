import "dotenv/config";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { JsonRpcHTTPTransport, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { WalrusClient } from "@mysten/walrus";

const ADDRESS = "0x83fac461edf64bb55e5738f68a95c7e95f363786337de522cdf100098889ee63";

async function main() {
  const key = process.env.WALRUS_PRIVATE_KEY?.trim();
  if (!key) {
    console.error("WALRUS_PRIVATE_KEY missing from .env");
    process.exit(1);
  }

  const keypair = Ed25519Keypair.fromSecretKey(key);
  const derived = keypair.getPublicKey().toSuiAddress();
  console.log("Keypair address:", derived);
  console.log("Expected address:", ADDRESS);
  console.log("Match:", derived === ADDRESS);

  const rpcUrl =
    process.env.TATUM_SUI_RPC_URL ?? "https://sui-mainnet.gateway.tatum.io";
  const apiKey = process.env.TATUM_API_KEY ?? "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;

  const balancesRes = await fetch(rpcUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getAllBalances",
      params: [ADDRESS],
    }),
  });
  const balances = await balancesRes.json();
  console.log("\nBalances:", JSON.stringify(balances.result, null, 2));

  const suiClient = new SuiJsonRpcClient({
    network: "mainnet",
    transport: new JsonRpcHTTPTransport({
      url: rpcUrl,
      rpc: { headers },
    }),
  });

  const walrusClient = new WalrusClient({
    network: "mainnet",
    suiClient,
    uploadRelay: {
      host: "https://upload-relay.mainnet.walrus.space",
      sendTip: { max: 50_000_000 },
    },
  });

  console.log("\nAttempting Walrus writeBlob test...");
  try {
    const blob = new TextEncoder().encode(
      JSON.stringify({ test: true, at: new Date().toISOString() }),
    );
    const { blobId } = await walrusClient.writeBlob({
      blob,
      deletable: true,
      epochs: 1,
      signer: keypair,
    });
    console.log("SUCCESS blobId:", blobId);
  } catch (err) {
    console.error("FAILED:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) {
      console.error("Stack:", err.stack);
    }
    if (err && typeof err === "object" && "cause" in err) {
      console.error("Cause:", (err as { cause?: unknown }).cause);
    }
  }
}

main();
