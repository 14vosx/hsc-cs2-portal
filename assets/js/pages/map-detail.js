import { fetchJson } from "../lib/http.js";
import { escapeHtml } from "../lib/dom.js";
import { el, setText, setHtml, show, hide } from "../lib/ui.js";
import { fmt } from "../lib/format.js"; // opcional (a gente usa só pra fallback simples)

// Nota: seu format.js tem fmt(v,digits). Então NÃO vamos usar.
// Vou manter aqui sem importar format.js para evitar confusão.

(() => {
  const params = new URLSearchParams(location.search);
  const map = params.get("m");

  const CFG = window.HSC_CONFIG ?? {};
  const BASE = CFG.BASE_PATH ?? "/portal/cs2";
  const ASSETS = CFG.ASSETS_BASE ?? `${BASE}/assets/current`;
  const API_BASE = CFG.API_BASE ?? "/api/cs2/v2";

  const meta = el("#meta");
  const hero = el("#hero");

  const heroImg = el("#heroImg");
  const title = el("#title");
  const sub = el("#sub");
  const src = el("#src");

  const kpiMatches = el("#kpiMatches");
  const kpiRounds = el("#kpiRounds");
  const kpiAvgRounds = el("#kpiAvgRounds");
  const kpiLastPlayed = el("#kpiLastPlayed");

  const tbody = el("#tbody");
  const error = el("#error");

  function fmtDate(s) {
    if (!s) return "-";
    return String(s);
  }

  function safeFixed(n, digits = 1) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "-";
    return x.toFixed(digits);
  }

  function matchUrl(id) {
    return `/portal/cs2/matches/match.html?id=${encodeURIComponent(id)}`;
  }

  function setHeroImage(mapName) {
    const img = `${ASSETS}/img/maps/${encodeURIComponent(mapName)}.png`;
    const fallback = `${ASSETS}/img/maps/default.png`;

    heroImg.src = img;
    heroImg.onerror = () => {
      heroImg.onerror = null;
      heroImg.src = fallback;
    };
    heroImg.alt = mapName;
  }

  async function main() {
    hide("#error");

    if (!map) {
      setText("#meta", "Parâmetro ausente. Use ?m=de_mirage");
      setText("#title", "Mapa (parâmetro ausente)");
      setText("#sub", "Exemplo: ?m=de_mirage");
      setText("#src", "/api/cs2/v2/map/<map>.json");

      tbody.innerHTML = `<tr><td colspan="5" class="muted">Exemplo: <code>?m=de_mirage</code></td></tr>`;
      show("#hero", "flex");
      setHeroImage("default");
      return;
    }

    const API = `${API_BASE}/map/${encodeURIComponent(map)}.json`;
    setText("#src", API);

    // hero aparece mesmo se API falhar
    setText("#title", map);
    setText("#sub", "Carregando estatísticas…");
    setHeroImage(map);
    show("#hero", "flex");

    try {
      const data = await fetchJson(API, { cache: "no-store" });

      setText("#meta", `Atualizado: ${data.generatedAt || "-"} • arquivo: ${map}.json`);
      setText("#title", String(data.map || map));

      const lt = data.lifetime || {};
      const lastPlayed = fmtDate(lt.lastPlayed);

      setText("#sub", `Último jogo: ${lastPlayed}`);

      setText("#kpiMatches", String(Number(lt.matches ?? 0)));
      setText("#kpiRounds", String(Number(lt.rounds ?? 0)));
      setText("#kpiAvgRounds", String(safeFixed(lt.avgRoundsPerMatch, 1)));
      setText("#kpiLastPlayed", lastPlayed);

      const rec = Array.isArray(data.recentMatches) ? data.recentMatches : [];
      if (!rec.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="muted">Sem matches recentes para esse mapa.</td></tr>`;
        return;
      }

      tbody.innerHTML = rec
        .map((r) => {
          const endedAt = escapeHtml(fmtDate(r.endedAt));
          const mid = escapeHtml(r.matchid);
          const series = escapeHtml(r.seriesType || "-");
          const winner = escapeHtml(r.winner || "-");

          const t1 = r.team1 || {};
          const t2 = r.team2 || {};
          const ms = r.mapScore || {};

          const matchLine = `
            <div class="rowname">
              <a class="badge" href="${matchUrl(r.matchid)}">#${mid}</a>
              <span>${escapeHtml(t1.name || "team1")}</span>
              <strong>${Number(t1.score ?? 0)}</strong>
              <span>vs</span>
              <strong>${Number(t2.score ?? 0)}</strong>
              <span>${escapeHtml(t2.name || "team2")}</span>
            </div>
          `;

          const mapScore = `${Number(ms.team1 ?? 0)}-${Number(ms.team2 ?? 0)}`;

          return `
            <tr>
              <td>${endedAt}</td>
              <td>${matchLine}</td>
              <td class="right">${series}</td>
              <td class="right"><strong>${escapeHtml(mapScore)}</strong></td>
              <td>${winner}</td>
            </tr>
          `;
        })
        .join("");
    } catch (e) {
      show("#error");
      setText("#error", String(e?.message || e));
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Falha ao carregar.</td></tr>`;
    }
  }

  main();
})();
