import Cookies from 'js-cookie';

type Listener<T> = (state: T) => void;

export const createStatelite = <T extends object>(
	initialState: T,
	options?: { persistKey?: string }
) => {
	let state = initialState;
	const listeners: Listener<T>[] = [];

	// Store for client-side only
	let isClient = false;

	// Delay cookie access until after the component is mounted in client-side
	if (typeof window !== 'undefined') {
		isClient = true; // Ensure we're on the client-side
	}

	// Function to get the current state
	const getState = (): T => state;

	// Function to set/update the state
	const setState = (updater: Partial<T> | ((prevState: T) => Partial<T>)) => {
		const nextState = typeof updater === 'function' ? updater(state) : updater;
		const previousState = { ...state };

		state = { ...state, ...nextState };
		listeners.forEach((listener) => listener(state));

		// Persist the state to cookies (only on the client side)
		if (isClient && options?.persistKey) {
			if (JSON.stringify(previousState) !== JSON.stringify(state)) {
				// Store state in cookies instead of localStorage
				Cookies.set(options.persistKey, JSON.stringify(state), { expires: 7 });
			}
		}

		// Remove the persisted state if it resets to initial state (on client side)
		if (isClient && JSON.stringify(state) === JSON.stringify(initialState) && options?.persistKey) {
			Cookies.remove(options.persistKey);
		}
	};

	// Subscribe to state changes
	const subscribe = (listener: Listener<T>) => {
		listeners.push(listener);
		return () => {
			const index = listeners.indexOf(listener);
			if (index !== -1) listeners.splice(index, 1);
		};
	};

	// Selector function for partial state updates
	const select = <K>(selector: (state: T) => K): K => selector(state);

	// Load persisted state from cookies (client-side only)
	if (isClient && options?.persistKey) {
		const persistedState = Cookies.get(options.persistKey);
		if (persistedState) {
			state = { ...state, ...JSON.parse(persistedState) };
		}
	}

	return { getState, setState, subscribe, select };
};
