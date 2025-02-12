"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatelite = void 0;
const createStatelite = (initialState, options) => {
    let state = initialState;
    const listeners = [];
    // Store for client-side only
    let isClient = false;
    // Delay localStorage access until after the component is mounted in client-side
    if (typeof window !== 'undefined') {
        isClient = true; // Ensure we're on the client-side
    }
    // Function to get the current state
    const getState = () => state;
    // Function to set/update the state
    const setState = (updater) => {
        const nextState = typeof updater === 'function' ? updater(state) : updater;
        const previousState = Object.assign({}, state);
        state = Object.assign(Object.assign({}, state), nextState);
        listeners.forEach((listener) => listener(state));
        // Persist the state to localStorage (only on the client side)
        if (isClient && (options === null || options === void 0 ? void 0 : options.persistKey)) {
            if (JSON.stringify(previousState) !== JSON.stringify(state)) {
                localStorage.setItem(options.persistKey, JSON.stringify(state));
            }
        }
        // Remove the persisted state if it resets to initial state (on client side)
        if (isClient && JSON.stringify(state) === JSON.stringify(initialState) && (options === null || options === void 0 ? void 0 : options.persistKey)) {
            localStorage.removeItem(options.persistKey);
        }
    };
    // Subscribe to state changes
    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index !== -1)
                listeners.splice(index, 1);
        };
    };
    // Selector function for partial state updates
    const select = (selector) => selector(state);
    // Load persisted state from localStorage (client-side only)
    if (isClient && (options === null || options === void 0 ? void 0 : options.persistKey)) {
        const persistedState = localStorage.getItem(options.persistKey);
        if (persistedState) {
            state = Object.assign(Object.assign({}, state), JSON.parse(persistedState));
        }
    }
    return { getState, setState, subscribe, select };
};
exports.createStatelite = createStatelite;
