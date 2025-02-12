"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistMiddleware = void 0;
const PersistMiddleware = (state, nextState, setState) => {
    const persistKey = "app_theme"; // Bisa disesuaikan
    if (persistKey) {
        localStorage.setItem(persistKey, JSON.stringify(Object.assign(Object.assign({}, state), nextState)));
    }
    setState(nextState);
};
exports.PersistMiddleware = PersistMiddleware;
