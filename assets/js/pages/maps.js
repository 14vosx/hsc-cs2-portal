import { fetchJson } from "../lib/http.js";
import { escapeHtml } from "../lib/dom.js";
import { el, setText, setHtml, show, hide } from "../lib/ui.js";

(() => {
  const CFG = window.HSC_CONFIG ?? {};
  const API_BASE = CFG.API_BASE ?? "/api/cs2/v2";
  const BASE_PATH = CFG.BASE_PATH ?? "/portal/cs2";
  const ASSETS_BASE = CFG.ASSETS_BASE ?? `${BASE_PATH}/assets/current`;

  const API = `${API_BASE}/maps.json`;

  const tbody = el("#tbody");
  const meta = el("#meta");
  const error = el("#error");
  const tbl = el("#tbl");

  const q = el("#q");
  const sort = el("#sort");
  const dirBtn = el("#dir");
  const badges = el("#badges");

  let raw = [];
  let dir = "desc";
  let topMapName = null;

  function readStateFromUrl() {
    const u = new URL(window.location.href);
    const qs = u.searchParams;

    const qv = qs.get("q") || "";
    const sv = qs.get("sort") || "";
    const dv = qs.get("dir") || "";

    if (qv) q.value = qv;
    if (sv) sort.value = sv;
    if (dv === "asc" || dv === "desc") setDir(dv);
  }

  let urlTimer = null;
  function writeStateToUrl() {
    if (urlTimer) clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
      const u = new URL(window.location.href);
      const qs = u.searchParams;

      const qv = (q.value || "").trim();
      const sv = sort.value || "matches";

      if (qv) qs.set("q", qv);
      else qs.delete("q");

      if (sv) qs.set("sort", sv);
      else qs.delete("sort");

      qs.set("dir", dir);

      u.search = qs.toString();
      window.history.replaceState(null, "", u.toString());
    }, 120);
  }

  function fmtDate(s) {
    if (!s) return "-";
    return String(s);
  }

  function toTs(s) {
    if (!s) return 0;
    const iso = String(s).replace(" ", "T");
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : 0;
  }

  function getSortValue(m, key) {
    if (key === "lastPlayed") return toTs(m.lastPlayed);
    if (key === "map") return String(m.map || "");
    return Number(m[key] ?? 0);
  }

  function compare(a, b, key) {
    const va = getSortValue(a, key);
    const vb = getSortValue(b, key);

    if (typeof va === "string" || typeof vb === "string") {
      const r = String(va).localeCompare(String(vb));
      return dir === "asc" ? r : -r;
    }

    const r = va - vb;
    return dir === "asc" ? r : -r;
  }

  function setDir(next) {
    dir = next;
    dirBtn.textContent = dir === "asc" ? "↑" : "↓";
  }

  function render(list) {
    const maxMatches = Math.max(...raw.map((x) => Number(x.matches ?? 0)), 1);

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Nenhum resultado.</td></tr>`;
      return;
    }

    tbody.innerHTML = list
      .map((m) => {
        const mapName = String(m.map || "");
        const map = escapeHtml(mapName);
        const isTop = topMapName && mapName === topMapName;

        const url = `/portal/cs2/maps/map.html?m=${encodeURIComponent(mapName)}`;

        const matches = Number(m.matches ?? 0);
        const barPct = Math.round((matches / maxMatches) * 100);

        return `
          <tr class="${isTop ? "top-row" : ""}">
            <td><strong>${map}</strong></td>
            <td class="right">
              <div class="bar-wrap">
                <div class="bar-track">
                  <div class="bar" style="width:${barPct}%"></div>
                </div>
                <span class="bar-value">${matches}</span>
              </div>
            </td>
            <td class="right">${Number(m.rounds ?? 0)}</td>
            <td class="right">${Number(m.avgRoundsPerMatch ?? 0).toFixed(1)}</td>
            <td>${escapeHtml(fmtDate(m.lastPlayed))}</td>
            <td class="right">
              <div class="row-actions">
                <a href="${url}">ver detalhes →</a>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function apply() {
    const term = (q.value || "").trim().toLowerCase();
    const key = sort.value || "matches";

    let list = raw;

    if (term) {
      list = list.filter((m) =>
        String(m.map || "").toLowerCase().includes(term),
      );
    }

    list = [...list].sort((a, b) => compare(a, b, key));

    document.querySelectorAll("#tbl th").forEach((th) => {
      th.classList.remove("active-sort");
      if (th.dataset.key === key) th.classList.add("active-sort");
    });

    render(list);
  }

  function setupHero(top) {
    const hero = el("#hero");
    const heroImg = el("#heroImg");
    const heroTitle = el("#heroTitle");
    const heroSub = el("#heroSub");
    const heroRounds = el("#heroRounds");
    const heroMatches = el("#heroMatches");
    const heroLink = el("#heroLink");

    const mapName = String(top.map || "-");
    heroTitle.textContent = mapName;
    heroSub.textContent = `Último jogo: ${top.lastPlayed || "-"}`;

    heroRounds.textContent = String(top.rounds ?? 0);
    heroMatches.textContent = String(top.matches ?? 0);

    heroLink.href = `/portal/cs2/maps/map.html?m=${encodeURIComponent(mapName)}`;

    const img = `${ASSETS_BASE}/img/maps/${encodeURIComponent(mapName)}.png`;
    const fallback = `${ASSETS_BASE}/img/maps/default.png`;

    heroImg.src = img;
    heroImg.onerror = () => {
      heroImg.src = fallback;
    };
    heroImg.alt = mapName;

    show("#hero", "flex");
  }

  async function main() {
    try {
      hide("#error");
      tbl.classList.add("loading");

      const data = await fetchJson(API, { cache: "no-store" });
      const maps = Array.isArray(data.maps) ? data.maps : [];

      setText("#meta", `Atualizado: ${data.generatedAt || "-"} • Mapas: ${maps.length}`);

      if (!maps.length) {
        tbody.innerHTML =
          `<tr><td colspan="6" class="muted">Nenhum mapa encontrado (verifique filtros de end_time/winner/score).</td></tr>`;
        tbl.classList.remove("loading");
        return;
      }

      raw = maps;

      // HERO (top map)
      const top = [...raw].sort(
        (a, b) => Number(b.matches ?? 0) - Number(a.matches ?? 0),
      )[0];
      topMapName = top?.map || null;
      if (top) setupHero(top);

      // badges
      const mostPlayed = [...raw].sort(
        (a, b) => Number(b.matches ?? 0) - Number(a.matches ?? 0),
      )[0];
      const mostRecent = [...raw].sort(
        (a, b) => toTs(b.lastPlayed) - toTs(a.lastPlayed),
      )[0];

      const mp = mostPlayed ? escapeHtml(mostPlayed.map) : "-";
      const mr = mostRecent ? escapeHtml(mostRecent.map) : "-";
      setHtml(
        "#badges",
        `
        <span class="chips">
          <span class="chip">🏆 <span>Mais jogado:</span> <strong>${mp}</strong></span>
          <span class="chip">⏱ <span>Mais recente:</span> <strong>${mr}</strong></span>
        </span>
        `,
      );

      setDir("desc");
      sort.value = "matches";

      readStateFromUrl();
      apply();
      writeStateToUrl();

      q.addEventListener("input", () => {
        apply();
        writeStateToUrl();
      });
      sort.addEventListener("change", () => {
        apply();
        writeStateToUrl();
      });
      dirBtn.addEventListener("click", () => {
        setDir(dir === "asc" ? "desc" : "asc");
        apply();
        writeStateToUrl();
      });

      tbl.classList.remove("loading");
    } catch (e) {
      show("#error");
      setText("#error", String(e?.message || e));
      tbody.innerHTML = `<tr><td colspan="6" class="muted">Falha ao carregar.</td></tr>`;
      tbl.classList.remove("loading");
    }
  }

  main();
})();
