/**
 * The slice of the chrome.* API that SEP+ uses, rebuilt on userscript-manager
 * storage (GM.getValue etc.) so the content script can run as a userscript.
 */

export type GMStorage = {
  getValue(key: string): Promise<unknown>;
  setValue(key: string, value: unknown): Promise<void>;
  deleteValue(key: string): Promise<void>;
  listValues(): Promise<string[]>;
};

/** The parts of BroadcastChannel the shim needs, so tests can fake it. */
export type Channel = {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
};

type StorageChange = { oldValue?: unknown; newValue?: unknown };
type Changes = Record<string, StorageChange>;
type ChangeListener = (changes: Changes, areaName: string) => void;

// Values are stored as JSON strings so every manager keeps them alike.
function encode(value: unknown): string {
  return JSON.stringify(value);
}

function decode(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return raw;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function createChromeShim(
  gm: GMStorage,
  channel: Channel | null,
  options: { version: string; urls: Record<string, string> },
) {
  const listeners = new Set<ChangeListener>();

  // chrome.storage runs a tab's calls in order; keep that for read-then-write.
  let tail: Promise<unknown> = Promise.resolve();
  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(task);
    tail = run.catch(() => undefined);
    return run;
  }

  async function read(key: string): Promise<unknown> {
    return decode(await gm.getValue(key));
  }

  function notify(changes: Changes): void {
    if (Object.keys(changes).length === 0) {
      return;
    }
    // chrome.storage fires onChanged asynchronously, in the writing tab too.
    setTimeout(() => {
      for (const listener of Array.from(listeners)) {
        listener(changes, 'local');
      }
    }, 0);
  }

  // Other tabs only learn which keys changed, then read them back.
  channel?.addEventListener('message', (event) => {
    const keys: unknown = (event.data as { keys?: unknown } | null)?.keys;
    if (!Array.isArray(keys)) {
      return;
    }
    void enqueue(async () => {
      const changes: Changes = {};
      for (const key of keys) {
        if (typeof key !== 'string') {
          continue;
        }
        const value = await read(key);
        changes[key] = value === undefined ? {} : { newValue: value };
      }
      notify(changes);
    });
  });

  function announce(changes: Changes): void {
    const keys = Object.keys(changes);
    if (keys.length > 0) {
      channel?.postMessage({ keys });
    }
  }

  const local = {
    get(
      keys?: string | string[] | Record<string, unknown> | null,
    ): Promise<Record<string, unknown>> {
      return enqueue(async () => {
        let names: string[];
        let result: Record<string, unknown> = {};
        if (keys == null) {
          names = await gm.listValues();
        } else if (typeof keys === 'string') {
          names = [keys];
        } else if (Array.isArray(keys)) {
          names = keys;
        } else {
          names = Object.keys(keys);
          result = { ...keys };
        }
        for (const name of names) {
          const value = await read(name);
          if (value !== undefined) {
            result[name] = value;
          }
        }
        return result;
      });
    },

    set(items: Record<string, unknown>): Promise<void> {
      return enqueue(async () => {
        const changes: Changes = {};
        for (const [key, value] of Object.entries(items)) {
          if (value === undefined) {
            continue;
          }
          const oldValue = await read(key);
          const encoded = encode(value);
          await gm.setValue(key, encoded);
          // A copy, as chrome.storage hands listeners.
          changes[key] = { newValue: decode(encoded) };
          if (oldValue !== undefined) {
            changes[key].oldValue = oldValue;
          }
        }
        notify(changes);
        announce(changes);
      });
    },

    remove(keys: string | string[]): Promise<void> {
      return enqueue(async () => {
        const changes: Changes = {};
        for (const key of typeof keys === 'string' ? [keys] : keys) {
          const oldValue = await read(key);
          if (oldValue === undefined) {
            continue;
          }
          await gm.deleteValue(key);
          changes[key] = { oldValue };
        }
        notify(changes);
        announce(changes);
      });
    },
  };

  return {
    storage: {
      local,
      onChanged: {
        addListener: (listener: ChangeListener) => void listeners.add(listener),
        removeListener: (listener: ChangeListener) => void listeners.delete(listener),
        hasListener: (listener: ChangeListener) => listeners.has(listener),
      },
    },
    runtime: {
      id: 'sep-plus-userscript',
      getURL: (path: string) => options.urls[path.replace(/^\//, '')] ?? path,
      getManifest: () => ({ manifest_version: 3, name: 'SEP+', version: options.version }),
      // Only the background page answered messages, and a userscript has none.
      // (Its one job was unblocking Font Awesome, which nothing blocks here.)
      sendMessage: (_message: unknown) => Promise.resolve(false),
    },
  };
}
