/**
 * Pure utility functions for the PDF reader.
 * Kept in a separate module so they can be tested in Node.js without pdfjs-dist.
 */

/** Count non-overlapping case-insensitive occurrences of needle in haystack. */
export function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase()
  let count = 0
  let idx = 0
  while ((idx = h.indexOf(n, idx)) !== -1) {
    count++
    idx += n.length
  }
  return count
}

/** Clamp and round a raw zoom scale to the valid range [0.5, 3.0] at 2 decimal places. */
export function snapScale(raw: number): number {
  return Math.min(3.0, Math.max(0.5, Math.round(raw * 100) / 100))
}
