"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistStore = exports.createWebStorage = void 0;
const isEnvelope = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const record = value;
    return 'state' in record && typeof record.version === 'number';
};
/**
 * Creates a lazy web-storage adapter. Merely importing this helper is SSR-safe;
 * storage is resolved only when an operation runs in a browser.
 */
const createWebStorage = (kind = 'localStorage') => {
    const resolveStorage = () => {
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
exports.createWebStorage = createWebStorage;
/**
 * Adds persistence to an existing store without coupling the core to a browser.
 */
const persistStore = (store, options) => {
    var _a, _b, _c, _d, _e;
    const version = (_a = options.version) !== null && _a !== void 0 ? _a : 0;
    const serialize = (_b = options.serialize) !== null && _b !== void 0 ? _b : JSON.stringify;
    const deserialize = (_c = options.deserialize) !== null && _c !== void 0 ? _c : JSON.parse;
    const partialize = (_d = options.partialize) !== null && _d !== void 0 ? _d : ((state) => state);
    const merge = (_e = options.merge) !== null && _e !== void 0 ? _e : ((persisted, current) => ({ ...current, ...persisted }));
    let hydrated = false;
    let hydrationPromise;
    let ignoreNextWrite = false;
    const reportError = (error) => {
        if (options.onError) {
            options.onError(error);
            return;
        }
        // Persistence is an enhancement; a storage failure should not break updates.
        if (typeof console !== 'undefined') {
            console.warn('[statelite/persist]', error);
        }
    };
    const writeState = async () => {
        var _a;
        try {
            const envelope = {
                state: partialize(store.getState()),
                version,
                ...(options.ttl === undefined
                    ? {}
                    : {
                        expiresAt: ((_a = options.now) !== null && _a !== void 0 ? _a : Date.now)() + options.ttl,
                    }),
            };
            await options.storage.setItem(options.key, serialize(envelope));
        }
        catch (error) {
            reportError(error);
        }
    };
    const unsubscribe = store.subscribe(() => {
        if (ignoreNextWrite)
            return;
        void writeState();
    });
    const rehydrate = () => {
        if (hydrationPromise)
            return hydrationPromise;
        hydrationPromise = (async () => {
            var _a;
            try {
                const rawValue = await options.storage.getItem(options.key);
                if (rawValue === null)
                    return;
                const decoded = deserialize(rawValue);
                const envelope = isEnvelope(decoded)
                    ? decoded
                    : { state: decoded, version: 0 };
                if (envelope.expiresAt !== undefined &&
                    envelope.expiresAt <= ((_a = options.now) !== null && _a !== void 0 ? _a : Date.now)()) {
                    await options.storage.removeItem(options.key);
                    return;
                }
                let persistedState = envelope.state;
                if (envelope.version !== version) {
                    if (!options.migrate) {
                        throw new Error(`Persisted state version ${envelope.version} cannot be loaded as version ${version} without a migrate function.`);
                    }
                    persistedState = await options.migrate(envelope.state, envelope.version);
                }
                ignoreNextWrite = true;
                store.setState(merge(persistedState, store.getState()), {
                    replace: true,
                    action: 'persist/rehydrate',
                });
            }
            catch (error) {
                reportError(error);
            }
            finally {
                ignoreNextWrite = false;
                hydrated = true;
            }
        })();
        return hydrationPromise;
    };
    const clear = async () => {
        try {
            await options.storage.removeItem(options.key);
        }
        catch (error) {
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
exports.persistStore = persistStore;
//# sourceMappingURL=persist.js.map