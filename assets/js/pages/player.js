import { fetchJson } from "../lib/http.js";
import { escapeHtml } from "../lib/dom.js";
import { el } from "../lib/ui.js";
import { num } from "../lib/format.js";
/**
 * HSC - Dossier do Operador (migrado para pages/)
 * Mantém a lógica original, só padroniza o carregamento.
 */

function pct(v, digits = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return (n * 100).toFixed(digits) + "%";
}

function getSteamIdFromUrl() {
  const url = new URL(window.location.href);
  const q = url.searchParams.get("id");
  if (q) return q;

  const parts = url.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("player");
  if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
  return null;
}

function fmtAny(v) {
  return v === null || v === undefined ? "-" : String(v);
}

function setStatus(msg) {
  const status = el("#status");
  if (!status) return;

  if (msg) {
    status.textContent = msg;
    status.style.display = "block";
  } else {
    status.style.display = "none";
  }
}

/**
 * Gráficos de Círculo (Conic Gradient) para o topo do Dossier
 */
function addVisualStats(lt) {
  const container = el("#lifetime");
  if (!container) return;

  const visualRow = document.createElement("div");
  visualRow.className = "row";
  visualRow.style.gridColumn = "1 / -1";
  visualRow.style.marginBottom = "20px";

  // Normalização básica para os gráficos
  const adrPercent = Math.min((Number(lt.adr) / 130) * 100, 100);
  const winPercent = (Number(lt.winRate) || 0) * 100;
  const hsPercent = Number(lt.headshotPct) || 0;

  const stats = [
    { label: "Vitórias (WR)", val: winPercent, display: pct(lt.winRate) },
    { label: "Precisão (HS)", val: hsPercent, display: hsPercent.toFixed(1) + "%" },
    { label: "Dano (ADR)", val: adrPercent, display: Number(lt.adr || 0).toFixed(1) },
  ];

  stats.forEach((s) => {
    const div = document.createElement("div");
    div.className = "card-stat";
    div.innerHTML = `
      <div class="stat-circle" style="--percent: ${num(s.val)}" data-value="${escapeHtml(s.display)}"></div>
      <span class="stat-label">${escapeHtml(s.label)}</span>
    `;
    visualRow.appendChild(div);
  });

  container.appendChild(visualRow);
}

function addLifetimeCard(lines) {
  const container = el("#lifetime");
  if (!container) return;

  const wrapper = document.createElement("div");
  wrapper.style.display = "contents";

  for (const [k, v] of lines) {
    const statDiv = document.createElement("div");
    statDiv.className = "card-stat";
    statDiv.innerHTML = `
      <span class="stat-label">${escapeHtml(k)}</span>
      <span class="stat-value">${escapeHtml(fmtAny(v))}</span>
    `;
    wrapper.appendChild(statDiv);
  }

  container.appendChild(wrapper);
}

async function main() {
  const sid = getSteamIdFromUrl();
  if (!sid || !/^\d{15,25}$/.test(sid)) {
    setStatus("Acesso Negado: SteamID inválido.");
    return;
  }

  const API = window.HSC_CONFIG?.API_BASE ?? "/api/cs2/v2";
  const apiUrl = `${API}/player/${encodeURIComponent(sid)}.json`;

  setStatus("Sincronizando Dossier...");

  try {
    const data = await fetchJson(apiUrl, { cache: "no-store" });

    // Header do Player
    const header = el("#header");
    if (header) header.style.display = "flex";

    const pname = el("#pname");
    const psid = el("#psid");
    const pgen = el("#pgen");

    if (pname) pname.textContent = data.name || "OPERADOR DESCONHECIDO";
    if (psid) psid.textContent = `#${sid}`;
    if (pgen) pgen.textContent = data.generatedAt || "-";

    setStatus("");

    const lt = data.lifetime || {};

    // 1) gráficos
    addVisualStats(lt);

    // 2) cards
    addLifetimeCard([
      ["Matches", lt.matchesPlayed],
      ["Impact", lt.impactRating],
      ["Score", lt.score],
      ["Accuracy", pct(lt.accuracy)],
    ]);

    addLifetimeCard([
      ["KD Ratio", lt.kdRatio],
      ["Kills", lt.kills],
      ["Deaths", lt.deaths],
      ["Assists", lt.assists],
    ]);

    addLifetimeCard([
      ["1v1 Wins", lt.v1Wins],
      ["1v2 Wins", lt.v2Wins],
      ["Entry Win%", pct(lt.entryWinRate)],
      ["Multikills", `${fmtAny(lt.enemy3ks)} (3k) / ${fmtAny(lt.enemy4ks)} (4k)`],
    ]);

    // 3) tabela por mapas
    const byMapBody = document.querySelector("#byMapTable tbody");
    if (byMapBody) {
      byMapBody.innerHTML = "";
      (data.byMap || []).forEach((r) => {
        const wins = num(r.wins);
        const losses = num(r.losses);
        const wr = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight:700; color:var(--text-main)">${escapeHtml(fmtAny(r.mapname))}</td>
          <td class="muted">${escapeHtml(fmtAny(r.roundsPlayed))}</td>
          <td>
            <div class="bar-container"><div class="bar-fill" style="width:${wr}%"></div></div>
            <span class="muted" style="font-size:11px">${wins}W - ${losses}L</span>
          </td>
          <td>${escapeHtml(fmtAny(r.kdRatio))}</td>
          <td>${escapeHtml(fmtAny(r.adr))}</td>
          <td>${escapeHtml(fmtAny(r.headshotPct))}%</td>
          <td>${escapeHtml(pct(r.entryWinRate))}</td>
          <td>${escapeHtml(pct(r.accuracy))}</td>
        `;
        byMapBody.appendChild(tr);
      });
    }

    // 4) operações recentes
    const recentBody = document.querySelector("#recentTable tbody");
    if (recentBody) {
      recentBody.innerHTML = "";
      (data.recentMaps || []).forEach((r) => {
        const adr = num(r.rounds) > 0 ? num(r.damage) / num(r.rounds) : 0;
        const win = String(r.team || "") === String(r.winner || "");

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="muted" style="font-size:12px">${escapeHtml(fmtAny(r.start_time))}</td>
          <td style="text-transform:capitalize">${escapeHtml(fmtAny(r.mapname))}</td>
          <td class="score">${escapeHtml(fmtAny(r.team1_score))}-${escapeHtml(fmtAny(r.team2_score))}</td>
          <td class="${win ? "win" : "loss"}">${win ? "VITÓRIA" : "DERROTA"}</td>
          <td class="mono">${escapeHtml(fmtAny(r.kills))}/${escapeHtml(fmtAny(r.deaths))}/${escapeHtml(fmtAny(r.assists))}</td>
          <td>${adr.toFixed(1)}</td>
          <td style="font-weight:bold; color:var(--butterfly-red)">${escapeHtml(fmtAny(r.impactRating))}</td>
        `;
        recentBody.appendChild(tr);
      });
    }
  } catch (e) {
    console.error(e);
    setStatus(`Erro na extração de dados: ${e?.message || e}`);
  }
}

main();
