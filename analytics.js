/* ------------------------------------------------------------------
   Analytics and consent.

   No build step, no dependencies, no framework. Plain ES5.

   Google Analytics sets cookies, so it only loads after the reader
   says yes. Cloudflare Web Analytics is cookieless and is injected by
   Cloudflare itself at the edge, so it is not touched here and needs
   no consent.

   The CSP in _headers forbids inline script, which is why every line
   of this lives in a file rather than in a <script> block.
   ------------------------------------------------------------------ */

(function () {
  "use strict";

  // Your GA4 Measurement ID. Looks like G-XXXXXXXXXX.
  var GA_ID = "__GA_MEASUREMENT_ID__";

  var STORE = "site-consent";

  function configured() {
    return GA_ID && GA_ID.indexOf("__") !== 0;
  }

  function readChoice() {
    try {
      return window.localStorage.getItem(STORE);
    } catch (e) {
      return null; // private mode, storage disabled — treat as undecided
    }
  }

  function writeChoice(v) {
    try {
      window.localStorage.setItem(STORE, v);
    } catch (e) {
      /* nothing we can do; the banner simply reappears next visit */
    }
  }

  function loadGA() {
    if (!configured()) return;

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_ID);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
  }

  function dismiss(banner, value) {
    writeChoice(value);
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    if (value === "yes") loadGA();
  }

  function button(label, kind) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "consent__btn consent__btn--" + kind;
    b.appendChild(document.createTextNode(label));
    return b;
  }

  function showBanner() {
    var wrap = document.createElement("div");
    wrap.className = "consent";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-live", "polite");
    wrap.setAttribute("aria-label", "Analytics consent");

    var inner = document.createElement("div");
    inner.className = "consent__inner";

    var text = document.createElement("p");
    text.className = "consent__text";
    text.appendChild(document.createTextNode(
      "This site would like to count visits with Google Analytics, which sets cookies. " +
      "Page counts are collected either way, without cookies. Your call."
    ));

    var actions = document.createElement("div");
    actions.className = "consent__actions";

    var yes = button("Allow", "yes");
    var no = button("No thanks", "no");

    yes.addEventListener("click", function () { dismiss(wrap, "yes"); });
    no.addEventListener("click", function () { dismiss(wrap, "no"); });

    actions.appendChild(no);
    actions.appendChild(yes);
    inner.appendChild(text);
    inner.appendChild(actions);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);

    no.focus();
  }

  function start() {
    var choice = readChoice();
    if (choice === "yes") { loadGA(); return; }
    if (choice === "no") { return; }
    if (!configured()) { return; } // nothing to consent to yet
    showBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
