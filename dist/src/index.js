"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatelite = void 0;
// createStatelite implementation
const createStatelite = (initialState, options, middlewares = [] // Middleware sebagai parameter
) => {
    let state = initialState;
    const listeners = [];
    const getState = () => state;
    const setState = (updater) => {
        const nextState = typeof updater === "function" ? updater(state) : updater;
        const previousState = Object.assign({}, state);
        // Menjalankan middleware sebelum mengubah state
        middlewares.forEach(middleware => middleware(state, nextState, (newState) => {
            state = newState;
        }));
        state = Object.assign(Object.assign({}, state), nextState);
        listeners.forEach(listener => listener(state));
        // Persisting logic
        if (options === null || options === void 0 ? void 0 : options.persistKey) {
            if (JSON.stringify(previousState) !== JSON.stringify(state)) {
                localStorage.setItem(options.persistKey, JSON.stringify(state));
            }
        }
        if (JSON.stringify(state) === JSON.stringify(initialState) && (options === null || options === void 0 ? void 0 : options.persistKey)) {
            localStorage.removeItem(options.persistKey);
        }
    };
    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index !== -1)
                listeners.splice(index, 1);
        };
    };
    // Memastikan state dimuat dari localStorage jika persistKey ada
    if (options === null || options === void 0 ? void 0 : options.persistKey) {
        const persistedState = localStorage.getItem(options.persistKey);
        if (persistedState) {
            state = Object.assign(Object.assign({}, state), JSON.parse(persistedState));
        }
    }
    return { getState, setState, subscribe };
};
exports.createStatelite = createStatelite;
