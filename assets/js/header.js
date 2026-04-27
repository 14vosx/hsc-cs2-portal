(function () {
  const container = document.getElementById("site-header");
  if (!container) return;

  const CFG = window.HSC_CONFIG ?? {};
  const BASE = CFG.BASE_PATH ?? "/portal/cs2";
  const ASSETS = CFG.ASSETS_BASE ?? `${BASE}/assets/current`;

  // Se quiser trocar isso por config depois, dá também.
  const SERVER_TAG = "srv1353392.hstgr.cloud";

  container.innerHTML = `
    <header class="site-header">
      <div class="header-brand">
        <a class="brand-link" href="${BASE}/">
          <img src="${ASSETS}/img/brand/hsc-logo-colors.png" alt="HSC Logo" class="logo-img">
        </a>
        <div class="brand-info">
          <h1>HSC <span>PORTAL</span></h1>
          <span class="srv-tag">${SERVER_TAG}</span>
        </div>
      </div>

      <nav class="site-nav">
        <a href="${BASE}/" data-path="/">Home</a>
        <a href="${BASE}/ranking/" data-path="/ranking/">Ranking</a>
        <a href="${BASE}/matches/" data-path="/matches/">Matches</a>
        <a href="${BASE}/maps/" data-path="/maps/">Maps</a>
        <a href="${BASE}/news/" data-path="/news/">News</a>
      </nav>
    </header>
  `;

  // Link ativo
  const currentPath = (window.location.pathname || "/");
  const rel = currentPath.startsWith(BASE) ? currentPath.slice(BASE.length) : currentPath;

  container.querySelectorAll("nav a").forEach(a => {
    const p = a.getAttribute("data-path") || "";
    const isHome = (p === "/");
    const relNorm = rel === "" ? "/" : rel;

    const active =
      (isHome && relNorm === "/") ||
      (!isHome && (relNorm === p || relNorm.startsWith(p)));

    if (active) a.classList.add("active");
  });
})();
