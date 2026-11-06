import { describe, expect, it } from 'vitest';
import { createChromeShim, type GMStorage } from './chromeShim';

function fakeGM(): GMStorage & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
  return {
    store,
    getValue: async (key) => store.get(key),
    setValue: async (key, value) => void store.set(key, value),
    deleteValue: async (key) => void store.delete(key),
    listValues: async () => Array.from(store.keys()),
  };
}

const options = { version: '9.9.9', urls: { 'fonts/A.woff2': 'data:font/woff2;base64,AA' } };

function nextChange(shim: ReturnType<typeof createChromeShim>) {
  return new Promise<Record<string, { oldValue?: unknown; newValue?: unknown }>>((resolve) => {
    const listener = (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => {
      shim.storage.onChanged.removeListener(listener);
      resolve(changes);
    };
    shim.storage.onChanged.addListener(listener);
  });
}

describe('chrome shim storage', () => {
  it('round-trips values and supports every get() key form', async () => {
    const shim = createChromeShim(fakeGM(), null, options);
    await shim.storage.local.set({ theme: 'dark', notes: { a: [1, 2] } });

    expect(await shim.storage.local.get('theme')).toEqual({ theme: 'dark' });
    expect(await shim.storage.local.get(['theme', 'missing'])).toEqual({ theme: 'dark' });
    expect(await shim.storage.local.get({ missing: 'x', theme: 'light' })).toEqual({
      missing: 'x',
      theme: 'dark',
    });
    expect(await shim.storage.local.get(null)).toEqual({ theme: 'dark', notes: { a: [1, 2] } });
  });

  it('removes one or many keys', async () => {
    const shim = createChromeShim(fakeGM(), null, options);
    await shim.storage.local.set({ a: 1, b: 2, c: 3 });
    await shim.storage.local.remove('a');
    await shim.storage.local.remove(['b', 'never-set']);
    expect(await shim.storage.local.get(null)).toEqual({ c: 3 });
  });

  it('tells listeners in the writing tab about sets and removes', async () => {
    const shim = createChromeShim(fakeGM(), null, options);
    let changed = nextChange(shim);
    await shim.storage.local.set({ theme: 'dark' });
    expect(await changed).toEqual({ theme: { newValue: 'dark' } });

    changed = nextChange(shim);
    await shim.storage.local.set({ theme: 'light' });
    expect(await changed).toEqual({ theme: { oldValue: 'dark', newValue: 'light' } });

    changed = nextChange(shim);
    await shim.storage.local.remove('theme');
    expect(await changed).toEqual({ theme: { oldValue: 'light' } });
  });

  it('hands listeners a copy, not the object that was set', async () => {
    const shim = createChromeShim(fakeGM(), null, options);
    const value = { list: [1] };
    const changed = nextChange(shim);
    await shim.storage.local.set({ k: value });
    const change = (await changed).k;
    expect(change?.newValue).toEqual(value);
    expect(change?.newValue).not.toBe(value);
  });

  it('tells other tabs on the same channel, which read the new value back', async () => {
    const gm = fakeGM();
    const name = `sep-plus-test-${Math.random()}`;
    const writerChannel = new BroadcastChannel(name);
    const readerChannel = new BroadcastChannel(name);
    try {
      const writer = createChromeShim(gm, writerChannel, options);
      const reader = createChromeShim(gm, readerChannel, options);

      let changed = nextChange(reader);
      await writer.storage.local.set({ theme: 'dark' });
      expect(await changed).toEqual({ theme: { newValue: 'dark' } });

      changed = nextChange(reader);
      await writer.storage.local.remove('theme');
      expect(await changed).toEqual({ theme: {} });
    } finally {
      writerChannel.close();
      readerChannel.close();
    }
  });
});

describe('chrome shim runtime', () => {
  it('maps bundled files to data URLs and reports the version', async () => {
    const shim = createChromeShim(fakeGM(), null, options);
    expect(shim.runtime.getURL('fonts/A.woff2')).toBe('data:font/woff2;base64,AA');
    expect(shim.runtime.getURL('/fonts/A.woff2')).toBe('data:font/woff2;base64,AA');
    expect(shim.runtime.getManifest().version).toBe('9.9.9');
    expect(shim.runtime.id).toBeTruthy();
    expect(await shim.runtime.sendMessage({ type: 'anything' })).toBe(false);
  });
});
