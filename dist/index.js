"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDevtools = exports.createAsyncAction = exports.persistStore = exports.createWebStorage = exports.createStatelite = exports.shallowEqual = void 0;
const shallowEqual = (left, right) => {
    if (Object.is(left, right))
        return true;
    if (left === null ||
        right === null ||
        typeof left !== 'object' ||
        typeof right !== 'object') {
        return false;
    }
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length)
        return false;
    return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) &&
        Object.is(left[key], right[key]));
};
exports.shallowEqual = shallowEqual;
const cloneState = (state) => {
    if (Array.isArray(state))
        return [...state];
    return { ...state };
};
/**
 * Creates a small external store that is independent from UI frameworks and
 * browser APIs.
 */
const createStatelite = (initialState, storeOptions = {}) => {
    const initialSnapshot = cloneState(initialState);
    let state = cloneState(initialState);
    let destroyed = false;
    const listeners = new Set();
    const getState = () => state;
    const getInitialState = () => initialSnapshot;
    const setState = (update, options = {}) => {
        var _a;
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
            (!Array.isArray(nextState) && (0, exports.shallowEqual)(previousState, nextState))) {
            return;
        }
        const commit = (transaction) => {
            const committedState = transaction.nextState;
            if (Object.is(transaction.previousState, committedState) ||
                (!Array.isArray(committedState) &&
                    (0, exports.shallowEqual)(transaction.previousState, committedState))) {
                return;
            }
            state = committedState;
            for (const listener of Array.from(listeners)) {
                listener(state, transaction.previousState, transaction.action);
            }
        };
        const middleware = (_a = storeOptions.middleware) !== null && _a !== void 0 ? _a : [];
        const dispatch = (index, transaction) => {
            const currentMiddleware = middleware[index];
            if (!currentMiddleware) {
                commit(transaction);
                return;
            }
            let called = false;
            currentMiddleware(transaction, (nextTransaction = transaction) => {
                if (called) {
                    throw new Error('Statelite middleware next() called more than once.');
                }
                called = true;
                dispatch(index + 1, nextTransaction);
            });
        };
        dispatch(0, {
            previousState,
            nextState,
            action: resolvedOptions.action,
            replace: shouldReplace,
        });
    };
    const reset = (action = 'reset') => {
        setState(cloneState(initialSnapshot), { replace: true, action });
    };
    function subscribe(selectorOrListener, sliceListener, options = {}) {
        var _a, _b;
        if (destroyed)
            return () => undefined;
        let listener;
        if (sliceListener) {
            const selector = selectorOrListener;
            const equality = (_b = (_a = options.equalityFn) !== null && _a !== void 0 ? _a : options.equality) !== null && _b !== void 0 ? _b : Object.is;
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
var async_1 = require("./async");
Object.defineProperty(exports, "createAsyncAction", { enumerable: true, get: function () { return async_1.createAsyncAction; } });
var devtools_1 = require("./devtools");
Object.defineProperty(exports, "connectDevtools", { enumerable: true, get: function () { return devtools_1.connectDevtools; } });
//# sourceMappingURL=index.js.map