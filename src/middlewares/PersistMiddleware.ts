import { Middleware } from "../"; // Asumsi middleware dari store.ts

export const PersistMiddleware: Middleware<any> = (state, nextState, setState) => {
	const persistKey = "app_theme"; // Bisa disesuaikan
	if (persistKey) {
		localStorage.setItem(persistKey, JSON.stringify({ ...state, ...nextState }));
	}
	setState(nextState);
};
