export type StateUpdater<T extends object> = T | Partial<T> | ((previousState: Readonly<T>) => T | Partial<T>);
export interface SetStateOptions {
    replace?: boolean;
    action?: string;
}
export interface SubscribeOptions<U> {
    equality?: (left: U, right: U) => boolean;
    fireImmediately?: boolean;
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
/**
 * Creates a small external store that is independent from UI frameworks and
 * browser APIs.
 */
export declare const createStatelite: <T extends object>(initialState: T) => StateliteStore<T>;
export { createWebStorage, persistStore, type PersistController, type PersistOptions, type StorageAdapter, type WebStorageKind, } from './persist';
//# sourceMappingURL=index.d.ts.map