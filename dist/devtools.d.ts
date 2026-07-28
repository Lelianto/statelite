import type { StateliteStore } from './index';
interface DevtoolsMessage {
    type: string;
    payload?: string;
    state?: string;
}
interface DevtoolsConnector {
    init(state: unknown): void;
    send(action: string | {
        type: string;
    }, state: unknown): void;
    subscribe(listener: (message: DevtoolsMessage) => void): () => void;
}
export interface DevtoolsExtension {
    connect(options?: {
        name?: string;
    }): DevtoolsConnector;
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
export declare const connectDevtools: <T extends object>(store: StateliteStore<T>, options?: DevtoolsOptions) => DevtoolsConnection;
export {};
//# sourceMappingURL=devtools.d.ts.map