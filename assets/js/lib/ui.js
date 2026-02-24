export function el(selector) {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Elemento não encontrado: ${selector}`);
  return node;
}

export function setHtml(selector, html) {
  el(selector).innerHTML = html;
}

export function setText(selector, text) {
  el(selector).textContent = String(text ?? "");
}

export function show(selector, display = "") {
  el(selector).style.display = display;
}

export function hide(selector) {
  el(selector).style.display = "none";
}
