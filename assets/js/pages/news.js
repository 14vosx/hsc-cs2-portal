// /portal/cs2/news/news.js
const CFG = window.HSC_CONFIG ?? {};
const NEWS_API_BASE = CFG.NEWS_API_BASE ?? "https://auth-api.haxixesmokeclub.com";
const BASE_PATH = CFG.BASE_PATH ?? "/portal/cs2";

const $state = document.getElementById("news-state");
const $list = document.getElementById("news-list");

function setState(text) {
  $state.textContent = text;
  $state.hidden = false;
  $list.hidden = true;
}

function showList() {
  $state.hidden = true;
  $list.hidden = false;
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function renderItems(items) {
  const html = items.map((it) => {
    const slug = encodeURIComponent(it.slug);
    const href = `${BASE_PATH}/news/item/?slug=${slug}`;;
    const title = escapeHtml(it.title);
    const excerpt = escapeHtml(it.excerpt ?? "");
    const date = fmtDate(it.published_at);

    return `
      <a class="news-item" href="${href}">
        <div class="top">
          <h2>${title}</h2>
          <span class="date">${escapeHtml(date)}</span>
        </div>
        ${excerpt ? `<p class="excerpt">${excerpt}</p>` : ``}
      </a>
    `.trim();
  }).join("\n");

  $list.innerHTML = html;
}

async function main() {
  try {
    setState("Carregando…");
    const data = await fetchJson(`${NEWS_API_BASE}/content/news`);

    const items = Array.isArray(data?.items) ? data.items : [];
    if (!items.length) {
      setState("Nenhuma notícia publicada ainda.");
      return;
    }

    renderItems(items);
    showList();
  } catch (err) {
    console.error("[news] load error:", err);
    setState("Falha ao carregar notícias. Tente novamente em instantes.");
  }
}

main();
