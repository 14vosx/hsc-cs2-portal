export async function fetchJson(url, { cache = "no-store", timeoutMs = 8000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache,
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await safeText(res);
      throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
    }

    return await res.json();
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`Timeout após ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function safeText(res) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return "";
    const t = (await res.text())?.trim();
    // evita jogar HTML gigante no erro
    if (!t) return "";
    return t.length > 180 ? t.slice(0, 180) + "…" : t;
  } catch {
    return "";
  }
}
