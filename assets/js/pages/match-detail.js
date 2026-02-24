import { fetchJson } from "../lib/http.js";
import { escapeHtml } from "../lib/dom.js";
import { el } from "../lib/ui.js";
import { num } from "../lib/format.js";

(() => {
  const API_BASE = window.HSC_CONFIG?.API_BASE ?? "/api/cs2/v2";

  const stateEl = el("#state");
  const contentEl = el("#content");

  function getId() {
    const params = new URLSearchParams(location.search);
    return (params.get("id") || "").trim();
  }

  function renderState(html) {
    stateEl.innerHTML = html;
  }

  function renderError(title, hint) {
    renderState(`
      <div class="card error">
        <div style="font-weight:900; margin-bottom:6px">${escapeHtml(title)}</div>
        <div class="muted">${escapeHtml(hint || "")}</div>
      </div>
    `);
    contentEl.style.display = "none";
  }

  function pillSoft(text) {
    return `<span class="pill-soft">${escapeHtml(text)}</span>`;
  }

  function pillScore(a, b) {
    return `<span class="pill-score">${num(a)}-${num(b)}</span>`;
  }

  function linkPlayer(steamid64, name) {
    const sid = String(steamid64 || "").trim();
    const label = escapeHtml(name || sid || "Unknown");
    if (!sid) return label;
    return `<a href="/portal/cs2/player/${encodeURIComponent(sid)}">${label}</a>`;
  }

  async function load(matchid) {
    // Endpoint canônico de detalhe (se existir)
    return await fetchJson(`${API_BASE}/match/${encodeURIComponent(matchid)}.json`, {
      cache: "no-store",
    });
  }

  function renderPlayersTable(teamName, players) {
    const rows = (players || []).map((p) => {
      const sid = p.steamid64;
      return `
        <tr>
          <td>${linkPlayer(sid, p.name)}</td>
          <td class="right">${num(p.kills)}</td>
          <td class="right">${num(p.deaths)}</td>
          <td class="right">${num(p.assists)}</td>
          <td class="right">${num(p.damage)}</td>
          <td class="right mono">${escapeHtml(String(sid || ""))}</td>
        </tr>
      `;
    }).join("");

    return `
      <div class="table-wrap" style="margin-top:10px">
        <div class="muted" style="margin: 8px 0 6px; font-weight:700">${escapeHtml(teamName)}</div>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th class="right">K</th>
              <th class="right">D</th>
              <th class="right">A</th>
              <th class="right">DMG</th>
              <th class="right">SteamID64</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="6" class="muted">Sem players.</td></tr>`}</tbody>
        </table>
      </div>
    `;
  }

  function render(data) {
    const match = data.match || data; // fallback (caso algum dia mude)
    const maps = Array.isArray(data.maps) ? data.maps : [];

    const matchid = match.matchid;
    const series = match.series_type || "-";
    const start = match.start_time || "-";
    const end = match.end_time || "-";
    const winner = (match.winner || "").trim() || "—";

    const t1Name = match.team1_name || "team1";
    const t2Name = match.team2_name || "team2";
    const t1Score = num(match.team1_score);
    const t2Score = num(match.team2_score);

    const bestOf = data.computed?.bestOf ?? "-";
    const mapsPlayed = data.computed?.mapsPlayed ?? maps.length;

    // HERO
    const hero = `
      <div class="hero">
        <div>
          <h1>${escapeHtml(t1Name)} vs ${escapeHtml(t2Name)}</h1>
          <div class="hero-subline muted">
            ${escapeHtml(`matchid ${matchid} : ${start} → ${end}`)}
            &nbsp;—&nbsp; ${pillSoft(series)}
            &nbsp;·&nbsp; ${pillScore(t1Score, t2Score)}
            <span class="muted"> • winner: <strong>${escapeHtml(winner)}</strong></span>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="label">Série</div>
              <div class="value">${escapeHtml(series)}</div>
            </div>
            <div class="kpi">
              <div class="label">Winner</div>
              <div class="value">${escapeHtml(winner)}</div>
            </div>
            <div class="kpi">
              <div class="label">Mapas</div>
              <div class="value">${escapeHtml(String(mapsPlayed))}</div>
            </div>
            <div class="kpi">
              <div class="label">Best Of</div>
              <div class="value">${escapeHtml(String(bestOf))}</div>
            </div>
          </div>
        </div>

        <div>
          <a class="hero-link" href="/portal/cs2/matches/">← voltar</a>
        </div>
      </div>
    `;

    // MAPS
    const mapsHtml = maps.length
      ? maps.map((mp) => {
          const mapname = mp.mapname || "-";
          const s1 = num(mp.team1_score);
          const s2 = num(mp.team2_score);
          const mw = (mp.winner || "").trim() || "—";
          const mapIndex = mp.mapnumber ?? 0;

          // times por mapa (shape real)
          const teams = Array.isArray(mp.teams) ? mp.teams : [];
          // garante ordem estável: team1 depois team2? (vamos manter conforme o JSON)
          const teamBlocks = teams.map((t) =>
            renderPlayersTable(t.team || "team", t.players || [])
          ).join("");

          return `
            <div class="card">
              <div class="row">
                <div>
                  <span class="map-name">${escapeHtml(mapname)}</span>
                  &nbsp;<span class="map-score">${s1}-${s2}</span>
                  &nbsp;<span class="map-index">map #${escapeHtml(String(mapIndex))}</span>
                </div>
                <div class="map-winner">winner <strong>${escapeHtml(mw)}</strong></div>
              </div>

              ${teamBlocks || `<div class="muted">Sem dados de players neste mapa.</div>`}
            </div>
          `;
        }).join("")
      : `<div class="card"><div class="muted">Sem mapas para este match.</div></div>`;

    // Render final
    renderState(""); // limpa estado
    contentEl.innerHTML = hero + mapsHtml;
    contentEl.style.display = "";
  }

  async function main() {
    const id = getId();
    if (!id) {
      renderError(
        "Parâmetro ausente",
        "Abra /portal/cs2/matches/ e clique em um match, ou use /matches/match.html?id=2"
      );
      return;
    }

    renderState(`<div class="card"><div class="muted">Carregando match #${escapeHtml(id)}…</div></div>`);
    contentEl.style.display = "none";

    try {
      const data = await load(id);
      render(data);
    } catch (e) {
      console.error(e);
      renderError("Falha ao carregar", e?.message || String(e));
    }
  }

  main();
})();
