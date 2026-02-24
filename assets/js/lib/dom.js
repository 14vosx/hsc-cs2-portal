export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => {
    return (
      {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c] ?? c
    );
  });
}
