export type StateUpdater<T extends object> =
	| T
	| Partial<T>
	| ((previousState: Readonly<T>) => T | Partial<T>);

export interface SetStateOptions {
	replace?: boolean;
	action?: string;
}

export interface SubscribeOptions<U> {
	equality?: (left: U, right: U) => boolean;
	equalityFn?: (left: U, right: U) => boolean;
	fireImmediately?: boolean;
}

export interface StateTransaction<T extends object> {
	previousState: Readonly<T>;
	nextState: Readonly<T>;
	action?: string;
	replace: boolean;
}

export type StateMiddleware<T extends object> = (
	transaction: StateTransaction<T>,
	next: (transaction?: StateTransaction<T>) => void
) => void;

export interface CreateStateliteOptions<T extends object> {
	middleware?: readonly StateMiddleware<T>[];
}

export type StateListener<T> = (
	state: Readonly<T>,
	previousState: Readonly<T>,
	action?: string
) => void;

export interface StateliteStore<T extends object> {
	getState(): Readonly<T>;
	getInitialState(): Readonly<T>;
	setState(update: StateUpdater<T>, options?: SetStateOptions | boolean): void;
	reset(action?: string): void;
	subscribe(listener: StateListener<T>): () => void;
	subscribe<U>(
		selector: (state: Readonly<T>) => U,
		listener: (slice: U, previousSlice: U, action?: string) => void,
		options?: SubscribeOptions<U>
	): () => void;
	select<U>(selector: (state: Readonly<T>) => U): U;
	destroy(): void;
}

export const shallowEqual = <T>(left: T, right: T): boolean => {
	if (Object.is(left, right)) return true;
	if (
		left === null ||
		right === null ||
		typeof left !== 'object' ||
		typeof right !== 'object'
	) {
		return false;
	}

	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length !== rightKeys.length) return false;

	return leftKeys.every(
		(key) =>
			Object.prototype.hasOwnProperty.call(right, key) &&
			Object.is(
				(left as Record<string, unknown>)[key],
				(right as Record<string, unknown>)[key]
			)
	);
};

const cloneState = <T extends object>(state: T): T => {
	if (Array.isArray(state)) return [...state] as T;
	return { ...state };
};

/**
 * Creates a small external store that is independent from UI frameworks and
 * browser APIs.
 */
export const createStatelite = <T extends object>(
	initialState: T,
	storeOptions: CreateStateliteOptions<T> = {}
): StateliteStore<T> => {
	const initialSnapshot = cloneState(initialState);
	let state = cloneState(initialState);
	let destroyed = false;
	const listeners = new Set<StateListener<T>>();

	const getState = (): Readonly<T> => state;
	const getInitialState = (): Readonly<T> => initialSnapshot;

	const setState = (
		update: StateUpdater<T>,
		options: SetStateOptions | boolean = {}
	): void => {
		if (destroyed) return;

		const resolvedOptions =
			typeof options === 'boolean' ? { replace: options } : options;
		const previousState = state;
		const nextValue =
			typeof update === 'function'
				? update(previousState)
				: update;
		const shouldReplace =
			resolvedOptions.replace === true || Array.isArray(previousState);
		const nextState = (
			shouldReplace
				? nextValue
				: { ...previousState, ...nextValue }
		) as T;

		if (
			Object.is(previousState, nextState) ||
			(!Array.isArray(nextState) && shallowEqual(previousState, nextState))
		) {
			return;
		}

		const commit = (transaction: StateTransaction<T>): void => {
			const committedState = transaction.nextState as T;
			if (
				Object.is(transaction.previousState, committedState) ||
				(!Array.isArray(committedState) &&
					shallowEqual(transaction.previousState, committedState))
			) {
				return;
			}

			state = committedState;
			for (const listener of Array.from(listeners)) {
				listener(state, transaction.previousState, transaction.action);
			}
		};

		const middleware = storeOptions.middleware ?? [];
		const dispatch = (
			index: number,
			transaction: StateTransaction<T>
		): void => {
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

	const reset = (action = 'reset'): void => {
		setState(cloneState(initialSnapshot), { replace: true, action });
	};

	function subscribe(listener: StateListener<T>): () => void;
	function subscribe<U>(
		selector: (currentState: Readonly<T>) => U,
		listener: (slice: U, previousSlice: U, action?: string) => void,
		options?: SubscribeOptions<U>
	): () => void;
	function subscribe<U>(
		selectorOrListener: StateListener<T> | ((currentState: Readonly<T>) => U),
		sliceListener?: (
			slice: U,
			previousSlice: U,
			action?: string
		) => void,
		options: SubscribeOptions<U> = {}
	): () => void {
		if (destroyed) return () => undefined;

		let listener: StateListener<T>;

		if (sliceListener) {
			const selector = selectorOrListener as (
				currentState: Readonly<T>
			) => U;
			const equality =
				options.equalityFn ?? options.equality ?? Object.is;
			let currentSlice = selector(state);

			listener = (nextState, _previousState, action) => {
				const nextSlice = selector(nextState);
				if (equality(currentSlice, nextSlice)) return;

				const previousSlice = currentSlice;
				currentSlice = nextSlice;
				sliceListener(nextSlice, previousSlice, action);
			};

			if (options.fireImmediately) {
				sliceListener(currentSlice, currentSlice, 'subscribe');
			}
		} else {
			listener = selectorOrListener as StateListener<T>;
		}

		listeners.add(listener);
		let subscribed = true;

		return () => {
			if (!subscribed) return;
			subscribed = false;
			listeners.delete(listener);
		};
	}

	const select = <U>(selector: (currentState: Readonly<T>) => U): U =>
		selector(state);

	const destroy = (): void => {
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

export {
	createWebStorage,
	persistStore,
	type PersistController,
	type PersistOptions,
	type StorageAdapter,
	type WebStorageKind,
} from './persist';

export {
	createAsyncAction,
	type AsyncActionContext,
	type AsyncActionHooks,
	type AsyncActionOptions,
} from './async';

export {
	connectDevtools,
	type DevtoolsConnection,
	type DevtoolsExtension,
	type DevtoolsOptions,
} from './devtools';
