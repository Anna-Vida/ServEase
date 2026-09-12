import { describe, expect, it } from 'vitest'
import { formatServicePrice, isBookableService } from './booking'

describe('booking utilities', () => {
  it('formats service prices in Philippine peso format', () => {
    expect(formatServicePrice(1000)).toContain('1,000.00')
  })

  it('allows active services to be booked', () => {
    expect(isBookableService(true)).toBe(true)
  })

  it('prevents inactive services from being booked', () => {
    expect(isBookableService(false)).toBe(false)
  })
})
