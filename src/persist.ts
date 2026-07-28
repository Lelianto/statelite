import type { StateliteStore } from './index';

export interface StorageAdapter {
	getItem(key: string): string | null | Promise<string | null>;
	setItem(key: string, value: string): void | Promise<void>;
	removeItem(key: string): void | Promise<void>;
}

export type WebStorageKind = 'localStorage' | 'sessionStorage';

export interface PersistOptions<T extends object, P = Partial<T>> {
	key: string;
	storage: StorageAdapter;
	version?: number;
	partialize?: (state: Readonly<T>) => P;
	migrate?: (persistedState: unknown, version: number) => P | Promise<P>;
	merge?: (persistedState: P, currentState: Readonly<T>) => T;
	serialize?: (value: unknown) => string;
	deserialize?: (value: string) => unknown;
	autoHydrate?: boolean;
	/** Duration in milliseconds before persisted state expires. */
	ttl?: number;
	now?: () => number;
	onError?: (error: unknown) => void;
}

export interface PersistController {
	rehydrate(): Promise<void>;
	clear(): Promise<void>;
	hasHydrated(): boolean;
	unsubscribe(): void;
}

interface PersistedEnvelope {
	state: unknown;
	version: number;
	expiresAt?: number;
}

const isEnvelope = (value: unknown): value is PersistedEnvelope => {
	if (!value || typeof value !== 'object') return false;
	const record = value as Record<string, unknown>;
	return 'state' in record && typeof record.version === 'number';
};

/**
 * Creates a lazy web-storage adapter. Merely importing this helper is SSR-safe;
 * storage is resolved only when an operation runs in a browser.
 */
export const createWebStorage = (
	kind: WebStorageKind = 'localStorage'
): StorageAdapter => {
	const resolveStorage = (): Storage => {
		if (typeof window === 'undefined' || !window[kind]) {
			throw new Error(`${kind} is not available in this runtime.`);
		}
		return window[kind];
	};

	return {
		getItem: (key) => resolveStorage().getItem(key),
		setItem: (key, value) => resolveStorage().setItem(key, value),
		removeItem: (key) => resolveStorage().removeItem(key),
	};
};

/**
 * Adds persistence to an existing store without coupling the core to a browser.
 */
export const persistStore = <T extends object, P = Partial<T>>(
	store: StateliteStore<T>,
	options: PersistOptions<T, P>
): PersistController => {
	const version = options.version ?? 0;
	const serialize = options.serialize ?? JSON.stringify;
	const deserialize = options.deserialize ?? JSON.parse;
	const partialize =
		options.partialize ?? ((state: Readonly<T>) => state as unknown as P);
	const merge =
		options.merge ??
		((persisted: P, current: Readonly<T>) =>
			({ ...current, ...(persisted as object) }) as T);

	let hydrated = false;
	let hydrationPromise: Promise<void> | undefined;
	let ignoreNextWrite = false;

	const reportError = (error: unknown): void => {
		if (options.onError) {
			options.onError(error);
			return;
		}
		// Persistence is an enhancement; a storage failure should not break updates.
		if (typeof console !== 'undefined') {
			console.warn('[statelite/persist]', error);
		}
	};

	const writeState = async (): Promise<void> => {
		try {
			const envelope: PersistedEnvelope = {
				state: partialize(store.getState()),
				version,
				...(options.ttl === undefined
					? {}
					: {
							expiresAt:
								(options.now ?? Date.now)() + options.ttl,
						}),
			};
			await options.storage.setItem(options.key, serialize(envelope));
		} catch (error) {
			reportError(error);
		}
	};

	const unsubscribe = store.subscribe(() => {
		if (ignoreNextWrite) return;
		void writeState();
	});

	const rehydrate = (): Promise<void> => {
		if (hydrationPromise) return hydrationPromise;

		hydrationPromise = (async () => {
			try {
				const rawValue = await options.storage.getItem(options.key);
				if (rawValue === null) return;

				const decoded = deserialize(rawValue);
				const envelope: PersistedEnvelope = isEnvelope(decoded)
					? decoded
					: { state: decoded, version: 0 };
				if (
					envelope.expiresAt !== undefined &&
					envelope.expiresAt <= (options.now ?? Date.now)()
				) {
					await options.storage.removeItem(options.key);
					return;
				}
				let persistedState = envelope.state as P;

				if (envelope.version !== version) {
					if (!options.migrate) {
						throw new Error(
							`Persisted state version ${envelope.version} cannot be loaded as version ${version} without a migrate function.`
						);
					}
					persistedState = await options.migrate(
						envelope.state,
						envelope.version
					);
				}

				ignoreNextWrite = true;
				store.setState(merge(persistedState, store.getState()), {
					replace: true,
					action: 'persist/rehydrate',
				});
			} catch (error) {
				reportError(error);
			} finally {
				ignoreNextWrite = false;
				hydrated = true;
			}
		})();

		return hydrationPromise;
	};

	const clear = async (): Promise<void> => {
		try {
			await options.storage.removeItem(options.key);
		} catch (error) {
			reportError(error);
		}
	};

	if (options.autoHydrate !== false) {
		void rehydrate();
	}

	return {
		rehydrate,
		clear,
		hasHydrated: () => hydrated,
		unsubscribe,
	};
};
