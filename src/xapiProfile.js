// xapiProfile.js  (CLIENT side)
//
// Thin client for the xAPI **Agent Profile API** (via our /api/profile proxy),
// plus the "first name wins" identity policy.
//
// The learner's canonical display name is stored once, keyed by their email.
// resolveCanonicalName() is called at login: if a name is already on file for
// that email, it wins (and what the learner typed this time is ignored for
// display); otherwise the typed name is saved as canonical.

const PROFILE_ID = "capstone-identity";

function agentFor(email) {
  return { objectType: "Agent", mbox: `mailto:${email}` };
}

function query(email) {
  return new URLSearchParams({
    agent: JSON.stringify(agentFor(email)),
    profileId: PROFILE_ID,
  }).toString();
}

// Read the stored profile document ({ name }), or null if none exists.
export async function loadProfile(email) {
  const res = await fetch(`/api/profile?${query(email)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`profile GET failed: ${res.status}`);
  return res.json();
}

// Write (create) the profile document.
export async function saveProfile(email, doc) {
  const res = await fetch(`/api/profile?${query(email)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
    keepalive: true,
  });
  if (!res.ok) throw new Error(`profile PUT failed: ${res.status}`);
}

// Delete the profile document (used on a full reset).
export async function deleteProfile(email) {
  const res = await fetch(`/api/profile?${query(email)}`, {
    method: "DELETE",
    keepalive: true,
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`profile DELETE failed: ${res.status}`);
  }
}

// "First name wins": return the canonical display name for this email.
// - If a profile name already exists -> use it (ignore the freshly typed name).
// - If not -> save the typed name as canonical and return it.
// - If the LRS is unreachable -> fall back to the typed name; it becomes
//   canonical on the next successful login.
export async function resolveCanonicalName(typedName, email) {
  try {
    const profile = await loadProfile(email);
    if (profile && profile.name) return profile.name;
    await saveProfile(email, { name: typedName });
    return typedName;
  } catch (err) {
    console.warn("[profile] could not resolve canonical name (using typed):", err);
    return typedName;
  }
}
