"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsyncAction = void 0;
/**
 * Creates a reusable async action with an AbortSignal and optional lifecycle
 * hooks. `latest` defaults to true to prevent stale requests from updating UI.
 */
const createAsyncAction = (store, handler, options = {}) => {
    let activeController;
    let invocation = 0;
    const action = async (...args) => {
        var _a, _b, _c, _d;
        const call = ++invocation;
        if (options.latest !== false)
            activeController === null || activeController === void 0 ? void 0 : activeController.abort();
        const controller = new AbortController();
        activeController = controller;
        const isCurrent = () => options.latest === false || call === invocation;
        if (isCurrent())
            (_a = options.onStart) === null || _a === void 0 ? void 0 : _a.call(options, args, store);
        try {
            const result = await handler({
                getState: store.getState,
                setState: store.setState,
                signal: controller.signal,
            }, ...args);
            if (isCurrent() && !controller.signal.aborted) {
                (_b = options.onSuccess) === null || _b === void 0 ? void 0 : _b.call(options, result, args, store);
            }
            return result;
        }
        catch (error) {
            if (isCurrent() && !controller.signal.aborted) {
                (_c = options.onError) === null || _c === void 0 ? void 0 : _c.call(options, error, args, store);
            }
            throw error;
        }
        finally {
            if (isCurrent()) {
                (_d = options.onFinally) === null || _d === void 0 ? void 0 : _d.call(options, args, store);
                if (activeController === controller)
                    activeController = undefined;
            }
        }
    };
    action.abort = (reason) => {
        activeController === null || activeController === void 0 ? void 0 : activeController.abort(reason);
        activeController = undefined;
    };
    return action;
};
exports.createAsyncAction = createAsyncAction;
//# sourceMappingURL=async.js.map