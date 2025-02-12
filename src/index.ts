export type Middleware<T> = (state: T, nextState: Partial<T>, setState: (newState: T) => void) => void;

type Listener<T> = (state: T) => void;

// createStatelite implementation
export const createStatelite = <T extends object>(
	initialState: T,
	options?: { persistKey?: string },
	middlewares: Middleware<T>[] = [] // Middleware sebagai parameter
) => {
	let state = initialState;
	const listeners: Listener<T>[] = [];

	const getState = (): T => state;

	const setState = (updater: Partial<T> | ((prevState: T) => Partial<T>)) => {
		const nextState = typeof updater === "function" ? updater(state) : updater;
		const previousState = { ...state };

		// Menjalankan middleware sebelum mengubah state
		middlewares.forEach(middleware => middleware(state, nextState, (newState) => {
			state = newState;
		}));

		state = { ...state, ...nextState };

		listeners.forEach(listener => listener(state));

		// Persisting logic
		if (options?.persistKey) {
			if (JSON.stringify(previousState) !== JSON.stringify(state)) {
				localStorage.setItem(options.persistKey, JSON.stringify(state));
			}
		}

		if (JSON.stringify(state) === JSON.stringify(initialState) && options?.persistKey) {
			localStorage.removeItem(options.persistKey);
		}
	};

	const subscribe = (listener: Listener<T>) => {
		listeners.push(listener);
		return () => {
			const index = listeners.indexOf(listener);
			if (index !== -1) listeners.splice(index, 1);
		};
	};

	// Memastikan state dimuat dari localStorage jika persistKey ada
	if (options?.persistKey) {
		const persistedState = localStorage.getItem(options.persistKey);
		if (persistedState) {
			state = { ...state, ...JSON.parse(persistedState) };
		}
	}

	return { getState, setState, subscribe };
};
