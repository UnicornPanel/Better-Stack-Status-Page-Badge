/**
 * Better Stack Status Page Badge
 * Author: Unicorn Panel (https://unicornpanel.net)
 * Repository: https://github.com/UnicornPanel/Better-Stack-Status-Page-Badge
 */

import * as BunnySDK from "https://esm.sh/@bunny.net/edgescript-sdk";

BunnySDK.net.http.serve(async (request) => {
  const url = new URL(request.url);

  const page = (url.searchParams.get("page") || "").toLowerCase().trim();
  if (!page || !/^[a-z0-9.-]+$/.test(page)) {
    return jsonResponse({ error: "Invalid page format" }, 400);
  }

  const stateOnly = url.searchParams.get("state-only") !== "0";  // default true
  const target = `https://${page}/index.json`;

  let upstream;
  try {
    upstream = await fetch(target, {
      headers: { "User-Agent": "BS Badge BunnyEdge/1.0" },
      // note: Bunny fetch inherits built-in fetch; no special cf-options
    });
  } catch (err) {
    return jsonResponse({ error: "Unable to reach BetterStack" }, 502);
  }

  if (!upstream.ok) {
    return jsonResponse(
      { error: `Upstream error: ${upstream.status}` },
      upstream.status
    );
  }

  const raw = await upstream.text();

  if (!stateOnly) {
    return new Response(raw, {
      status: 200,
      headers: corsHeaders({
        "Content-Type": "application/json",
        "Cache-Control": "max-age=30"
      })
    });
  }

  try {
    const data = JSON.parse(raw);
    const state = (data?.data?.attributes?.aggregate_state || "").toLowerCase();
    if (!state) throw new Error("Missing aggregate_state");
    return jsonResponse({ aggregate_state: state });
  } catch (err) {
    return jsonResponse({ error: "Invalid response from BetterStack" }, 500);
  }
});

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: corsHeaders({
      "Content-Type": "application/json",
      "Cache-Control": "max-age=30"
    })
  });
}

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extra
  };
}
