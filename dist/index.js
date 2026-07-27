"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistStore = exports.createWebStorage = exports.createStatelite = void 0;
const shallowEqual = (left, right) => {
    if (Object.is(left, right))
        return true;
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length)
        return false;
    return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) &&
        Object.is(left[key], right[key]));
};
const cloneState = (state) => {
    if (Array.isArray(state))
        return [...state];
    return { ...state };
};
/**
 * Creates a small external store that is independent from UI frameworks and
 * browser APIs.
 */
const createStatelite = (initialState) => {
    const initialSnapshot = cloneState(initialState);
    let state = cloneState(initialState);
    let destroyed = false;
    const listeners = new Set();
    const getState = () => state;
    const getInitialState = () => initialSnapshot;
    const setState = (update, options = {}) => {
        if (destroyed)
            return;
        const resolvedOptions = typeof options === 'boolean' ? { replace: options } : options;
        const previousState = state;
        const nextValue = typeof update === 'function'
            ? update(previousState)
            : update;
        const shouldReplace = resolvedOptions.replace === true || Array.isArray(previousState);
        const nextState = (shouldReplace
            ? nextValue
            : { ...previousState, ...nextValue });
        if (Object.is(previousState, nextState) ||
            (!Array.isArray(nextState) && shallowEqual(previousState, nextState))) {
            return;
        }
        state = nextState;
        for (const listener of Array.from(listeners)) {
            listener(state, previousState, resolvedOptions.action);
        }
    };
    const reset = (action = 'reset') => {
        setState(cloneState(initialSnapshot), { replace: true, action });
    };
    function subscribe(selectorOrListener, sliceListener, options = {}) {
        var _a;
        if (destroyed)
            return () => undefined;
        let listener;
        if (sliceListener) {
            const selector = selectorOrListener;
            const equality = (_a = options.equality) !== null && _a !== void 0 ? _a : Object.is;
            let currentSlice = selector(state);
            listener = (nextState, _previousState, action) => {
                const nextSlice = selector(nextState);
                if (equality(currentSlice, nextSlice))
                    return;
                const previousSlice = currentSlice;
                currentSlice = nextSlice;
                sliceListener(nextSlice, previousSlice, action);
            };
            if (options.fireImmediately) {
                sliceListener(currentSlice, currentSlice, 'subscribe');
            }
        }
        else {
            listener = selectorOrListener;
        }
        listeners.add(listener);
        let subscribed = true;
        return () => {
            if (!subscribed)
                return;
            subscribed = false;
            listeners.delete(listener);
        };
    }
    const select = (selector) => selector(state);
    const destroy = () => {
        destroyed = true;
        listeners.clear();
    };
    return {
        getState,
        getInitialState,
        setState,
        reset,
        subscribe,
        select,
        destroy,
    };
};
exports.createStatelite = createStatelite;
var persist_1 = require("./persist");
Object.defineProperty(exports, "createWebStorage", { enumerable: true, get: function () { return persist_1.createWebStorage; } });
Object.defineProperty(exports, "persistStore", { enumerable: true, get: function () { return persist_1.persistStore; } });
//# sourceMappingURL=index.js.map