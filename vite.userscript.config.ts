import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { description, version } from './package.json';

// Builds the content script as one file for userscript managers
// (Userscripts for Safari, Tampermonkey, Violentmonkey).

const SHIM = fileURLToPath(new URL('./src/userscript/chrome.ts', import.meta.url));
const SHIM_DIR = fileURLToPath(new URL('./src/userscript/', import.meta.url));

// Set by .github/workflows/userscript.yml. A build number keeps @version
// rising with every published build; the base URL is where that build lives,
// so userscript managers can check it for updates.
const BUILD = process.env.USERSCRIPT_BUILD;
const UPDATE_BASE = process.env.USERSCRIPT_UPDATE_BASE;
const UPDATE_LINES = UPDATE_BASE
  ? `// @updateURL    ${UPDATE_BASE}/sep-plus.meta.js
// @downloadURL  ${UPDATE_BASE}/sep-plus.user.js
`
  : '';

const HEADER = `// ==UserScript==
// @name         SEP+
// @description  ${description}
// @version      ${BUILD ? `${version}.${BUILD}` : version}
// @author       Andrew Shen (userscript build of github.com/andrewshen/sep-plus)
// @homepageURL  https://github.com/andrewshen/sep-plus
${UPDATE_LINES}// @match        http://plato.stanford.edu/*
// @match        https://plato.stanford.edu/*
// @run-at       document-start
// @inject-into  content
// @noframes
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// ==/UserScript==
`;

/** Point every module's `chrome` at the shim instead of the extension API. */
function chromeShim(): Plugin {
  return {
    name: 'sep-plus-chrome-shim',
    enforce: 'pre',
    transform(code, id) {
      if (
        !/\.tsx?$/.test(id) ||
        !id.includes('/src/') ||
        id.startsWith(SHIM_DIR) ||
        !/\bchrome\./.test(code)
      ) {
        return null;
      }
      return {
        code: `import { chromeShim as chrome } from ${JSON.stringify(SHIM)};\n${code}`,
        map: null,
      };
    },
  };
}

/**
 * Add the metadata block; drop the CSS file (entry.ts inlines it). The block
 * alone also goes in sep-plus.meta.js, which update checks fetch instead of
 * the whole script.
 */
function userscriptFile(): Plugin {
  return {
    name: 'sep-plus-userscript-file',
    // After Vite's CSS plugin, which adds the CSS file in this same hook.
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk') {
          file.code = HEADER + file.code;
        } else if (name.endsWith('.css')) {
          delete bundle[name];
        }
      }
      this.emitFile({ type: 'asset', fileName: 'sep-plus.meta.js', source: HEADER });
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeShim(), userscriptFile()],
  // Library builds leave this for the consumer; React needs it set.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  publicDir: false,
  build: {
    outDir: 'dist/userscript',
    emptyOutDir: true,
    // Same reason as vite.config.ts: keep ::highlight() and :host-context().
    cssMinify: 'esbuild',
    lib: {
      entry: 'src/userscript/entry.ts',
      name: 'SEPPlus',
      formats: ['iife'],
      fileName: () => 'sep-plus.user.js',
    },
  },
});
