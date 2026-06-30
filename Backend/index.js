import express from "express";
import cors from "cors";
import fs from "fs/promises";
import pkg from "natural";

import preprocess from "./utils/preProcess.js";

const { TfIdf } = pkg;

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your Vercel frontend (and localhost during dev) to call this API
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173", "http://127.0.0.1:5500"];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

let problems = [];
let tfidf = new TfIdf();

let docVectors = [];
let docMagnitudes = [];

async function loadProblemsAndBuildIndex() {
  const data = await fs.readFile("./corpus/all_problems.json", "utf-8");
  problems = JSON.parse(data);

  tfidf = new TfIdf();

  problems.forEach((problem, idx) => {
    const text = preprocess(
      `${problem.title} ${problem.title} ${problem.description || ""}`
    );
    tfidf.addDocument(text, idx.toString());
  });

  docVectors = [];
  docMagnitudes = [];
  problems.forEach((_, idx) => {
    const vector = {};
    let sumSquares = 0;

    tfidf.listTerms(idx).forEach(({ term, tfidf: weight }) => {
      vector[term] = weight;
      sumSquares += weight * weight;
    });

    docVectors[idx] = vector;
    docMagnitudes[idx] = Math.sqrt(sumSquares);
  });
}

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "DSA Search API is running" });
});

app.post("/search", async (req, res) => {
  const rawQuery = req.body.query;

  if (!rawQuery || typeof rawQuery !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'query'" });
  }

  const query = preprocess(rawQuery);
  const tokens = query.split(" ").filter(Boolean);

  const termFreq = {};
  tokens.forEach((t) => {
    termFreq[t] = (termFreq[t] || 0) + 1;
  });

  const queryVector = {};
  let sumSqQ = 0;
  const N = tokens.length;
  Object.entries(termFreq).forEach(([term, count]) => {
    const tf = count / N;
    const idf = tfidf.idf(term);
    const w = tf * idf;
    queryVector[term] = w;
    sumSqQ += w * w;
  });
  const queryMag = Math.sqrt(sumSqQ) || 1;

  const scores = problems.map((_, idx) => {
    const docVec = docVectors[idx];
    const docMag = docMagnitudes[idx] || 1;
    let dot = 0;

    for (const [term, wq] of Object.entries(queryVector)) {
      if (docVec[term]) {
        dot += wq * docVec[term];
      }
    }

    const cosine = dot / (queryMag * docMag);
    return { idx, score: cosine };
  });

  const top = scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
    .map(({ idx }) => {
      const p = problems[idx];
      let platform = "Unknown";
      if (p.url.includes("leetcode.com")) {
        platform = "LeetCode";
      } else if (p.url.includes("codeforces.com")) {
        platform = "CodeForces";
      } else if (p.url.includes("codechef.com")) {
        platform = "CodeChef";
      } else if (p.url.includes("atcoder.jp")) {
        platform = "AtCoder";
      } else if (p.url.includes("cses.fi")) {
        platform = "Cses";
      }
      return { ...p, platform };
    });

  res.json({ results: top });
});

loadProblemsAndBuildIndex().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});