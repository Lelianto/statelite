import { Middleware } from "../";

export const LoadPersistedStateMiddleware: Middleware<any> = (state, nextState, setState) => {
	const persistKey = "app_theme";
	if (persistKey) {
		const savedState = localStorage.getItem(persistKey);
		if (savedState) {
			const parsedState = JSON.parse(savedState);
			setState({ ...state, ...parsedState });
		}
	}
	setState(nextState);
};
