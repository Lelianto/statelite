export type Middleware<T> = (state: T, nextState: Partial<T>, setState: (newState: T) => void) => void;
type Listener<T> = (state: T) => void;
export declare const createStatelite: <T extends object>(initialState: T, options?: {
    persistKey?: string;
}, middlewares?: Middleware<T>[]) => {
    getState: () => T;
    setState: (updater: Partial<T> | ((prevState: T) => Partial<T>)) => void;
    subscribe: (listener: Listener<T>) => () => void;
};
export {};
