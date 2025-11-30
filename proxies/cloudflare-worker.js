/**
 * Better Stack Status Page Badge
 * Author: Unicorn Panel (https://unicornpanel.net)
 * Repository: https://github.com/UnicornPanel/Better-Stack-Status-Page-Badge
 */

export default {
    async fetch(request) {
      const url = new URL(request.url);
  
      /** ---------- INPUT VALIDATION ---------- **/
      const page = (url.searchParams.get("page") || "").toLowerCase().trim();
  
      if (!page || !/^[a-z0-9.-]+$/.test(page)) {
        return jsonResponse({ error: "Invalid page format" }, 400);
      }
  
      /** ---------- FLAGS ---------- **/
      const stateOnly = url.searchParams.get("state-only") !== "0"; 
      // default: true
  
      /** ---------- BUILD URL ---------- **/
      const target = `https://${page}/index.json`;
  
      /** ---------- FETCH UPSTREAM ---------- **/
      let upstream;
      try {
        upstream = await fetch(target, {
          headers: { "User-Agent": "BS Badge Worker/1.0" },
          cf: { timeout: 4 } // optional fetch timeout
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
        // Return full response
        return new Response(raw, {
          status: 200,
          headers: corsHeaders({
            "Content-Type": "application/json",
            "Cache-Control": "max-age=30"
          })
        });
      }
  
      /** ---------- EXTRACT aggregate_state ---------- **/
      try {
        const data = JSON.parse(raw);
        const state = (data?.data?.attributes?.aggregate_state || "").toLowerCase();
  
        if (!state) throw new Error("Missing aggregate_state");
  
        return jsonResponse({ aggregate_state: state });
      } catch (err) {
        return jsonResponse({ error: "Invalid response from BetterStack" }, 500);
      }
    }
  };
  
  /** ---------- HELPERS ---------- **/
  
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