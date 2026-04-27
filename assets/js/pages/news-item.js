// /portal/cs2/news/item/item.js
const CFG = window.HSC_CONFIG ?? {};
const NEWS_API_BASE = CFG.NEWS_API_BASE ?? "https://auth-api.haxixesmokeclub.com";

const $title = document.getElementById("news-title");
const $meta = document.getElementById("news-meta");
const $state = document.getElementById("news-state");
const $content = document.getElementById("news-content");

function setState(text) {
  $state.textContent = text;
  $state.hidden = false;
  $content.hidden = true;
}

function showContent() {
  $state.hidden = true;
  $content.hidden = false;
}

function fmtDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function getSlug() {
  const url = new URL(window.location.href);
  return (url.searchParams.get("slug") || "").trim();
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function main() {
  const slug = getSlug();
  if (!slug) {
    $title.textContent = "News";
    setState("Slug não informado. Volte para a lista e abra uma notícia.");
    return;
  }

  try {
    setState("Carregando…");
    const data = await fetchJson(`${NEWS_API_BASE}/content/news/${encodeURIComponent(slug)}`);
    const item = data?.item;

    if (!item?.title) {
      $title.textContent = "News";
      setState("Notícia não encontrada ou não publicada.");
      return;
    }

    document.title = `HSC — ${item.title}`;
    $title.textContent = item.title;
    $meta.textContent = item.published_at ? `Publicado em ${fmtDate(item.published_at)}` : "";

    // content vem HTML do server (admin-controlled). Render direto.
    $content.innerHTML = item.content || "<p>(Sem conteúdo)</p>";

    showContent();
  } catch (err) {
    console.error("[news-item] load error:", err);
    $title.textContent = "News";
    setState("Falha ao carregar notícia. Tente novamente em instantes.");
  }
}

main();
