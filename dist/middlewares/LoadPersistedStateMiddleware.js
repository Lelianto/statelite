"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadPersistedStateMiddleware = void 0;
const LoadPersistedStateMiddleware = (state, nextState, setState) => {
    const persistKey = "app_theme";
    if (persistKey) {
        const savedState = localStorage.getItem(persistKey);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            setState(Object.assign(Object.assign({}, state), parsedState));
        }
    }
    setState(nextState);
};
exports.LoadPersistedStateMiddleware = LoadPersistedStateMiddleware;
