import { describe, expect, it } from 'vitest'

import { truncateText } from './text'

describe('truncateText', () => {
  it('keeps short text as is', () => {
    expect(truncateText('十个字以内', 10)).toBe('十个字以内')
  })

  it('truncates long text with ellipsis at max chars', () => {
    expect(truncateText('一二三四五六七八九十十一', 10)).toBe(
      '一二三四五六七八九十...'
    )
  })

  it('handles null and non-string values', () => {
    expect(truncateText(null, 10)).toBe('')
    expect(truncateText(undefined, 10)).toBe('')
  })
})
