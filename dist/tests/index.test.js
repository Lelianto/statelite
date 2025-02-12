"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const LoadPersistedStateMiddleware_1 = require("../src/middlewares/LoadPersistedStateMiddleware");
const PersistMiddleware_1 = require("../src/middlewares/PersistMiddleware");
beforeEach(() => {
    Object.defineProperty(global, "localStorage", {
        value: {
            getItem: jest.fn(() => JSON.stringify({ theme: "dark" })),
            setItem: jest.fn(),
            removeItem: jest.fn(),
        },
        writable: true,
    });
});
describe("createStatelite with persistence", () => {
    // test("should persist and load state", () => {
    // 	const store = createStatelite(
    // 		{ theme: "light" },
    // 		{ persistKey: "app_theme" }
    // 	);
    // 	store.setState({ theme: "dark" });
    // 	// Expect localStorage.setItem to be called with the correct key and state
    // 	expect(global.localStorage.setItem).toHaveBeenCalledWith(
    // 		"app_theme",
    // 		JSON.stringify({ theme: "dark" })
    // 	);
    // 	// Simulate loading the persisted state
    // 	(global.localStorage.getItem as jest.Mock).mockReturnValue(
    // 		JSON.stringify({ theme: "dark" })
    // 	);
    // 	// Create a new store instance to test if the persisted state is loaded
    // 	const newStore = createStatelite(
    // 		{ theme: "light" },
    // 		{ persistKey: "app_theme" }
    // 	);
    // 	// Expect the state to be loaded correctly from localStorage
    // 	expect(newStore.getState()).toEqual({ theme: "dark" });
    // });
    // test("should not persist state if no persistKey is provided", () => {
    // 	const store = createStatelite({ theme: "light" });
    // 	store.setState({ theme: "dark" });
    // 	// Expect localStorage.setItem not to be called
    // 	expect(global.localStorage.setItem).not.toHaveBeenCalled();
    // });
    // test("should load default state if nothing is persisted in localStorage", () => {
    // 	(global.localStorage.getItem as jest.Mock).mockReturnValueOnce(null); // Simulate no persisted data
    // 	const store = createStatelite(
    // 		{ theme: "light" },
    // 		{ persistKey: "app_theme" }
    // 	);
    // 	// The state should still be the initial state as no data was persisted
    // 	expect(store.getState()).toEqual({ theme: "light" });
    // });
    // test("should persist state when state is updated", () => {
    // 	const store = createStatelite(
    // 		{ theme: "light" },
    // 		{ persistKey: "app_theme" }
    // 	);
    // 	// Update the state
    // 	store.setState({ theme: "dark" });
    // 	// Ensure localStorage.setItem is called to persist the updated state
    // 	expect(global.localStorage.setItem).toHaveBeenCalledWith(
    // 		"app_theme",
    // 		JSON.stringify({ theme: "dark" })
    // 	);
    // });
    // test("should call localStorage.removeItem when state is cleared", () => {
    // 	const store = createStatelite(
    // 		{ theme: "light" },
    // 		{ persistKey: "app_theme" }
    // 	);
    // 	// Simulate clearing state
    // 	store.setState({ theme: "dark" });
    // 	store.setState({ theme: "light" });
    // 	// Check if localStorage.removeItem was called to remove the persisted state
    // 	expect(global.localStorage.removeItem).toHaveBeenCalledWith("app_theme");
    // });
    test("should persist state to localStorage", () => {
        const store = (0, src_1.createStatelite)({ theme: "light" }, { persistKey: "app_theme" }, [LoadPersistedStateMiddleware_1.LoadPersistedStateMiddleware, PersistMiddleware_1.PersistMiddleware]);
        store.setState({ theme: "dark" });
        expect(window.localStorage.setItem).toHaveBeenCalledWith("app_theme", JSON.stringify({ theme: "dark" }));
    });
    test("should load state from localStorage", () => {
        window.localStorage.setItem("app_theme", JSON.stringify({ theme: "dark" }));
        const store = (0, src_1.createStatelite)({ theme: "light" }, { persistKey: "app_theme" }, [LoadPersistedStateMiddleware_1.LoadPersistedStateMiddleware, PersistMiddleware_1.PersistMiddleware]);
        expect(store.getState()).toEqual({ theme: "dark" });
    });
});
