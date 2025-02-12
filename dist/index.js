"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatelite = void 0;
const js_cookie_1 = __importDefault(require("js-cookie"));
const createStatelite = (initialState, options) => {
    let state = initialState;
    const listeners = [];
    // Store for client-side only
    let isClient = false;
    // Delay cookie access until after the component is mounted in client-side
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
        // Persist the state to cookies (only on the client side)
        if (isClient && (options === null || options === void 0 ? void 0 : options.persistKey)) {
            if (JSON.stringify(previousState) !== JSON.stringify(state)) {
                // Store state in cookies instead of localStorage
                js_cookie_1.default.set(options.persistKey, JSON.stringify(state), { expires: 7 });
            }
        }
        // Remove the persisted state if it resets to initial state (on client side)
        if (isClient && JSON.stringify(state) === JSON.stringify(initialState) && (options === null || options === void 0 ? void 0 : options.persistKey)) {
            js_cookie_1.default.remove(options.persistKey);
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
    // Load persisted state from cookies (client-side only)
    if (isClient && (options === null || options === void 0 ? void 0 : options.persistKey)) {
        const persistedState = js_cookie_1.default.get(options.persistKey);
        if (persistedState) {
            state = Object.assign(Object.assign({}, state), JSON.parse(persistedState));
        }
    }
    return { getState, setState, subscribe, select };
};
exports.createStatelite = createStatelite;
