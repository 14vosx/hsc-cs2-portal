import { num, fmt } from "../lib/format.js";
import { escapeHtml } from "../lib/dom.js";
import { fetchJson } from "../lib/http.js";
import { el, setHtml, setText, show, hide } from "../lib/ui.js";

(async () => {
  const API = window.HSC_CONFIG?.API_BASE ?? "/api/cs2/v2";
  const ASSETS = window.HSC_CONFIG?.ASSETS_BASE ?? "/portal/cs2/assets/current";

  document.documentElement.style.setProperty(
    "--bg-image",
    `url("${ASSETS}/img/backgrounds/pages/home.png")`,
  );

  // Ranking
  try {
    const data = await fetchJson(`${API}/ranking.json`, { cache: "no-store" });

    hide("#rankStatus");
    setHtml(
      "#rankMeta",
      `<span class="pill">Ativo</span> ${escapeHtml(data.generatedAt)} · <span class="pill">Maps</span> ${escapeHtml(data.mapsFinalizados)}`,
    );

    const players = (data.players || []).slice();
    players.sort(
      (a, b) =>
        num(b.score) - num(a.score) ||
        num(b.impactRating) - num(a.impactRating),
    );

    const tbody = el("#rankTable tbody");
    tbody.innerHTML = "";

    players.slice(0, 10).forEach((p, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td style="font-weight:600">${escapeHtml(p.name || "Unknown")}</td>
        <td class="muted right">${num(p.matchesPlayed)}</td>
        <td class="right">${fmt(p.kdRatio, 2)}</td>
        <td class="right">${fmt(p.headshotPct, 1)}%</td>
        <td class="right">${fmt(p.adr, 1)}</td>
        <td class="right score">${fmt(p.score, 2)}</td>`;
      tbody.appendChild(tr);
    });

    show("#rankTable", "table");
  } catch (e) {
    // mantém visível e mostra erro
    show("#rankStatus");
    setText("#rankStatus", `Erro: ${e}`);
  }

  // Matches
  try {
    const data = await fetchJson(`${API}/matches.json`, { cache: "no-store" });

    const matches = (data.matches || [])
      .slice()
      .sort((a, b) => (b.matchid || 0) - (a.matchid || 0))
      .slice(0, 8);

    const tbody = el("#matchTable tbody");
    tbody.innerHTML = "";

    matches.forEach((m) => {
      const map = m.maps?.[0] || {};
      const score = `${map.team1_score ?? 0}×${map.team2_score ?? 0}`;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="muted">#${m.matchid}</td>
        <td style="text-transform:capitalize">${escapeHtml(map.mapname || "-")}</td>
        <td class="score">${escapeHtml(score)}</td>
        <td>${escapeHtml(map.winner || "—")}</td>`;
      tbody.appendChild(tr);
    });

    hide("#matchStatus");
    show("#matchTable", "table");
  } catch (e) {
    show("#matchStatus");
    setText("#matchStatus", `Erro: ${e}`);
  }
})();
