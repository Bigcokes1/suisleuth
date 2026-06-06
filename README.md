# SuiSleuth — Sui Wallet Intelligence

A wallet intelligence tool for the Sui blockchain. Paste any Sui address and instantly get wallet age, funding source, transaction history, object holdings, and an OG Score — with every result permanently stored on Walrus decentralized storage.

🔗 Live Demo: [add Netlify URL]

---

## Features

- Real-time wallet analysis via Tatum's Sui Mainnet RPC
- Tatum MCP server integration for AI-native blockchain queries
- OG Score (0–100) with badge tiers
- Wallet DNA radar chart (age, activity, diversity, OG status, consistency)
- Funding source trace
- Compare any two wallets head-to-head
- Permanent on-chain report pages powered by Walrus
- Recent lookups feed showing live Walrus activity
- One-click X share with pre-filled tweet
- Malicious address detection via Tatum MCP

## Pages

- `/` — Home, search, recent lookups, how it works
- `/report/:blobId` — Permanent wallet report fetched from Walrus
- `/compare/:blobId1/:blobId2` — Side-by-side wallet comparison

---

## How It Works

1. User enters a Sui wallet address
2. Backend queries Sui Mainnet via Tatum RPC (`suix_queryTransactionBlocks`, `suix_getOwnedObjects`, `sui_multiGetTransactionBlocks`)
3. Analysis is computed (wallet age, TX count, OG Score, funding source)
4. Result is serialized as JSON and stored on Walrus Mainnet via the TypeScript SDK
5. Frontend displays the full report + a permanent Walrus shareable link

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **RPC:** Tatum Sui Mainnet Gateway
- **Storage:** Walrus Decentralized Storage (TypeScript SDK)
- **Deploy:** Netlify (frontend) + Railway or Render (backend)

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Tatum API key (get one free at [dashboard.tatum.io](https://dashboard.tatum.io))
- A Sui wallet funded with WAL tokens for Mainnet blob storage

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/suisleuth
cd suisleuth

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Environment Variables

Create a `.env` file in the `/backend` directory:

```env
TATUM_API_KEY=your_tatum_api_key
TATUM_SUI_RPC_URL=https://sui-mainnet.gateway.tatum.io
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
SUI_RPC_FALLBACK_URL=https://fullnode.mainnet.sui.io:443
WALRUS_PRIVATE_KEY=your_sui_wallet_private_key
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
```

Create a `.env` file in the `/frontend` directory:

```env
VITE_API_URL=http://localhost:3001
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TATUM_API_KEY` | Yes (prod) | — | Tatum `x-api-key` header value |
| `TATUM_SUI_RPC_URL` | No | `https://sui-mainnet.gateway.tatum.io` | Tatum Sui Mainnet RPC |
| `SUI_RPC_FALLBACK_URL` | No | `https://fullnode.mainnet.sui.io:443` | Fallback when Tatum rate-limits |
| `WALRUS_PRIVATE_KEY` | No | — | Funded Sui keypair for Walrus storage |
| `VITE_API_URL` | No | *(Vite proxy)* | Backend URL in production |

### Run Locally

```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
cd frontend && npm run dev
```

Frontend runs on **http://localhost:5173**, backend on **http://localhost:3001**.

---

## Walrus Integration

SuiSleuth uses the Walrus TypeScript SDK (`@mysten/walrus`) to store every wallet analysis as a permanent JSON blob on Walrus Mainnet. Each blob gets a unique `blobId` that forms the basis of the shareable report URL:

```
https://aggregator.walrus-mainnet.walrus.space/v1/<blobId>
```

**Note:** Walrus Mainnet storage requires a Sui wallet funded with WAL tokens. If storage fails, the analysis result is still returned — Walrus is additive, not blocking.

---

## Tatum Integration

All Sui on-chain data is fetched via Tatum's enterprise Sui RPC Gateway and Data API:

- **RPC Gateway:** `https://sui-mainnet.gateway.tatum.io`
- **Data API:** `https://api.tatum.io`
- **Auth:** `x-api-key` header on all requests
- **Fallback:** Public Sui fullnode when gateway rate-limits (429)

---

## Tatum MCP

SuiSleuth integrates with the official [**Tatum MCP server**](https://github.com/tatumio/blockchain-mcp) (`@tatumio/blockchain-mcp`). The backend mirrors the same MCP tool interfaces in `backend/src/tatum.ts`, so analysis logic aligns with what AI agents can call via MCP.

### Cursor / IDE setup

Add to your MCP config (`.cursor/mcp.json` in this repo, or global Cursor settings):

```json
{
  "mcpServers": {
    "tatumio": {
      "command": "npx",
      "args": ["@tatumio/blockchain-mcp"],
      "env": {
        "TATUM_API_KEY": "your_tatum_api_key"
      }
    }
  }
}
```

Copy `.cursor/mcp.json.example` → `.cursor/mcp.json` and set your key. **Do not commit real API keys** to public repos.

### MCP tools used by SuiSleuth

| MCP Tool | Backend function | Purpose |
|----------|------------------|---------|
| `get_transaction_history` | `getTransactionHistory()` | Wallet TX history (Data API; falls back to `gateway_execute_rpc` on Sui) |
| `get_wallet_portfolio` | `getWalletPortfolio()` | Object/coin holdings (Data API; falls back to RPC on Sui) |
| `check_malicious_address` | `checkMaliciousAddress()` | Security scan — shows **⚠️ Flagged** on result card if `status: invalid` |
| `gateway_execute_rpc` | `gatewayExecuteRpc()` | Raw Sui RPC (`suix_queryTransactionBlocks`, `suix_getOwnedObjects`, `suix_getBalance`) |

### Sui-specific notes

- **Data API v4** does not yet list `sui-mainnet` for portfolio/transaction endpoints. SuiSleuth automatically falls back to `gateway_execute_rpc` for all on-chain Sui queries.
- **`check_malicious_address`** officially supports ETH, BTC, and LTC address formats. Sui addresses return `unknown` (not flagged) until Tatum expands chain support. The integration is wired and will flag addresses when the API returns `status: "invalid"`.

### Example MCP prompts (Cursor)

- *"Use get_transaction_history for 0x… on sui-mainnet"*
- *"Check if this address is malicious with check_malicious_address"*
- *"Run suix_getBalance via gateway_execute_rpc on sui-mainnet"*

---

## OG Score Tiers

| Score | Badge |
|-------|-------|
| 80–100 | 🏆 OG Whale |
| 60–79 | 💎 Diamond Hands |
| 40–59 | 🔥 Degen Veteran |
| 20–39 | 📈 Early Mover |
| 0–19 | 🌱 Newcomer |

**Scoring:**
- Wallet age: 3+ years +40, 2+ years +30, 1+ year +20, under 6 months +5
- TX count: 1000+ +30, 500+ +20, 100+ +10, under 10 +2
- Early adopter: first activity before Jan 1, 2023 +30

---

## Judging Notes (Hackathon)

This project was built for the **Tatum x Walrus hackathon** (May 23 – June 6, 2025).

- **Walrus Integration:** Every lookup permanently archived on Walrus Mainnet
- **Tatum Integration:** All RPC calls routed through Tatum's Sui gateway
- **Creativity:** Wallet intelligence + decentralized result storage is a novel use case
- **Built on:** Sui Mainnet

---

## License

MIT
