export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];

  let formatted = parts[0];
  if (parts[1]) formatted += `.${parts[1]}`;
  if (parts[2]) formatted += `.${parts[2]}`;
  if (parts[3]) formatted += `/${parts[3]}`;
  if (parts[4]) formatted += `-${parts[4]}`;

  return formatted;
}

export function setByPath(target, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const parent = keys.reduce((current, key) => current[key], target);
  parent[lastKey] = value;
}

export function getByPath(target, path) {
  return path.split(".").reduce((current, key) => current?.[key], target);
}

export function formatBytes(bytes) {
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function uploadIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0 4 4m-4-4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 16.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

export function cloudIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M17.5 19H8a5 5 0 1 1 1.1-9.88A6 6 0 0 1 20.47 12.1 3.5 3.5 0 0 1 17.5 19Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M12 16V10m0 0 2.5 2.5M12 10l-2.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}
