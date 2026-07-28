import type { StateliteStore } from './index';

export interface AsyncActionContext<T extends object> {
	getState(): Readonly<T>;
	setState: StateliteStore<T>['setState'];
	signal: AbortSignal;
}

export interface AsyncActionHooks<T extends object, Result, Args extends unknown[]> {
	onStart?: (args: Args, store: StateliteStore<T>) => void;
	onSuccess?: (
		result: Result,
		args: Args,
		store: StateliteStore<T>
	) => void;
	onError?: (
		error: unknown,
		args: Args,
		store: StateliteStore<T>
	) => void;
	onFinally?: (args: Args, store: StateliteStore<T>) => void;
}

export interface AsyncActionOptions<
	T extends object,
	Result,
	Args extends unknown[],
> extends AsyncActionHooks<T, Result, Args> {
	/**
	 * When true, a new invocation aborts the previous one and only the latest
	 * invocation may run lifecycle hooks.
	 */
	latest?: boolean;
}

export interface AsyncAction<Args extends unknown[], Result> {
	(...args: Args): Promise<Result>;
	abort(reason?: unknown): void;
}

/**
 * Creates a reusable async action with an AbortSignal and optional lifecycle
 * hooks. `latest` defaults to true to prevent stale requests from updating UI.
 */
export const createAsyncAction = <
	T extends object,
	Args extends unknown[],
	Result,
>(
	store: StateliteStore<T>,
	handler: (
		context: AsyncActionContext<T>,
		...args: Args
	) => Promise<Result> | Result,
	options: AsyncActionOptions<T, Result, Args> = {}
): AsyncAction<Args, Result> => {
	let activeController: AbortController | undefined;
	let invocation = 0;

	const action = async (...args: Args): Promise<Result> => {
		const call = ++invocation;
		if (options.latest !== false) activeController?.abort();

		const controller = new AbortController();
		activeController = controller;
		const isCurrent = (): boolean =>
			options.latest === false || call === invocation;

		if (isCurrent()) options.onStart?.(args, store);

		try {
			const result = await handler(
				{
					getState: store.getState,
					setState: store.setState,
					signal: controller.signal,
				},
				...args
			);
			if (isCurrent() && !controller.signal.aborted) {
				options.onSuccess?.(result, args, store);
			}
			return result;
		} catch (error) {
			if (isCurrent() && !controller.signal.aborted) {
				options.onError?.(error, args, store);
			}
			throw error;
		} finally {
			if (isCurrent()) {
				options.onFinally?.(args, store);
				if (activeController === controller) activeController = undefined;
			}
		}
	};

	action.abort = (reason?: unknown): void => {
		activeController?.abort(reason);
		activeController = undefined;
	};

	return action;
};
