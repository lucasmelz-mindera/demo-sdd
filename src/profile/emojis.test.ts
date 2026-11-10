import { describe, expect, it } from 'vitest'
import { EMOJIS } from './emojis'

describe('EMOJIS', () => {
  it('has 12 unique, non-empty entries', () => {
    expect(EMOJIS).toHaveLength(12)
    expect(new Set(EMOJIS).size).toBe(12)
    for (const e of EMOJIS) expect(e.trim()).not.toBe('')
  })
})
