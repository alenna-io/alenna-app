/**
 * Normalize a string by removing accents/diacritics
 * á => a, é => e, ñ => n, etc.
 */
export function normalizeString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/**
 * Check if a string contains another string (accent-insensitive)
 */
export function includesIgnoreAccents(text: string, search: string): boolean {
  return normalizeString(text).includes(normalizeString(search))
}

