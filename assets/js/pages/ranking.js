import { num, fmt } from "../lib/format.js";
import { escapeHtml } from "../lib/dom.js";
import { fetchJson } from "../lib/http.js";
import { el, setHtml, setText } from "../lib/ui.js";

(async () => {
  const API = window.HSC_CONFIG?.API_BASE ?? "/api/cs2/v2";

  const statusSel = "#status";
  const tbodySel = "#tbody";

  const tbody = el(tbodySel);

  async function safePlayerProfile(steamid64) {
    try {
      return await fetchJson(`${API}/player/${steamid64}.json`, {
        cache: "no-store",
      });
    } catch {
      return null;
    }
  }

  try {
    const data = await fetchJson(`${API}/ranking.json`, { cache: "no-store" });
    const players = (data.players || []).slice();

    players.sort((a, b) => {
      const s = num(b.score) - num(a.score);
      if (s) return s;
      const imp = num(b.impactRating) - num(a.impactRating);
      if (imp) return imp;
      const adr = num(b.adr) - num(a.adr);
      if (adr) return adr;
      return String(a.steamid64 || "").localeCompare(String(b.steamid64 || ""));
    });

    setHtml(
      statusSel,
      `Maps Finalizados: ${escapeHtml(data.mapsFinalizados)} • Sincronizado: ${escapeHtml(data.generatedAt)}`,
    );

    tbody.innerHTML = "";

    players.forEach((p, idx) => {
      const sid = String(p.steamid64 || "").trim();
      const rowId = `p_${sid}`;
      const playerLink = `/portal/cs2/player/${sid}`;
      const steamLink = `https://steamcommunity.com/profiles/${sid}`;
      const podiumClass = idx === 0 ? "podium-1" : idx === 1 ? "podium-2" : idx === 2 ? "podium-3" : "";

      tbody.insertAdjacentHTML(
        "beforeend",
        `
        <tr id="${escapeHtml(rowId)}" class="${podiumClass}" data-href="${escapeHtml(playerLink)}">
          <td><span class="rank-num">${idx + 1}</span></td>
          <td>
            <div class="rowname">
              <img class="avatar" alt="" style="visibility:hidden" />
              <div>
                <div>
                  <a href="${escapeHtml(playerLink)}" class="player-link">${escapeHtml(p.name || "Unknown")}</a>
                </div>

                <div class="muted player-sub">
                  <span class="pill">${escapeHtml(sid)}</span>
                  <a
                    href="${escapeHtml(steamLink)}"
                    target="_blank"
                    rel="noreferrer"
                    class="steam-link"
                    title="Abrir perfil na Steam"
                  >Steam ↗</a>
                </div>
              </div>
            </div>
          </td>
          <td class="right">${num(p.matchesPlayed)}</td>
          <td class="right" style="color:#4caf50; font-weight:600">${num(p.wins)}</td>
          <td class="right" style="color:#f44336; font-weight:600">${num(p.losses)}</td>
          <td class="right">${num(p.kills)}</td>
          <td class="right">${num(p.deaths)}</td>
          <td class="right">${fmt(p.kdRatio, 2)}</td>
          <td class="right">${fmt(p.headshotPct, 1)}%</td>
          <td class="right">${fmt(p.adr, 1)}</td>
          <td class="right">${fmt(p.impactRating, 3)}</td>
          <td class="right score">${fmt(p.score, 2)}</td>
        </tr>
        `,
      );

      // Linha inteira clicável (não intercepta clicks em links)
      const tr = document.getElementById(rowId);
      if (tr) {
        tr.style.cursor = "pointer";
        tr.addEventListener("click", () => {
          window.location.href = playerLink;
        });

        // Não deixar o click da linha "roubar" o click do link
        tr.querySelectorAll("a").forEach((a) => {
          a.addEventListener("click", (e) => e.stopPropagation());
        });
      }

      // async enrich: avatar (não bloqueia a página)
      safePlayerProfile(sid).then((sp) => {
        if (!sp) return;
        const tr2 = document.getElementById(rowId);
        if (!tr2) return;
        const img = tr2.querySelector("img.avatar");
        if (img && sp.avatarMedium) {
          img.src = sp.avatarMedium;
          img.style.visibility = "visible";
        }
      });
    });
  } catch (e) {
    setText(statusSel, `Erro: ${e}`);
  }
})();
