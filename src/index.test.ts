import {
	createStatelite,
	persistStore,
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
});
