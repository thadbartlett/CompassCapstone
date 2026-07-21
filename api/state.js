// api/state.js  —  Vercel serverless function (Node runtime)
//
// Proxy for the xAPI **State API** — the standard "resume where you left off"
// mechanism. It stores/reads a small JSON progress document keyed by
// (activityId, agent, stateId) in the Veracity LRS.
//
// Like /api/track, this is the ONLY place that knows the LRS credentials. The
// browser calls /api/state; this function attaches Basic auth server-side and
// forwards to Veracity's `.../activities/state` resource.
//
//   GET    /api/state?activityId=..&agent=<json>&stateId=..  -> read document
//   PUT    (same query, JSON body)                            -> write document
//   DELETE (same query)                                       -> clear document
//
// The State API base is DERIVED from VERACITY_ENDPOINT (the /statements URL),
// so no extra environment variable is needed:
//   https://x.lrs.io/xapi/statements  ->  https://x.lrs.io/xapi/activities/state

const XAPI_VERSION = "1.0.3";

function lrsConfig() {
  const endpoint = process.env.VERACITY_ENDPOINT;
  const key = process.env.VERACITY_KEY;
  const secret = process.env.VERACITY_SECRET;
  if (!endpoint || !key || !secret) return null;
  // Strip a trailing "/statements" (with optional slash) to get the xAPI base.
  const base = endpoint.replace(/\/statements\/?$/i, "");
  const stateUrl = `${base}/activities/state`;
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  return { stateUrl, auth };
}

export default async function handler(req, res) {
  const cfg = lrsConfig();
  if (!cfg) {
    console.error(
      "[state] Missing env vars (VERACITY_ENDPOINT / KEY / SECRET)."
    );
    return res.status(500).json({ error: "Server not configured for state." });
  }

  const { activityId, agent, stateId } = req.query;
  if (!activityId || !agent || !stateId) {
    return res
      .status(400)
      .json({ error: "Missing activityId, agent, or stateId" });
  }

  const qs = new URLSearchParams({ activityId, agent, stateId }).toString();
  const url = `${cfg.stateUrl}?${qs}`;
  const baseHeaders = {
    Authorization: cfg.auth,
    "X-Experience-API-Version": XAPI_VERSION,
  };

  try {
    if (req.method === "GET") {
      const r = await fetch(url, { headers: baseHeaders });
      if (r.status === 404) {
        // No document yet for this learner — normal on first visit.
        return res.status(404).json({ error: "no state" });
      }
      const text = await r.text();
      if (!r.ok) {
        console.error(`[state] LRS GET ${r.status}: ${text}`);
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
        console.error(`[state] LRS PUT ${r.status}: ${text}`);
        return res.status(502).json({ error: "LRS error", status: r.status });
      }
      return res.status(204).end();
    }

    if (req.method === "DELETE") {
      const r = await fetch(url, { method: "DELETE", headers: baseHeaders });
      if (!r.ok && r.status !== 404) {
        const text = await r.text();
        console.error(`[state] LRS DELETE ${r.status}: ${text}`);
        return res.status(502).json({ error: "LRS error", status: r.status });
      }
      return res.status(204).end();
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[state] Error reaching LRS:", err);
    return res.status(502).json({ error: "Failed to reach LRS" });
  }
}
