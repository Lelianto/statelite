import { createStatelite } from "../src"; // Adjust the import path if necessary

describe("createStatelite", () => {
	test("should return initial state", () => {
		const store = createStatelite({ theme: "light", count: 0 });
		expect(store.getState()).toEqual({ theme: "light", count: 0 });
	});

	test("should update state", () => {
		const store = createStatelite({ theme: "light", count: 0 });
		store.setState({ theme: "dark" });
		expect(store.getState()).toEqual({ theme: "dark", count: 0 });
	});

	test("should notify subscribers on state change", () => {
		const store = createStatelite({ theme: "light", count: 0 });
		const mockListener = jest.fn();

		// Subscribe to state changes
		store.subscribe(mockListener);

		// Change state
		store.setState({ theme: "dark" });

		// Ensure listener is called with updated state
		expect(mockListener).toHaveBeenCalledWith({ theme: "dark", count: 0 });
	});

	test("should unsubscribe from state changes", () => {
		const store = createStatelite({ theme: "light", count: 0 });
		const mockListener = jest.fn();

		// Subscribe to state changes
		const unsubscribe = store.subscribe(mockListener);

		// Change state
		store.setState({ theme: "dark" });

		// Ensure listener is called
		expect(mockListener).toHaveBeenCalledWith({ theme: "dark", count: 0 });

		// Unsubscribe and change state again
		unsubscribe();
		store.setState({ theme: "light" });

		// Ensure listener is not called after unsubscribe
		expect(mockListener).toHaveBeenCalledTimes(1);
	});

	test("should update state using a function", () => {
		const store = createStatelite({ theme: "light", count: 0 });
		store.setState(prevState => ({
			theme: "dark",
			count: prevState.count + 1,
		}));

		expect(store.getState()).toEqual({ theme: "dark", count: 1 });
	});

	test("should select part of the state", () => {
		const store = createStatelite({ theme: "light", count: 0 });

		// Select specific part of the state
		const selectedTheme = store.select((state) => state.theme);
		const selectedCount = store.select((state) => state.count);

		expect(selectedTheme).toBe("light");
		expect(selectedCount).toBe(0);
	});

	test("should update partial state using a function", () => {
		const store = createStatelite({ theme: "light", count: 0 });
		store.setState(prevState => ({
			theme: "dark",
		}));

		// Ensure count is not changed
		expect(store.getState()).toEqual({ theme: "dark", count: 0 });
	});
});
