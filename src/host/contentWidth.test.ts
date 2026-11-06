/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyContentWidth } from './contentWidth';

const PROPERTY = '--sep-plus-content-max-width';
const value = () => document.documentElement.style.getPropertyValue(PROPERTY);

afterEach(() => {
  document.documentElement.style.removeProperty(PROPERTY);
  vi.restoreAllMocks();
});

describe('applyContentWidth', () => {
  it('overrides the column width, and Standard falls back to the stylesheet', () => {
    applyContentWidth('narrow');
    expect(value()).toBe('500px');
    applyContentWidth('wider');
    expect(value()).toContain('840px');
    applyContentWidth('standard');
    expect(value()).toBe('');
  });

  it('fires one resize per real change so layout re-measures', () => {
    const resize = vi.fn();
    window.addEventListener('resize', resize);
    try {
      applyContentWidth('wide');
      applyContentWidth('wide');
      applyContentWidth('standard');
      applyContentWidth('standard');
      expect(resize).toHaveBeenCalledTimes(2);
    } finally {
      window.removeEventListener('resize', resize);
    }
  });
});
