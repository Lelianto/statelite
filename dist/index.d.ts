export type StateUpdater<T extends object> = T | Partial<T> | ((previousState: Readonly<T>) => T | Partial<T>);
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
export type StateMiddleware<T extends object> = (transaction: StateTransaction<T>, next: (transaction?: StateTransaction<T>) => void) => void;
export interface CreateStateliteOptions<T extends object> {
    middleware?: readonly StateMiddleware<T>[];
}
export type StateListener<T> = (state: Readonly<T>, previousState: Readonly<T>, action?: string) => void;
export interface StateliteStore<T extends object> {
    getState(): Readonly<T>;
    getInitialState(): Readonly<T>;
    setState(update: StateUpdater<T>, options?: SetStateOptions | boolean): void;
    reset(action?: string): void;
    subscribe(listener: StateListener<T>): () => void;
    subscribe<U>(selector: (state: Readonly<T>) => U, listener: (slice: U, previousSlice: U, action?: string) => void, options?: SubscribeOptions<U>): () => void;
    select<U>(selector: (state: Readonly<T>) => U): U;
    destroy(): void;
}
export declare const shallowEqual: <T>(left: T, right: T) => boolean;
/**
 * Creates a small external store that is independent from UI frameworks and
 * browser APIs.
 */
export declare const createStatelite: <T extends object>(initialState: T, storeOptions?: CreateStateliteOptions<T>) => StateliteStore<T>;
export { createWebStorage, persistStore, type PersistController, type PersistOptions, type StorageAdapter, type WebStorageKind, } from './persist';
export { createAsyncAction, type AsyncActionContext, type AsyncActionHooks, type AsyncActionOptions, } from './async';
export { connectDevtools, type DevtoolsConnection, type DevtoolsExtension, type DevtoolsOptions, } from './devtools';
//# sourceMappingURL=index.d.ts.map