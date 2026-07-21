// api/track.js  —  Vercel serverless function (Node runtime)
//
// The ONLY place that knows the Veracity LRS endpoint + credentials. The
// browser POSTs a bare xAPI statement here; this function attaches the
// Authorization header server-side and forwards it to Veracity. The LRS
// credential therefore never ships in client JavaScript and never lands in the
// repo — it is read from environment variables at runtime.
//
// Required environment variables (set in Vercel → Project → Settings →
// Environment Variables, and locally in .env.local — see .env.local.example):
//
//   VERACITY_ENDPOINT   e.g. https://<name>.lrs.io/xapi/statements
//   VERACITY_KEY        LRS basic-auth key (username)
//   VERACITY_SECRET     LRS basic-auth secret (password)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const endpoint = process.env.VERACITY_ENDPOINT;
  const key = process.env.VERACITY_KEY;
  const secret = process.env.VERACITY_SECRET;

  if (!endpoint || !key || !secret) {
    console.error(
      "[track] Missing env vars. Need VERACITY_ENDPOINT, VERACITY_KEY, VERACITY_SECRET."
    );
    return res
      .status(500)
      .json({ error: "Server not configured for tracking (missing env vars)." });
  }

  // Body may already be parsed by Vercel; fall back to manual parse.
  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const statement = payload && payload.statement;
  if (!statement || typeof statement !== "object") {
    return res.status(400).json({ error: "Missing 'statement' in body" });
  }

  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");

  try {
    const lrsRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
        "X-Experience-API-Version": "1.0.3",
      },
      body: JSON.stringify(statement),
    });

    const text = await lrsRes.text();

    if (!lrsRes.ok) {
      console.error(`[track] LRS responded ${lrsRes.status}: ${text}`);
      return res
        .status(502)
        .json({ error: "LRS rejected statement", status: lrsRes.status, detail: text });
    }

    // Veracity typically returns a JSON array of statement ids.
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return res.status(200).json({ ok: true, lrs: data });
  } catch (err) {
    console.error("[track] Error forwarding to LRS:", err);
    return res.status(502).json({ error: "Failed to reach LRS" });
  }
}
