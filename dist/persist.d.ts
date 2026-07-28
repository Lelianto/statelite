import type { StateliteStore } from './index';
export interface StorageAdapter {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
    removeItem(key: string): void | Promise<void>;
}
export type WebStorageKind = 'localStorage' | 'sessionStorage';
export interface PersistOptions<T extends object, P = Partial<T>> {
    key: string;
    storage: StorageAdapter;
    version?: number;
    partialize?: (state: Readonly<T>) => P;
    migrate?: (persistedState: unknown, version: number) => P | Promise<P>;
    merge?: (persistedState: P, currentState: Readonly<T>) => T;
    serialize?: (value: unknown) => string;
    deserialize?: (value: string) => unknown;
    autoHydrate?: boolean;
    /** Duration in milliseconds before persisted state expires. */
    ttl?: number;
    now?: () => number;
    onError?: (error: unknown) => void;
}
export interface PersistController {
    rehydrate(): Promise<void>;
    clear(): Promise<void>;
    hasHydrated(): boolean;
    unsubscribe(): void;
}
/**
 * Creates a lazy web-storage adapter. Merely importing this helper is SSR-safe;
 * storage is resolved only when an operation runs in a browser.
 */
export declare const createWebStorage: (kind?: WebStorageKind) => StorageAdapter;
/**
 * Adds persistence to an existing store without coupling the core to a browser.
 */
export declare const persistStore: <T extends object, P = Partial<T>>(store: StateliteStore<T>, options: PersistOptions<T, P>) => PersistController;
//# sourceMappingURL=persist.d.ts.map