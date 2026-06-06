import "dotenv/config";
import cors from "cors";
import express from "express";
import { getCachedAnalysis, setCachedAnalysis } from "./analysisCache.js";
import { mapAnalysisError, noTransactionsError } from "./errors.js";
import { getRecentLookups } from "./recentLookups.js";
import { getScanJob, startBackgroundWalrusUpload } from "./scanJobs.js";
import { analyzeWallet, isValidSuiAddress } from "./sui.js";
import { fetchWalrusBlob } from "./walrusFetch.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://localhost:5173"],
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "SuiSleuth API" });
});

app.get("/api/recent", (_req, res) => {
  res.json({ lookups: getRecentLookups() });
});

app.get("/api/report/:blobId", async (req, res) => {
  try {
    const analysis = await fetchWalrusBlob(req.params.blobId);
    res.json(analysis);
  } catch (error) {
    console.warn("Walrus report fetch failed:", error);
    res.status(404).json({
      error: "Could not load report from Walrus.",
      code: "WALRUS_NOT_FOUND",
    });
  }
});

app.get("/api/status/:scanId", (req, res) => {
  const job = getScanJob(req.params.scanId);
  if (!job) {
    res.status(404).json({
      error: "Scan not found or expired",
      code: "SCAN_NOT_FOUND",
    });
    return;
  }

  res.json({
    scanId: job.scanId,
    status: job.status,
    walrus: job.walrus,
    walrusFailed: job.status === "failed",
    walrusPending: job.status === "pending",
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { address } = req.body as { address?: string };

    if (!address || typeof address !== "string") {
      res.status(400).json({
        error: "Missing wallet address",
        code: "INVALID_ADDRESS",
      });
      return;
    }

    const trimmed = address.trim();
    if (!isValidSuiAddress(trimmed)) {
      res.status(400).json({
        error:
          "That doesn't look like a valid Sui address. Sui addresses start with 0x and are 64 hex characters.",
        code: "INVALID_ADDRESS",
      });
      return;
    }

    const cached = getCachedAnalysis(trimmed);
    if (cached) {
      if (cached.walrus) {
        res.json({
          analysis: cached.analysis,
          walrus: cached.walrus,
          walrusPending: false,
          walrusFailed: false,
          cached: true,
        });
        return;
      }

      const scanId = startBackgroundWalrusUpload(trimmed, cached.analysis);
      res.json({
        analysis: cached.analysis,
        scanId,
        walrus: null,
        walrusPending: true,
        walrusFailed: false,
        cached: true,
      });
      return;
    }

    const analysis = await analyzeWallet(trimmed);

    if (
      analysis.transactionCount === 0 &&
      !analysis.firstActivity &&
      analysis.walletAge.daysOld === null
    ) {
      const err = noTransactionsError();
      res.status(err.status).json({ error: err.error, code: err.code });
      return;
    }

    setCachedAnalysis(trimmed, analysis, null);
    const scanId = startBackgroundWalrusUpload(trimmed, analysis);

    res.json({
      analysis,
      scanId,
      walrus: null,
      walrusPending: true,
      walrusFailed: false,
      cached: false,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const mapped = mapAnalysisError(error);
    res.status(mapped.status).json({
      error: mapped.error,
      code: mapped.code,
    });
  }
});

app.listen(PORT, () => {
  console.log(`SuiSleuth API listening on http://localhost:${PORT}`);
});
