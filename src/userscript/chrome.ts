/**
 * The `chrome` object every SEP+ module sees in the userscript build:
 * vite.userscript.config.ts imports this in place of the extension global.
 */
import { version } from '../../package.json';
import { createChromeShim } from './chromeShim';
import publicSansRegular from '../../public/fonts/PublicSans-Regular.woff2?inline';
import publicSansMedium from '../../public/fonts/PublicSans-Medium.woff2?inline';
import publicSansBold from '../../public/fonts/PublicSans-Bold.woff2?inline';
import libreRegular from '../../public/fonts/LibreBaskerville-Regular.woff2?inline';
import libreItalic from '../../public/fonts/LibreBaskerville-Italic.woff2?inline';
import libreSemiBold from '../../public/fonts/LibreBaskerville-SemiBold.woff2?inline';
import libreSemiBoldItalic from '../../public/fonts/LibreBaskerville-SemiBoldItalic.woff2?inline';

declare const GM: {
  getValue(key: string): Promise<unknown>;
  setValue(key: string, value: unknown): Promise<void>;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
};

export const chromeShim = createChromeShim(
  GM,
  typeof BroadcastChannel === 'function' ? new BroadcastChannel('sep-plus-storage') : null,
  {
    version,
    urls: {
      'fonts/PublicSans-Regular.woff2': publicSansRegular,
      'fonts/PublicSans-Medium.woff2': publicSansMedium,
      'fonts/PublicSans-Bold.woff2': publicSansBold,
      'fonts/LibreBaskerville-Regular.woff2': libreRegular,
      'fonts/LibreBaskerville-Italic.woff2': libreItalic,
      'fonts/LibreBaskerville-SemiBold.woff2': libreSemiBold,
      'fonts/LibreBaskerville-SemiBoldItalic.woff2': libreSemiBoldItalic,
    },
  },
);
