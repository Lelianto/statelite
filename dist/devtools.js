"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDevtools = void 0;
/**
 * Connects a Statelite store to Redux DevTools when the extension is present.
 * The optional extension injection keeps this helper testable and SSR-safe.
 */
const connectDevtools = (store, options = {}) => {
    var _a, _b;
    if (options.enabled === false)
        return { disconnect: () => undefined };
    const extension = (_a = options.extension) !== null && _a !== void 0 ? _a : (typeof window !== 'undefined'
        ? window.__REDUX_DEVTOOLS_EXTENSION__
        : undefined);
    if (!extension)
        return { disconnect: () => undefined };
    const connection = extension.connect({ name: (_b = options.name) !== null && _b !== void 0 ? _b : 'Statelite' });
    let applyingDevtoolsState = false;
    connection.init(store.getState());
    const unsubscribeStore = store.subscribe((state, _previous, action) => {
        if (!applyingDevtoolsState) {
            connection.send(action !== null && action !== void 0 ? action : 'setState', state);
        }
    });
    const unsubscribeDevtools = connection.subscribe((message) => {
        if (message.type !== 'DISPATCH' || !message.payload)
            return;
        const payload = JSON.parse(message.payload);
        if ((payload.type === 'JUMP_TO_STATE' ||
            payload.type === 'JUMP_TO_ACTION') &&
            message.state) {
            applyingDevtoolsState = true;
            try {
                store.setState(JSON.parse(message.state), {
                    replace: true,
                    action: 'devtools/jump',
                });
            }
            finally {
                applyingDevtoolsState = false;
            }
        }
    });
    return {
        disconnect: () => {
            unsubscribeStore();
            unsubscribeDevtools();
        },
    };
};
exports.connectDevtools = connectDevtools;
//# sourceMappingURL=devtools.js.map