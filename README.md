# Statelite

[![CI](https://github.com/Lelianto/statelite/actions/workflows/main.yml/badge.svg)](https://github.com/Lelianto/statelite/actions/workflows/main.yml)
[![npm version](https://img.shields.io/npm/v/@antihero/statelite.svg)](https://www.npmjs.com/package/@antihero/statelite)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@antihero/statelite)](https://bundlephobia.com/package/@antihero/statelite)
[![license](https://img.shields.io/npm/l/@antihero/statelite.svg)](./LICENSE)

A tiny, type-safe, framework-agnostic state store for TypeScript and JavaScript.
Statelite provides reactive selectors and optional persistence without importing a
UI framework or browser API into its core.

```ts
import { createStatelite } from '@antihero/statelite';

const counter = createStatelite({ count: 0 });

counter.subscribe(
  (state) => state.count,
  (count) => console.log('Count:', count)
);

counter.setState((state) => ({ count: state.count + 1 }));
```

## Why Statelite?

- **Framework-agnostic** — use the same store with vanilla JavaScript, React, Vue,
  Svelte, Angular, Solid, server-side rendering, workers, and tests.
- **Tiny core** — no runtime dependencies.
- **Type-safe** — state, updater, selector, and listener types are inferred.
- **Reactive selectors** — subscribers only run when their selected value changes.
- **Predictable updates** — shallow merge, explicit replacement, reset, action
  labels, and previous-state snapshots.
- **Pluggable persistence** — local storage, session storage, IndexedDB, React
  Native storage, server storage, or an in-memory test adapter.
- **SSR-safe** — the core does not access `window`, `document`, cookies, or storage.

## Installation

```bash
npm install @antihero/statelite
```

Statelite requires Node.js 18 or newer for development and server-side usage.
The browser build uses standard ES2018 APIs.

## Quick start

```ts
import { createStatelite } from '@antihero/statelite';

interface CounterState {
  count: number;
  owner: string;
}

const counter = createStatelite<CounterState>({
  count: 0,
  owner: 'team',
});

const unsubscribe = counter.subscribe((state, previousState, action) => {
  console.log(action, previousState.count, '->', state.count);
});

counter.setState(
  (state) => ({ count: state.count + 1 }),
  { action: 'counter/increment' }
);

counter.getState(); // { count: 1, owner: 'team' }
counter.select((state) => state.count); // 1

counter.reset();
unsubscribe();
```

`setState` shallow-merges object updates by default:

```ts
counter.setState({ count: 10 });
```

Replace the entire state when required:

```ts
counter.setState(
  { count: 0, owner: 'new-owner' },
  { replace: true, action: 'counter/replace' }
);
```

## Reactive selectors

A selector subscription is only notified when its selected value changes according
to `Object.is`:

```ts
const unsubscribe = counter.subscribe(
  (state) => state.count,
  (count, previousCount, action) => {
    console.log({ count, previousCount, action });
  }
);
```

For object or array slices, use the built-in `shallowEqual` helper or pass a
custom equality function:

```ts
import { shallowEqual } from '@antihero/statelite';

const unsubscribe = store.subscribe(
  (state) => ({ page: state.page, filter: state.filter }),
  (selection) => renderRows(selection),
  {
    equalityFn: shallowEqual,
    fireImmediately: true,
  }
);
```

`equality` remains supported as an alias for backward compatibility.

## Middleware

Middleware can inspect, transform, or block a transaction before it is committed:

```ts
import { createStatelite, type StateMiddleware } from '@antihero/statelite';

const logger: StateMiddleware<{ count: number }> = (transaction, next) => {
  console.log(transaction.action, transaction.previousState, transaction.nextState);
  next();
};

const preventNegative: StateMiddleware<{ count: number }> = (
  transaction,
  next
) => {
  if (transaction.nextState.count >= 0) next(transaction);
};

const counter = createStatelite(
  { count: 0 },
  { middleware: [logger, preventNegative] }
);
```

Middleware runs in declaration order. Calling `next()` continues the pipeline;
not calling it blocks the update.

## Async actions

`createAsyncAction` provides lifecycle hooks, an `AbortSignal`, and protection
against stale requests. A newer call aborts the previous call by default:

```ts
import { createAsyncAction } from '@antihero/statelite';

const loadUser = createAsyncAction(
  userStore,
  async ({ signal }, userId: string) => {
    const response = await fetch(`/api/users/${userId}`, { signal });
    return response.json() as Promise<User>;
  },
  {
    onStart: (_args, store) => store.setState({ loading: true, error: null }),
    onSuccess: (user, _args, store) => store.setState({ user }),
    onError: (error, _args, store) => store.setState({ error }),
    onFinally: (_args, store) => store.setState({ loading: false }),
  }
);

await loadUser('42');
loadUser.abort();
```

Set `latest: false` to allow concurrent calls.

## Redux DevTools

Connect a store to the Redux DevTools browser extension:

```ts
import { connectDevtools } from '@antihero/statelite';

const devtools = connectDevtools(counter, { name: 'Counter' });

// Remove both subscriptions when the store is no longer needed.
devtools.disconnect();
```

The bridge is SSR-safe, does nothing when the extension is unavailable, forwards
action labels, and supports jump-to-state time travel.

## Persistence

Persistence is separate from the core and works with synchronous or asynchronous
storage:

```ts
import {
  createStatelite,
  createWebStorage,
  persistStore,
} from '@antihero/statelite';

const preferences = createStatelite({
  theme: 'light',
  sidebarOpen: true,
  sessionToken: '',
});

const persistence = persistStore(preferences, {
  key: 'app-preferences',
  storage: createWebStorage('localStorage'),
  version: 1,
  ttl: 1000 * 60 * 60 * 24,
  partialize: (state) => ({
    theme: state.theme,
    sidebarOpen: state.sidebarOpen,
  }),
  onError: (error) => {
    console.error('Could not persist preferences', error);
  },
});

await persistence.rehydrate();
```

Available controller methods:

```ts
await persistence.rehydrate();
await persistence.clear();
persistence.hasHydrated();
persistence.unsubscribe();
```

### Migrations

Increment `version` whenever the persisted shape changes:

```ts
const persistence = persistStore(store, {
  key: 'settings',
  storage: createWebStorage(),
  version: 2,
  migrate: (persistedState, persistedVersion) => {
    if (persistedVersion === 1) {
      const oldState = persistedState as { darkMode: boolean };
      return { theme: oldState.darkMode ? 'dark' : 'light' };
    }

    return persistedState as { theme: string };
  },
});
```

When `ttl` is set, expired state is removed during hydration and the store keeps
its current initial state.

### Custom or asynchronous storage

```ts
import type { StorageAdapter } from '@antihero/statelite';

const storage: StorageAdapter = {
  getItem: async (key) => database.read(key),
  setItem: async (key, value) => database.write(key, value),
  removeItem: async (key) => database.remove(key),
};
```

## Framework integration

Statelite implements an external-store contract: read a snapshot with `getState`
and listen for changes with `subscribe`.

### React

```tsx
import { useSyncExternalStore } from 'react';

function useCounter() {
  return useSyncExternalStore(
    counter.subscribe,
    counter.getState,
    counter.getInitialState
  );
}

function Counter() {
  const state = useCounter();

  return (
    <button onClick={() => counter.setState((s) => ({ count: s.count + 1 }))}>
      Count: {state.count}
    </button>
  );
}
```

### Vue

```ts
import { onScopeDispose, shallowRef } from 'vue';

export function useStatelite<T extends object>(store: StateliteStore<T>) {
  const state = shallowRef(store.getState());
  const unsubscribe = store.subscribe((nextState) => {
    state.value = nextState;
  });

  onScopeDispose(unsubscribe);
  return state;
}
```

### Svelte

```ts
const svelteCounter = {
  subscribe(run: (state: Readonly<CounterState>) => void) {
    run(counter.getState());
    return counter.subscribe((state) => run(state));
  },
};
```

Angular, Solid, Preact, Lit, and other reactive systems can use the same
`getState`/`subscribe` bridge.

## SSR

Create a fresh store for every server request. Do not share a mutable singleton
between users:

```ts
export const createRequestStore = (initialCount = 0) =>
  createStatelite({ count: initialCount });
```

`createWebStorage` is lazy and safe to import on the server, but its methods must
only be called in a browser. Set `autoHydrate: false` when hydration timing is
controlled by your framework.

## API reference

### `createStatelite(initialState, options?)`

Creates a store and returns:

| Method | Description |
| --- | --- |
| `getState()` | Returns the current readonly state snapshot. |
| `getInitialState()` | Returns the initial readonly snapshot. |
| `setState(update, options?)` | Updates or replaces state. |
| `reset(action?)` | Restores the initial state. |
| `subscribe(listener)` | Subscribes to every effective state change. |
| `subscribe(selector, listener, options?)` | Subscribes to a selected slice. |
| `select(selector)` | Reads a derived value without subscribing. |
| `destroy()` | Removes listeners and prevents future updates. |

`options.middleware` accepts an ordered array of `StateMiddleware` functions.

### `setState` options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `replace` | `boolean` | `false` | Replace instead of shallow-merging state. |
| `action` | `string` | `undefined` | Label forwarded to subscribers and tooling. |

### Selector subscription options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `equalityFn` | `(a, b) => boolean` | `Object.is` | Determines whether a slice changed. |
| `equality` | `(a, b) => boolean` | `Object.is` | Backward-compatible alias for `equalityFn`. |
| `fireImmediately` | `boolean` | `false` | Runs the listener during subscription. |

### `persistStore(store, options)`

| Option | Required | Description |
| --- | --- | --- |
| `key` | Yes | Storage key. |
| `storage` | Yes | Sync or async storage adapter. |
| `version` | No | Persisted schema version; defaults to `0`. |
| `partialize` | No | Selects which state fields are persisted. |
| `migrate` | No | Converts older persisted versions. |
| `merge` | No | Combines persisted and current state. |
| `serialize` / `deserialize` | No | Custom payload encoding. |
| `autoHydrate` | No | Automatically starts hydration; defaults to `true`. |
| `ttl` | No | Number of milliseconds before persisted data expires. |
| `onError` | No | Handles storage and serialization failures. |

### Additional helpers

| Helper | Description |
| --- | --- |
| `shallowEqual(a, b)` | Shallow equality helper for selector subscriptions. |
| `createAsyncAction(store, handler, options?)` | Creates an abortable async action with lifecycle hooks. |
| `connectDevtools(store, options?)` | Connects a store to Redux DevTools. |

## Migration from 1.x

Version 2 removes the direct `js-cookie` dependency and the
`createStatelite(initialState, { persistKey })` option.

```ts
// 1.x
createStatelite(initialState, { persistKey: 'settings' });

// 2.x
const store = createStatelite(initialState);
persistStore(store, {
  key: 'settings',
  storage: createWebStorage('localStorage'),
});
```

Cookie persistence can still be implemented with a custom `StorageAdapter`.

## Development

```bash
npm ci
npm test
npm run build
npm pack --dry-run
```

Architecture notes and the longer roadmap are available in
[ANALYSIS.md](https://github.com/Lelianto/statelite/blob/main/ANALYSIS.md).

## Publishing

Releases are published to npm from GitHub Actions using npm Trusted Publishing:

1. Configure `@antihero/statelite` on npm with a GitHub Actions trusted publisher:
   owner `Lelianto`, repository `statelite`, workflow `publish.yml`.
2. Update the version in `package.json` and `package-lock.json`.
3. Merge the release commit into `main`.
4. Create a GitHub Release with a matching tag, for example `v2.0.0`.
5. The workflow validates the tag, runs tests and build, checks the tarball, then
   publishes the public package.

No long-lived `NPM_TOKEN` is required.

## License

[MIT](./LICENSE)

---

## 🚀 More TypeScript Projects

If you find this package useful, you may also like these open-source projects.

| Project | Description |
|---------|-------------|
| **💰 Monify** | Lightweight currency formatting library with multi-currency support. |
| **🤖 AgentifAI** | Vendor-neutral AI agent event model and debugging toolkit. |
| **⚡ Statelite** | Lightweight reactive state management for TypeScript. |
| **🗄️ Nano Cache** | Universal cache abstraction for memory, Redis, IndexedDB, and more. |
| **🔌 PlugnPlay** | Bootstrap cloud backends with minimal configuration. |
| **🎨 Sagara UI** | Utility-first CSS framework optimized for AI-assisted development. |

### Explore the ecosystem

- 💰 Monify → https://github.com/Lelianto/monify
- 🤖 AgentifAI → https://github.com/Lelianto/agentifai
- ⚡ Statelite → https://github.com/Lelianto/statelite
- 🗄️ Nano Cache → https://github.com/Lelianto/nano-cache
- 🔌 PlugnPlay → https://github.com/Lelianto/plugnplay
- 🎨 Sagara UI → https://github.com/Lelianto/sagaraui

⭐ If you enjoy this project, consider giving it a star. It helps others discover the ecosystem.
