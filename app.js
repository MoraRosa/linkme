(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

  // Icon + colour per link type. Types not listed here fall back to "web".
  const TYPES = {
    phone:     { color: "pink",   icon: SVG('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>') },
    email:     { color: "sage",   icon: SVG('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>') },
    web:       { color: "butter", icon: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>') },
    portfolio: { color: "lilac",  icon: SVG('<rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 21h8M12 18v3"/>') },
    tiktok:    { color: "pink",   icon: SVG('<path d="M10 17V6l7 2M10 17a3 3 0 1 1-3-3"/>') },
    linkedin:  { color: "sage",   text: "in" },
    github:    { color: "lilac",  icon: SVG('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>') },
  };

  const pretty = (url) => url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");

  function row({ type, label, value, href, external }) {
    const t = TYPES[type] || TYPES.web;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "link";
    a.href = href;
    if (external) { a.target = "_blank"; a.rel = "noopener"; }
    a.innerHTML =
      `<span class="chip chip--${t.color}" aria-hidden="true">${t.text || t.icon}</span>` +
      `<span class="link-text"><span class="link-label"></span><span class="link-value"></span></span>`;
    a.querySelector(".link-label").textContent = label;
    a.querySelector(".link-value").textContent = value;
    li.append(a);
    return li;
  }

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  function render(c) {
    document.title = `${c.name} · ${c.org}`;
    $("name").textContent = c.name;
    $("role").textContent = [c.title, c.org].filter(Boolean).join(", ");
    $("tagline").textContent = c.tagline || "";
    $("place").textContent = [c.city, c.region].filter(Boolean).join(", ");

    const avatar = $("avatar");
    if (c.logo) {
      avatar.classList.add("avatar--logo");
      const img = new Image();
      img.alt = c.org ? `${c.org} mascot` : "";
      img.decoding = "async";
      img.src = c.logo;
      avatar.append(img);
    } else if (c.photo) {
      const img = new Image();
      img.alt = "";
      img.src = c.photo;
      avatar.append(img);
    } else {
      avatar.textContent = initials(c.name);
    }

    const list = $("links");
    list.textContent = "";
    if (c.phone) list.append(row({ type: "phone", label: "Call", value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, "")}` }));
    if (c.email) list.append(row({ type: "email", label: "Email", value: c.email, href: `mailto:${c.email}` }));
    for (const l of c.links || []) {
      if (!l.url || l.hidden) continue;
      list.append(row({ type: l.type, label: l.label, value: pretty(l.url), href: l.url, external: true }));
    }

    $("card").removeAttribute("aria-busy");
  }

  // ---------- Show / hide details ----------
  // c.showDetails is the default everyone sees. The switch overrides it on this device only.
  const KEY = "linkme:details";
  function readPref() { try { return localStorage.getItem(KEY); } catch (_) { return null; } }
  function writePref(v) { try { localStorage.setItem(KEY, v); } catch (_) { /* private mode etc. */ } }

  function setupDetails(c) {
    const card = $("card");
    const sw = $("details-switch");
    const status = $("details-status");
    const apply = (show) => {
      card.dataset.details = show ? "show" : "hide";
      sw.setAttribute("aria-checked", String(show));
      status.textContent = show ? "On" : "Off";
    };
    const saved = readPref();
    apply(saved === null ? c.showDetails !== false : saved === "show");
    sw.addEventListener("click", () => {
      const show = sw.getAttribute("aria-checked") !== "true";
      apply(show);
      writePref(show ? "show" : "hide");
    });
  }

  // ---------- QR ----------
  function cardUrl(c) {
    if (c.shareUrl) return c.shareUrl;
    const u = new URL(location.href);
    u.hash = ""; u.search = "";
    u.pathname = u.pathname.replace(/index\.html$/, "");
    return u.toString();
  }

  function qrSvg(text) {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let col = 0; col < n; col++) {
        if (qr.isDark(r, col)) d += `M${col} ${r}h1v1h-1z`;
      }
    }
    return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">` +
           `<path fill="#000" d="${d}"/></svg>`;
  }

  function setupQr(c) {
    const dialog = $("qr-dialog");
    const url = cardUrl(c);
    const generated = () => { $("qr-box").innerHTML = qrSvg(url); };
    if (c.qrImage) fetch(c.qrImage).catch(() => {});   // warms the offline cache so the designed QR works with no signal
    $("show-qr").addEventListener("click", () => {
      if (c.qrImage) {
        const img = new Image();
        img.alt = "";
        img.onerror = generated;           // image missing or offline-miss: fall back to the generated code
        img.src = c.qrImage;
        $("qr-box").replaceChildren(img);
      } else {
        generated();
      }
      $("qr-url").textContent = pretty(url);
      $("qr-share").textContent = typeof navigator.share === "function" ? "Share link" : "Copy link";
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    $("qr-close").addEventListener("click", () => dialog.close());

    const share = $("qr-share");
    const canShare = typeof navigator.share === "function";
    share.textContent = canShare ? "Share link" : "Copy link";
    share.addEventListener("click", async () => {
      try {
        if (canShare) { await navigator.share({ title: document.title, url }); return; }
        await navigator.clipboard.writeText(url);
        share.textContent = "Copied";
        setTimeout(() => { share.textContent = "Copy link"; }, 1800);
      } catch (_) { /* share sheet dismissed or clipboard blocked: nothing to do */ }
    });
    // Tap outside the panel to close.
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  }

  // ---------- One-time reset: open the page with ?reset on the end ----------
  // Clears the saved offline copy, the service worker and the show/hide choice on this device,
  // then reloads fresh. It can't uninstall the app itself (only you can do that).
  if (/[?&]reset(=|&|$)/.test(location.search)) {
    document.body.textContent = "Clearing the saved copy...";
    const tasks = [];
    if ("serviceWorker" in navigator) tasks.push(navigator.serviceWorker.getRegistrations().then((rs) => Promise.all(rs.map((r) => r.unregister()))));
    if ("caches" in window) tasks.push(caches.keys().then((ks) => Promise.all(ks.map((k) => caches.delete(k)))));
    try { localStorage.removeItem(KEY); } catch (_) { /* ignore */ }
    Promise.allSettled(tasks).then(() => location.replace(location.pathname));
    return;
  }

  // ---------- Boot ----------
  fetch("card.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((c) => { render(c); setupDetails(c); setupQr(c); $("save").download = `${c.name.replace(/\s+/g, "-")}.vcf`; })
    .catch(() => {
      $("role").textContent = "Couldn't load the card. Check your connection and reload.";
      $("card").removeAttribute("aria-busy");
    });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
