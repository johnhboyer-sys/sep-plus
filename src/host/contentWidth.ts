import type { ContentWidth } from '../lib/types';

export const CONTENT_WIDTH_OPTIONS: ReadonlyArray<{
  value: ContentWidth;
  label: string;
}> = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'standard', label: 'Standard' },
  { value: 'wide', label: 'Wide' },
  { value: 'wider', label: 'Wider' },
];

const PROPERTY = '--sep-plus-content-max-width';

// Wide columns give way to the window so they stay clear of the outline rail
// (108px from the left edge, plus a gap; mirrored on the right), but never get
// narrower than Standard. 'standard' leaves the 585px in host/styles.css.
const VALUES: Record<Exclude<ContentWidth, 'standard'>, string> = {
  narrow: '500px',
  wide: 'min(700px, max(585px, 100vw - 248px))',
  wider: 'min(840px, max(585px, 100vw - 248px))',
};

export function applyContentWidth(width: ContentWidth): void {
  const style = document.documentElement.style;
  const current = style.getPropertyValue(PROPERTY);
  const next = width === 'standard' ? '' : VALUES[width];
  if (current === next) {
    return;
  }
  if (next) {
    style.setProperty(PROPERTY, next);
  } else {
    style.removeProperty(PROPERTY);
  }
  // The outline, footnotes and highlights re-measure on resize.
  window.dispatchEvent(new Event('resize'));
}
