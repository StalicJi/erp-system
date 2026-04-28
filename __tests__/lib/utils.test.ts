import { cn } from '@/lib/utils'

describe('cn', () => {
  // --- Basic merging ---
  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('joins multiple class names with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  // --- Conditional classes (clsx behaviour) ---
  it('includes truthy conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('excludes falsy conditional classes', () => {
    expect(cn('base', false && 'hidden')).toBe('base')
  })

  it('excludes undefined and null values', () => {
    expect(cn('base', undefined, null)).toBe('base')
  })

  it('handles object syntax for conditional classes', () => {
    expect(cn({ active: true, disabled: false })).toBe('active')
  })

  it('handles array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  // --- Tailwind conflict resolution (tailwind-merge behaviour) ---
  it('resolves conflicting Tailwind padding classes — last one wins', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })

  it('resolves conflicting Tailwind text-color classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('resolves conflicting Tailwind background classes', () => {
    expect(cn('bg-gray-100', 'bg-white')).toBe('bg-white')
  })

  it('keeps non-conflicting Tailwind classes together', () => {
    const result = cn('flex', 'items-center', 'p-4')
    expect(result).toBe('flex items-center p-4')
  })

  it('handles mixed conditional and Tailwind-merge usage', () => {
    const isLarge = true
    const result = cn('p-2', isLarge && 'p-6', 'text-sm')
    expect(result).toBe('p-6 text-sm')
  })
})
