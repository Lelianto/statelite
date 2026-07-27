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

For object or array slices, pass a custom equality function:

```ts
const shallowArrayEqual = <T>(left: T[], right: T[]) =>
  left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));

const unsubscribe = store.subscribe(
  (state) => state.visibleIds,
  (visibleIds) => renderRows(visibleIds),
  {
    equality: shallowArrayEqual,
    fireImmediately: true,
  }
);
```

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

### `createStatelite(initialState)`

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

### `setState` options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `replace` | `boolean` | `false` | Replace instead of shallow-merging state. |
| `action` | `string` | `undefined` | Label forwarded to subscribers and tooling. |

### Selector subscription options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `equality` | `(a, b) => boolean` | `Object.is` | Determines whether a slice changed. |
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
| `onError` | No | Handles storage and serialization failures. |

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
