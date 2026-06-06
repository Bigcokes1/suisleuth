import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const keypair = Ed25519Keypair.generate();
const secretKey = keypair.getSecretKey();
const address = keypair.getPublicKey().toSuiAddress();

console.log("\n========================================");
console.log("  SuiSleuth Walrus Storage Wallet");
console.log("========================================");
console.log("\nSui Address (fund with SUI + WAL):");
console.log(address);
console.log("\nPrivate Key (WALRUS_PRIVATE_KEY):");
console.log(secretKey);
console.log("\n========================================\n");

const envPath = resolve(process.cwd(), ".env");
let envContent = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

if (/^WALRUS_PRIVATE_KEY=/m.test(envContent)) {
  envContent = envContent.replace(
    /^WALRUS_PRIVATE_KEY=.*$/m,
    `WALRUS_PRIVATE_KEY=${secretKey}`,
  );
} else {
  envContent = envContent.trimEnd();
  envContent += envContent ? "\n" : "";
  envContent += `WALRUS_PRIVATE_KEY=${secretKey}\n`;
}

writeFileSync(envPath, envContent, "utf-8");
console.log(`Saved WALRUS_PRIVATE_KEY to ${envPath}\n`);
