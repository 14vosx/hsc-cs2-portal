import { fetchJson } from "../lib/http.js";
import { escapeHtml } from "../lib/dom.js";
import { el, setText, setHtml, show, hide } from "../lib/ui.js";

(async () => {
  const API = window.HSC_CONFIG?.API_BASE ?? "/api/cs2/v2";

  const rowsEl = el("#rows");
  const metaEl = el("#meta");
  const statusEl = el("#status");
  const qEl = el("#q");
  const countEl = el("#count");
  const matchStatusEl = el("#matchStatus");

  let data = null;

  function safe(s) {
    return s === null || s === undefined ? "" : String(s);
  }
  function fmtWhen(m) {
    return m.start_time || "-";
  }
  function matchUrl(id) {
    return `/portal/cs2/matches/match.html?id=${encodeURIComponent(id)}`;
  }

  function render(matches) {
    rowsEl.innerHTML = "";

    for (const m of matches) {
      const maps = Array.isArray(m.maps) ? m.maps : [];
      const mapsHtml = maps.length
        ? maps
            .map(
              (x) => `
              <div class="map-entry">
                <span style="color:var(--tactical-green)">${escapeHtml(x.mapname || "-")}</span>
                <span class="muted">[${escapeHtml(safe(x.team1_score))}-${escapeHtml(safe(x.team2_score))}]</span>
              </div>`,
            )
            .join("")
        : `<span class="muted">-</span>`;

      const winner = safe(m.winner).trim();
      const winnerHtml = winner
        ? `<span class="winner-text">${escapeHtml(winner)}</span>`
        : `<span class="muted">—</span>`;

      const isTeam1Winner = winner && winner === safe(m.team1_name).trim();
      const isTeam2Winner = winner && winner === safe(m.team2_name).trim();

      const teamsHtml = `
        <div class="scoreboard">
          <div class="score-row">
            <span class="score-pill">${safe(m.team1_score)}</span>
            <span class="team ${isTeam1Winner ? "winner" : ""}">${safe(m.team1_name)}</span>
          </div>
          <div class="score-row">
            <span class="score-pill">${safe(m.team2_score)}</span>
            <span class="team ${isTeam2Winner ? "winner" : ""}">${safe(m.team2_name)}</span>
          </div>
        </div>
      `;

      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.addEventListener("click", () => {
        window.location.href = matchUrl(m.matchid);
      });
      tr.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", e => e.stopPropagation());
      });
      tr.innerHTML = `
        <td>
          <a class="match-link" href="${matchUrl(m.matchid)}">
            <span class="match-id">#${safe(m.matchid)}</span>
            <span class="match-cta">ver detalhes →</span>
          </a>
        </td>
        <td>
          <div style="font-weight:600">${escapeHtml(fmtWhen(m))}</div>
          <div class="pill" style="margin-top:4px; font-size:10px">${escapeHtml(safe(m.series_type))}</div>
        </td>
        <td>${teamsHtml}</td>
        <td>${mapsHtml}</td>
        <td>${winnerHtml}</td>
      `;
      rowsEl.appendChild(tr);
    }

    setText("#count", String(matches.length));
  }

  function applyFilter() {
    if (!data) return;

    const q = qEl.value.trim().toLowerCase();
    if (!q) return render(data.matches || []);

    const filtered = (data.matches || []).filter((m) => {
      const blob = [
        m.matchid,
        m.start_time,
        m.winner,
        m.series_type,
        m.team1_name,
        m.team2_name,
        ...(Array.isArray(m.maps)
          ? m.maps.flatMap((x) => [x.mapname, x.winner])
          : []),
      ]
        .map(safe)
        .join(" ")
        .toLowerCase();

      return blob.includes(q);
    });

    render(filtered);
  }

  try {
    setText("#status", "Sincronizando logs...");

    data = await fetchJson(`${API}/matches.json`, { cache: "no-store" });

    setText(
      "#meta",
      `Log gerado em ${data.generatedAt || "?"} • Ref: ${data.matches?.length || 0} Records`,
    );

    setText("#status", "");
    hide("#matchStatus");

    render(data.matches || []);
  } catch (e) {
    setHtml(
      "#status",
      `<span style="color:var(--butterfly-red)">Erro tático:</span> ${escapeHtml(e?.message || String(e))}`,
    );
  }

  qEl.addEventListener("input", applyFilter);
})();
