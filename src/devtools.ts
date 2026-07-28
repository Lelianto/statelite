import type { StateliteStore } from './index';

interface DevtoolsMessage {
	type: string;
	payload?: string;
	state?: string;
}

interface DevtoolsConnector {
	init(state: unknown): void;
	send(action: string | { type: string }, state: unknown): void;
	subscribe(listener: (message: DevtoolsMessage) => void): () => void;
}

export interface DevtoolsExtension {
	connect(options?: { name?: string }): DevtoolsConnector;
}

export interface DevtoolsOptions {
	name?: string;
	enabled?: boolean;
	extension?: DevtoolsExtension;
}

export interface DevtoolsConnection {
	disconnect(): void;
}

declare global {
	interface Window {
		__REDUX_DEVTOOLS_EXTENSION__?: DevtoolsExtension;
	}
}

/**
 * Connects a Statelite store to Redux DevTools when the extension is present.
 * The optional extension injection keeps this helper testable and SSR-safe.
 */
export const connectDevtools = <T extends object>(
	store: StateliteStore<T>,
	options: DevtoolsOptions = {}
): DevtoolsConnection => {
	if (options.enabled === false) return { disconnect: () => undefined };

	const extension =
		options.extension ??
		(typeof window !== 'undefined'
			? window.__REDUX_DEVTOOLS_EXTENSION__
			: undefined);
	if (!extension) return { disconnect: () => undefined };

	const connection = extension.connect({ name: options.name ?? 'Statelite' });
	let applyingDevtoolsState = false;
	connection.init(store.getState());

	const unsubscribeStore = store.subscribe((state, _previous, action) => {
		if (!applyingDevtoolsState) {
			connection.send(action ?? 'setState', state);
		}
	});

	const unsubscribeDevtools = connection.subscribe((message) => {
		if (message.type !== 'DISPATCH' || !message.payload) return;
		const payload = JSON.parse(message.payload) as { type?: string };

		if (
			(payload.type === 'JUMP_TO_STATE' ||
				payload.type === 'JUMP_TO_ACTION') &&
			message.state
		) {
			applyingDevtoolsState = true;
			try {
				store.setState(JSON.parse(message.state) as T, {
					replace: true,
					action: 'devtools/jump',
				});
			} finally {
				applyingDevtoolsState = false;
			}
		}
	});

	return {
		disconnect: () => {
			unsubscribeStore();
			unsubscribeDevtools();
		},
	};
};
