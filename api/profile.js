// api/profile.js  —  Vercel serverless function (Node runtime)
//
// Proxy for the xAPI **Agent Profile API** — per-learner data keyed by the
// agent (email), independent of any activity. We use it to store the learner's
// CANONICAL display name so it stays consistent across sessions/devices
// ("first name wins"): the first name a given email logs in with is saved here
// and reused for every statement thereafter.
//
// Like /api/track and /api/state, credentials live only here. The Profile API
// base is derived from VERACITY_ENDPOINT (swap /statements for /agents/profile),
// so there is no extra environment variable.
//
//   GET    /api/profile?agent=<json>&profileId=..  -> read document
//   PUT    (same query, JSON body)                 -> write document
//   DELETE (same query)                            -> clear document

const XAPI_VERSION = "1.0.3";

function lrsConfig() {
  const endpoint = process.env.VERACITY_ENDPOINT;
  const key = process.env.VERACITY_KEY;
  const secret = process.env.VERACITY_SECRET;
  if (!endpoint || !key || !secret) return null;
  const base = endpoint.replace(/\/statements\/?$/i, "");
  const profileUrl = `${base}/agents/profile`;
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  return { profileUrl, auth };
}

export default async function handler(req, res) {
  const cfg = lrsConfig();
  if (!cfg) {
    console.error("[profile] Missing env vars (VERACITY_ENDPOINT / KEY / SECRET).");
    return res.status(500).json({ error: "Server not configured for profile." });
  }

  const { agent, profileId } = req.query;
  if (!agent || !profileId) {
    return res.status(400).json({ error: "Missing agent or profileId" });
  }

  const qs = new URLSearchParams({ agent, profileId }).toString();
  const url = `${cfg.profileUrl}?${qs}`;
  const baseHeaders = {
    Authorization: cfg.auth,
    "X-Experience-API-Version": XAPI_VERSION,
  };

  try {
    if (req.method === "GET") {
      const r = await fetch(url, { headers: baseHeaders });
      if (r.status === 404) return res.status(404).json({ error: "no profile" });
      const text = await r.text();
      if (!r.ok) {
        console.error(`[profile] LRS GET ${r.status}: ${text}`);
        return res.status(502).json({ error: "LRS error", status: r.status });
      }
      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text);
    }

    if (req.method === "PUT") {
      let body = req.body;
      if (body && typeof body !== "string") body = JSON.stringify(body);
      const r = await fetch(url, {
        method: "PUT",
        headers: { ...baseHeaders, "Content-Type": "application/json" },
        body: body || "{}",
      });
      if (!r.ok) {
        const text = await r.text();
        console.error(`[profile] LRS PUT ${r.status}: ${text}`);
        return res.status(502).json({ error: "LRS error", status: r.status });
      }
      return res.status(204).end();
    }

    if (req.method === "DELETE") {
      const r = await fetch(url, { method: "DELETE", headers: baseHeaders });
      if (!r.ok && r.status !== 404) {
        const text = await r.text();
        console.error(`[profile] LRS DELETE ${r.status}: ${text}`);
        return res.status(502).json({ error: "LRS error", status: r.status });
      }
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[profile] Error reaching LRS:", err);
    return res.status(502).json({ error: "Failed to reach LRS" });
  }
}
