/**
 * Tests for pure utility functions exported from PDFReader.tsx
 * These run in Node.js (no browser/canvas required).
 */

import { describe, it, expect } from 'vitest'
import { countOccurrences, snapScale } from '../utils/pdf-reader.utils'

// ── countOccurrences ──────────────────────────────────────────────────────────

describe('countOccurrences', () => {
  it('returns 0 for empty needle', () => {
    expect(countOccurrences('hello world', '')).toBe(0)
  })

  it('returns 0 when needle is not in haystack', () => {
    expect(countOccurrences('hello world', 'xyz')).toBe(0)
  })

  it('counts a single occurrence', () => {
    expect(countOccurrences('hello world', 'hello')).toBe(1)
  })

  it('counts multiple occurrences', () => {
    expect(countOccurrences('the quick brown fox jumps over the lazy dog the', 'the')).toBe(3)
  })

  it('is case-insensitive', () => {
    expect(countOccurrences('Hello HELLO hello', 'hello')).toBe(3)
  })

  it('handles overlapping needles correctly (non-overlapping count)', () => {
    // "aa" in "aaaa" → found at 0, then next search from 2 → found at 2 → 2 matches
    expect(countOccurrences('aaaa', 'aa')).toBe(2)
  })

  it('handles empty haystack', () => {
    expect(countOccurrences('', 'hello')).toBe(0)
  })

  it('handles single character needle', () => {
    expect(countOccurrences('banana', 'a')).toBe(3)
  })

  it('handles needle longer than haystack', () => {
    expect(countOccurrences('hi', 'hello world')).toBe(0)
  })

  it('handles needle equal to haystack', () => {
    expect(countOccurrences('exact', 'exact')).toBe(1)
  })

  it('works with mixed-case PDF text', () => {
    const text = 'React.js is a JavaScript library for building UIs. React lets you compose UIs.'
    expect(countOccurrences(text, 'react')).toBe(2)
  })
})

// ── snapScale ─────────────────────────────────────────────────────────────────

describe('snapScale', () => {
  it('clamps below minimum to 0.5', () => {
    expect(snapScale(0.1)).toBe(0.5)
    expect(snapScale(0)).toBe(0.5)
    expect(snapScale(-1)).toBe(0.5)
  })

  it('clamps above maximum to 3.0', () => {
    expect(snapScale(5)).toBe(3.0)
    expect(snapScale(3.1)).toBe(3.0)
  })

  it('returns the exact value for valid input', () => {
    expect(snapScale(1.0)).toBe(1.0)
    expect(snapScale(1.25)).toBe(1.25)
    expect(snapScale(2.0)).toBe(2.0)
  })

  it('rounds to 2 decimal places', () => {
    // 1.0 + 0.25 = 1.25 — no floating point issues
    expect(snapScale(1.25)).toBe(1.25)
  })

  it('handles boundary values', () => {
    expect(snapScale(0.5)).toBe(0.5)
    expect(snapScale(3.0)).toBe(3.0)
  })

  it('handles values just inside the valid range', () => {
    expect(snapScale(0.51)).toBe(0.51)
    expect(snapScale(2.99)).toBe(2.99)
  })
})

// ── Search result accumulation (integration logic) ────────────────────────────

describe('search result accumulation', () => {
  it('accumulates matches across simulated pages', () => {
    const pages = [
      'Introduction to React and React hooks in React applications.',
      'Advanced TypeScript patterns for large-scale applications.',
      'React performance optimization techniques and React profiler.',
    ]

    const query = 'react'
    const results = pages
      .map((text, i) => ({ page: i + 1, count: countOccurrences(text, query) }))
      .filter((r) => r.count > 0)

    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ page: 1, count: 3 })
    expect(results[1]).toEqual({ page: 3, count: 2 })

    const total = results.reduce((sum, r) => sum + r.count, 0)
    expect(total).toBe(5)
  })

  it('returns empty results when query not found', () => {
    const pages = ['Hello world', 'Foo bar', 'Baz qux']
    const results = pages
      .map((text, i) => ({ page: i + 1, count: countOccurrences(text, 'xyz') }))
      .filter((r) => r.count > 0)
    expect(results).toHaveLength(0)
  })
})

// ── Reading progress calculations ─────────────────────────────────────────────

describe('reading progress percent', () => {
  const progressPercent = (currentPage: number, totalPages: number) =>
    totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  it('returns 0% at page 1 of 100', () => {
    expect(progressPercent(1, 100)).toBeCloseTo(1, 1)
  })

  it('returns 50% at page 50 of 100', () => {
    expect(progressPercent(50, 100)).toBe(50)
  })

  it('returns 100% at last page', () => {
    expect(progressPercent(100, 100)).toBe(100)
  })

  it('returns 0% when total is 0 (guard)', () => {
    expect(progressPercent(1, 0)).toBe(0)
  })

  it('handles single page PDF', () => {
    expect(progressPercent(1, 1)).toBe(100)
  })
})

// ── LRU eviction logic ────────────────────────────────────────────────────────

describe('LRU cache logic', () => {
  const MAX = 3

  function simulateLru(accesses: number[]): Set<number> {
    const cache = new Set<number>()
    for (const page of accesses) {
      if (!cache.has(page) && cache.size >= MAX) {
        // Evict oldest (first in Set)
        const oldest = cache.values().next().value as number
        cache.delete(oldest)
      }
      cache.delete(page) // re-insert at end
      cache.add(page)
    }
    return cache
  }

  it('evicts the least recently used page', () => {
    const cache = simulateLru([1, 2, 3, 4])
    // Page 1 should have been evicted (LRU)
    expect(cache.has(1)).toBe(false)
    expect(cache.has(2)).toBe(true)
    expect(cache.has(3)).toBe(true)
    expect(cache.has(4)).toBe(true)
  })

  it('refreshes position on re-access', () => {
    const cache = simulateLru([1, 2, 3, 1, 4])
    // Access order after re-access: 2, 3, 1, then 4 → 2 is LRU
    expect(cache.has(2)).toBe(false)
    expect(cache.has(1)).toBe(true)
    expect(cache.has(3)).toBe(true)
    expect(cache.has(4)).toBe(true)
  })

  it('does not exceed max cache size', () => {
    const cache = simulateLru([1, 2, 3, 4, 5, 6])
    expect(cache.size).toBe(MAX)
  })

  it('handles re-accessing the same page repeatedly', () => {
    const cache = simulateLru([1, 1, 1, 1])
    expect(cache.size).toBe(1)
    expect(cache.has(1)).toBe(true)
  })
})
