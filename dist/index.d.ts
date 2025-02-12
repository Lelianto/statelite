type Listener<T> = (state: T) => void;
export declare const createStatelite: <T extends object>(initialState: T, options?: {
    persistKey?: string;
}) => {
    getState: () => T;
    setState: (updater: Partial<T> | ((prevState: T) => Partial<T>)) => void;
    subscribe: (listener: Listener<T>) => () => void;
    select: <K>(selector: (state: T) => K) => K;
};
export {};
