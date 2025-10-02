export function uid(len = 16) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}