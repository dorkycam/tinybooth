import { describe, expect, it } from 'vitest';
import { TABLET_BREAKPOINT, classifyDimensions } from '../src/lib/layoutClass';

describe('classifyDimensions', () => {
  it('returns phone for typical iPhone portrait dimensions', () => {
    const result = classifyDimensions(390, 844);
    expect(result.layoutClass).toBe('phone');
    expect(result.orientation).toBe('portrait');
  });

  it('returns tablet for typical iPad portrait dimensions', () => {
    const result = classifyDimensions(820, 1180);
    expect(result.layoutClass).toBe('tablet');
    expect(result.orientation).toBe('portrait');
  });

  it('returns tablet in landscape when both dimensions exceed the breakpoint', () => {
    const result = classifyDimensions(1180, 820);
    expect(result.layoutClass).toBe('tablet');
    expect(result.orientation).toBe('landscape');
  });

  it('uses the short edge to classify', () => {
    // A phone in landscape: long edge above the breakpoint, short edge below.
    const result = classifyDimensions(844, 390);
    expect(result.layoutClass).toBe('phone');
    expect(result.orientation).toBe('landscape');
  });

  it('treats exactly the breakpoint as tablet', () => {
    const result = classifyDimensions(TABLET_BREAKPOINT, TABLET_BREAKPOINT);
    expect(result.layoutClass).toBe('tablet');
  });

  it('classifies tablet portrait as the stacked presentation', () => {
    const result = classifyDimensions(820, 1180);
    expect(result.presentation).toBe('stacked');
  });

  it('classifies tablet landscape as the wide presentation', () => {
    const result = classifyDimensions(1180, 820);
    expect(result.presentation).toBe('wide');
  });

  it('classifies phone portrait as the stacked presentation', () => {
    const result = classifyDimensions(390, 844);
    expect(result.presentation).toBe('stacked');
  });

  it('classifies phone landscape as the stacked presentation', () => {
    const result = classifyDimensions(844, 390);
    expect(result.presentation).toBe('stacked');
  });

  it('classifies a tablet at the portrait breakpoint as stacked', () => {
    // Short edge exactly at the breakpoint, taller than wide -> tablet portrait,
    // which is stacked (wide requires a landscape tablet).
    const result = classifyDimensions(TABLET_BREAKPOINT, 1180);
    expect(result.layoutClass).toBe('tablet');
    expect(result.orientation).toBe('portrait');
    expect(result.presentation).toBe('stacked');
  });
});
