type Listener<T> = (state: T) => void;

export const createStatelite = <T extends object>(
	initialState: T
) => {
	let state = initialState;
	const listeners: Listener<T>[] = [];

	const getState = (): T => state;

	const setState = (updater: Partial<T> | ((prevState: T) => Partial<T>)) => {
		const nextState = typeof updater === "function" ? updater(state) : updater;
		state = { ...state, ...nextState };
		listeners.forEach(listener => listener(state));
	};

	const subscribe = (listener: Listener<T>) => {
		listeners.push(listener);
		return () => {
			const index = listeners.indexOf(listener);
			if (index !== -1) listeners.splice(index, 1);
		};
	};

	// Selector function for partial state updates
	const select = <K>(selector: (state: T) => K): K => selector(state);

	return { getState, setState, subscribe, select };
};
