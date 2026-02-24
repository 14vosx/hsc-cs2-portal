// /portal/cs2/assets/js/config.js
(function () {
  // Portal base (onde ficam as páginas)
  const BASE_PATH = "/portal/cs2";

  // API base (onde estão ranking.json, matches.json, etc.)
  // Se sua API ficar em outro host no futuro, você muda aqui.
  const API_BASE = "/api/cs2/v2";

  // Assets base (usa alias "current" para não depender de releases/DATE)
  const ASSETS_BASE = `${BASE_PATH}/assets`;

  window.HSC_CONFIG = Object.freeze({
    BASE_PATH,
    API_BASE,
    ASSETS_BASE,
    VERSION: "2026.02.14",
  });
})();
