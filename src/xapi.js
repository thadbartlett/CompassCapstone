// xapi.js  (CLIENT side)
//
// Builds xAPI statements and POSTs them to OUR OWN origin at /api/track.
// This file NEVER knows the Veracity endpoint, key, or secret. The serverless
// function attaches credentials server-side and forwards to the LRS.
//
// Usage:  sendStatement(verb, activityId, { activityName, result, extensions })
// Fire-and-forget: we do not block the UI on the network call; errors are
// logged to the console only.

import { getIdentity } from "./state.js";
import { COURSE_ACTIVITY_ID, COURSE_ACTIVITY_NAME } from "./hotspots.config.js";

// Standard ADL verb IRIs.
const VERBS = {
  experienced: {
    id: "http://adlnet.gov/expapi/verbs/experienced",
    display: { "en-US": "experienced" },
  },
  completed: {
    id: "http://adlnet.gov/expapi/verbs/completed",
    display: { "en-US": "completed" },
  },
  answered: {
    id: "http://adlnet.gov/expapi/verbs/answered",
    display: { "en-US": "answered" },
  },
};

function buildActor() {
  const identity = getIdentity() || {};
  const actor = { objectType: "Agent" };
  if (identity.name) actor.name = identity.name;
  actor.mbox = identity.email ? `mailto:${identity.email}` : "mailto:unknown@capstone.local";
  return actor;
}

function buildObject(activityId, activityName) {
  const obj = {
    objectType: "Activity",
    id: activityId,
  };
  if (activityName) {
    obj.definition = { name: { "en-US": activityName } };
  }
  return obj;
}

/**
 * Build and send one xAPI statement.
 * @param {"experienced"|"completed"} verbKey
 * @param {string} activityId  full activity IRI
 * @param {object} [opts]
 * @param {string} [opts.activityName]
 * @param {object} [opts.result]      xAPI result object (e.g. { completion: true })
 * @param {object} [opts.extensions]  merged into result.extensions
 */
export function sendStatement(verbKey, activityId, opts = {}) {
  const verb = VERBS[verbKey];
  if (!verb) {
    console.warn(`[xapi] unknown verb "${verbKey}" — not sending`);
    return;
  }

  const statement = {
    actor: buildActor(),
    verb,
    object: buildObject(activityId, opts.activityName),
    timestamp: new Date().toISOString(),
  };

  if (opts.result || opts.extensions) {
    statement.result = { ...(opts.result || {}) };
    if (opts.extensions) {
      statement.result.extensions = {
        ...(statement.result.extensions || {}),
        ...opts.extensions,
      };
    }
  }

  // Fire-and-forget. Do not await; log failures only.
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statement }),
    keepalive: true, // let it complete even if the page is navigating away
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn(`[xapi] /api/track responded ${res.status}: ${text}`);
      } else {
        console.debug(`[xapi] sent "${verbKey}" for ${activityId}`);
      }
    })
    .catch((err) => {
      console.warn("[xapi] failed to POST statement:", err);
    });
}

// Convenience wrappers used by the interaction logic.

export function sendExperienced(activityId, activityName) {
  sendStatement("experienced", activityId, { activityName });
}

export function sendCompleted(activityId, activityName) {
  sendStatement("completed", activityId, {
    activityName,
    result: { completion: true },
  });
}

// A quiz answer (correct or incorrect). Tracks each attempt.
export function sendAnswered(activityId, activityName, { success, response }) {
  sendStatement("answered", activityId, {
    activityName,
    result: { success: !!success, response: String(response) },
  });
}

// Whole-course completion, sent when the final hotspot completes.
export function sendCourseCompleted() {
  sendStatement("completed", COURSE_ACTIVITY_ID, {
    activityName: COURSE_ACTIVITY_NAME,
    result: { completion: true },
  });
}
