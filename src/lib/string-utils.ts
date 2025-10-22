/**
 * Utility functions for string operations
 */

/**
 * Get initials from a full name
 * @param name - Full name string
 * @returns String with initials (max 2 characters)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Check if a string includes another string ignoring accents
 * @param text - Text to search in
 * @param search - Text to search for
 * @returns Boolean indicating if text includes search
 */
export function includesIgnoreAccents(text: string, search: string): boolean {
  const normalize = (str: string) => 
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  
  return normalize(text).includes(normalize(search))
}