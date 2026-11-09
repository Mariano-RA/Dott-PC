/** Minúsculas, sin acentos y con espacios normalizados: para comparar nombres. */
export function normalizeText(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Texto libre del modelo: sin caracteres de control, espacios normalizados y largo acotado. */
export function cleanText(value: string, maxLength: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();
}
