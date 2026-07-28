import {
	connectDevtools,
	createAsyncAction,
	createStatelite,
	persistStore,
	shallowEqual,
	type DevtoolsExtension,
	type StorageAdapter,
} from './index';

describe('createStatelite', () => {
	it('updates state with objects and updater functions', () => {
		const store = createStatelite({ count: 0, label: 'counter' });

		store.setState({ count: 1 });
		store.setState((state) => ({ count: state.count + 1 }));

		expect(store.getState()).toEqual({ count: 2, label: 'counter' });
	});

	it('supports replace and reset', () => {
		const store = createStatelite({ count: 0, label: 'counter' });

		store.setState({ count: 5, label: 'changed' }, { replace: true });
		store.reset();

		expect(store.getState()).toEqual({ count: 0, label: 'counter' });
	});

	it('does not notify for an equivalent shallow update', () => {
		const store = createStatelite({ count: 0 });
		const listener = jest.fn();
		store.subscribe(listener);

		store.setState({ count: 0 });

		expect(listener).not.toHaveBeenCalled();
	});

	it('notifies full-state listeners with previous state and action', () => {
		const store = createStatelite({ count: 0 });
		const listener = jest.fn();
		const unsubscribe = store.subscribe(listener);

		store.setState({ count: 1 }, { action: 'increment' });
		unsubscribe();
		store.setState({ count: 2 });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(
			{ count: 1 },
			{ count: 0 },
			'increment'
		);
	});

	it('only notifies selector listeners when their slice changes', () => {
		const store = createStatelite({ count: 0, label: 'counter' });
		const listener = jest.fn();
		store.subscribe((state) => state.count, listener);

		store.setState({ label: 'new label' });
		store.setState({ count: 1 }, { action: 'increment' });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith(1, 0, 'increment');
	});

	it('supports equalityFn and exports a shallow equality helper', () => {
		const store = createStatelite({ first: 1, second: 2, ignored: 0 });
		const listener = jest.fn();
		store.subscribe(
			(state) => ({ first: state.first, second: state.second }),
			listener,
			{ equalityFn: shallowEqual }
		);

		store.setState({ ignored: 1 });
		store.setState({ first: 2 });

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('runs middleware in order and allows transforming a transaction', () => {
		const calls: string[] = [];
		const store = createStatelite(
			{ count: 0 },
			{
				middleware: [
					(transaction, next) => {
						calls.push('first');
						next({
							...transaction,
							nextState: {
								count: transaction.nextState.count + 1,
							},
						});
					},
					(transaction, next) => {
						calls.push('second');
						next(transaction);
					},
				],
			}
		);

		store.setState({ count: 1 }, { action: 'increment' });

		expect(store.getState()).toEqual({ count: 2 });
		expect(calls).toEqual(['first', 'second']);
	});

	it('allows middleware to block an update', () => {
		const store = createStatelite(
			{ count: 0 },
			{
				middleware: [
					(transaction, next) => {
						if (transaction.action !== 'blocked') next();
					},
				],
			}
		);

		store.setState({ count: 1 }, { action: 'blocked' });

		expect(store.getState()).toEqual({ count: 0 });
	});

	it('uses a listener snapshot during notification', () => {
		const store = createStatelite({ count: 0 });
		const calls: string[] = [];
		let unsubscribeSecond: () => void = () => undefined;

		store.subscribe(() => {
			calls.push('first');
			unsubscribeSecond();
		});
		unsubscribeSecond = store.subscribe(() => calls.push('second'));

		store.setState({ count: 1 });

		expect(calls).toEqual(['first', 'second']);
	});

	it('stops updates and subscriptions after destroy', () => {
		const store = createStatelite({ count: 0 });
		const listener = jest.fn();
		store.subscribe(listener);

		store.destroy();
		store.setState({ count: 1 });
		const unsubscribe = store.subscribe(listener);
		unsubscribe();

		expect(store.getState()).toEqual({ count: 0 });
		expect(listener).not.toHaveBeenCalled();
	});
});

describe('createAsyncAction', () => {
	it('runs lifecycle hooks and exposes the store context', async () => {
		const store = createStatelite({ value: 1, loading: false });
		const action = createAsyncAction(
			store,
			async ({ getState }, amount: number) => getState().value + amount,
			{
				onStart: (_args, currentStore) =>
					currentStore.setState({ loading: true }),
				onSuccess: (result, _args, currentStore) =>
					currentStore.setState({ value: result }),
				onFinally: (_args, currentStore) =>
					currentStore.setState({ loading: false }),
			}
		);

		await expect(action(2)).resolves.toBe(3);
		expect(store.getState()).toEqual({ value: 3, loading: false });
	});

	it('aborts the previous call in latest mode', async () => {
		const store = createStatelite({ result: '' });
		const signals: AbortSignal[] = [];
		const action = createAsyncAction(
			store,
			async ({ signal }, value: string) => {
				signals.push(signal);
				return value;
			},
			{
				onSuccess: (result) => store.setState({ result }),
			}
		);

		await Promise.all([action('old'), action('new')]);

		expect(signals[0].aborted).toBe(true);
		expect(store.getState().result).toBe('new');
	});
});

describe('connectDevtools', () => {
	it('sends actions and applies time travel state', () => {
		let devtoolsListener: ((message: {
			type: string;
			payload?: string;
			state?: string;
		}) => void) | undefined;
		const send = jest.fn();
		const extension: DevtoolsExtension = {
			connect: () => ({
				init: jest.fn(),
				send,
				subscribe: (listener) => {
					devtoolsListener = listener;
					return () => undefined;
				},
			}),
		};
		const store = createStatelite({ count: 0 });
		const devtools = connectDevtools(store, { extension });

		store.setState({ count: 1 }, { action: 'increment' });
		devtoolsListener?.({
			type: 'DISPATCH',
			payload: JSON.stringify({ type: 'JUMP_TO_STATE' }),
			state: JSON.stringify({ count: 5 }),
		});

		expect(send).toHaveBeenCalledWith('increment', { count: 1 });
		expect(store.getState()).toEqual({ count: 5 });
		devtools.disconnect();
	});
});

describe('persistStore', () => {
	const createMemoryStorage = (): StorageAdapter & {
		data: Map<string, string>;
	} => {
		const data = new Map<string, string>();
		return {
			data,
			getItem: (key) => data.get(key) ?? null,
			setItem: (key, value) => {
				data.set(key, value);
			},
			removeItem: (key) => {
				data.delete(key);
			},
		};
	};

	it('persists updates and rehydrates a new store', async () => {
		const storage = createMemoryStorage();
		const firstStore = createStatelite({ count: 0, temporary: 'keep' });
		persistStore(firstStore, {
			key: 'counter',
			storage,
			partialize: (state) => ({ count: state.count }),
			autoHydrate: false,
		});

		firstStore.setState({ count: 4 });
		await Promise.resolve();

		const secondStore = createStatelite({ count: 0, temporary: 'default' });
		const controller = persistStore(secondStore, {
			key: 'counter',
			storage,
			autoHydrate: false,
		});
		await controller.rehydrate();

		expect(secondStore.getState()).toEqual({
			count: 4,
			temporary: 'default',
		});
		expect(controller.hasHydrated()).toBe(true);
	});

	it('migrates persisted state versions', async () => {
		const storage = createMemoryStorage();
		storage.data.set(
			'counter',
			JSON.stringify({ state: { value: 2 }, version: 0 })
		);
		const store = createStatelite({ count: 0 });
		const controller = persistStore(store, {
			key: 'counter',
			storage,
			version: 1,
			autoHydrate: false,
			migrate: (persisted) => ({
				count: (persisted as { value: number }).value,
			}),
		});

		await controller.rehydrate();

		expect(store.getState()).toEqual({ count: 2 });
	});

	it('reports corrupt persisted data without breaking the store', async () => {
		const storage = createMemoryStorage();
		storage.data.set('counter', 'not-json');
		const onError = jest.fn();
		const store = createStatelite({ count: 0 });
		const controller = persistStore(store, {
			key: 'counter',
			storage,
			autoHydrate: false,
			onError,
		});

		await controller.rehydrate();
		store.setState({ count: 1 });

		expect(onError).toHaveBeenCalledTimes(1);
		expect(store.getState()).toEqual({ count: 1 });
	});

	it('removes expired persisted state instead of hydrating it', async () => {
		const storage = createMemoryStorage();
		storage.data.set(
			'counter',
			JSON.stringify({
				state: { count: 9 },
				version: 0,
				expiresAt: 99,
			})
		);
		const store = createStatelite({ count: 0 });
		const controller = persistStore(store, {
			key: 'counter',
			storage,
			autoHydrate: false,
			now: () => 100,
		});

		await controller.rehydrate();

		expect(store.getState()).toEqual({ count: 0 });
		expect(storage.data.has('counter')).toBe(false);
	});

	it('writes an expiry timestamp when ttl is configured', async () => {
		const storage = createMemoryStorage();
		const store = createStatelite({ count: 0 });
		persistStore(store, {
			key: 'counter',
			storage,
			autoHydrate: false,
			ttl: 500,
			now: () => 1_000,
		});

		store.setState({ count: 1 });
		await Promise.resolve();

		expect(JSON.parse(storage.data.get('counter') ?? '')).toEqual({
			state: { count: 1 },
			version: 0,
			expiresAt: 1_500,
		});
	});
});
