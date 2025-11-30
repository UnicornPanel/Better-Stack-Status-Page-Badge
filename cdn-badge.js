/*!
 * Better Stack Status Page Badge
 * Author: Unicorn Panel (https://unicornpanel.net)
 * Repository: https://github.com/UnicornPanel/Better-Stack-Status-Page-Badge
 */

(function () {
    const SCRIPT = document.currentScript;

    // Required attributes
    const PAGE   = SCRIPT.dataset.page   || null;
    const TARGET = SCRIPT.dataset.target || null;

    if (!PAGE || !TARGET) {
        console.warn("BetterStack Status: data-page and data-target are required.");
        return;
    }

    // Optional attributes
    const TXT_OPERATIONAL = SCRIPT.dataset.operational || "Services Operational";
    const TXT_DEGRADED    = SCRIPT.dataset.degraded    || "Degraded Services";
    const TXT_DOWN        = SCRIPT.dataset.down        || "Services Offline";
    const TXT_LOADING     = SCRIPT.dataset.loading     || "Loading";
    const TXT_ERROR       = SCRIPT.dataset.error       || "Connection Error";
    const SHOW_ICON       = SCRIPT.dataset.icon !== "false";
    const REFRESH         = parseInt(SCRIPT.dataset.refresh || "30", 10) * 1000;

    const STATUS_URL = `https://dev.ooo/bs-status/proxy.php?page=${PAGE}&state-only=1`;

    /** ---------- CSS Injection Once ---------- **/
    if (!document.querySelector("#bs-badge-style")) {
        const STYLE = document.createElement("style");
        STYLE.id = "bs-badge-style";
        STYLE.textContent = `
            .bs-badge {
                display:inline-flex;
                align-items:center;
                gap:10px;
                border-radius:6px;
                text-decoration:none;
                font-family: system-ui, sans-serif;
                background: whitesmoke;
                color:#6b6b6b;
                padding: 6px 12px;
                font-size: 13px;
                line-height: 1;
                box-sizing: border-box;
            }
            .bs-badge-operational,
            .bs-badge-degraded,
            .bs-badge-down {
                width:10px;
                height:10px;
                border-radius:50%;
                display:inline-block;
                animation: bs-pulse 1.5s infinite ease-in-out;
            }
            .bs-badge-operational { background:#0bb20b; --pulse-color: rgba(11, 178, 11, 0.7); }
            .bs-badge-degraded    { background:#e3c700; --pulse-color: rgba(227, 199, 0, 0.7); }
            .bs-badge-down        { background:#ff4c4c; --pulse-color: rgba(255, 76, 76, 0.7); }

            @keyframes bs-pulse {
                0%   { transform: scale(0.95); box-shadow: 0 0 0 0 var(--pulse-color); }
                70%  { transform: scale(1);    box-shadow: 0 0 0 5px transparent; }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 transparent; }
            }
        `;
        document.head.appendChild(STYLE);
    }

    /** ---------- Render Badge Helper ---------- **/
    function renderBadge(iconClass, text) {
        const targetEl = document.querySelector(TARGET);
        if (!targetEl) return console.warn("BetterStack Status: target not found:", TARGET);

        let a = targetEl.querySelector(".bs-badge");
        if (!a) {
            a = document.createElement("a");
            a.href = `https://${PAGE}`;
            a.target = "_blank";
            a.className = "bs-badge";
            targetEl.appendChild(a);
        }

        a.innerHTML = ""; // clear

        if (SHOW_ICON) {
            const span = document.createElement("span");
            span.className = iconClass;
            a.appendChild(span);
        }

        a.appendChild(document.createTextNode(text));
    }

    /** ---------- Initial Loading State ---------- **/
    renderBadge("bs-badge-degraded", TXT_LOADING);

    /** ---------- Fetch State ---------- **/
    function updateBadge() {
        fetch(STATUS_URL)
            .then(r => r.json())
            .then(result => {
                const state = (result.aggregate_state || "").toLowerCase();

                switch (state) {
                    case "operational":
                        renderBadge("bs-badge-operational", TXT_OPERATIONAL);
                        break;
                    case "degraded":
                        renderBadge("bs-badge-degraded", TXT_DEGRADED);
                        break;
                    case "down":
                        renderBadge("bs-badge-downtime", TXT_DOWN);
                        break;
                    default:
                        renderBadge("bs-badge-degraded", TXT_DEGRADED);
                        break;
                }
            })
            .catch(() => {
                renderBadge("bs-badge-degraded", TXT_ERROR);
            });
    }

    /** ---------- First Load + Auto Refresh ---------- **/
    updateBadge();
    setInterval(updateBadge, REFRESH);

})();