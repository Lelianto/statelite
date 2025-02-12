
Object.defineProperty(global, "localStorage", {
	value: {
		getItem: jest.fn(() => JSON.stringify({ theme: "dark" })), // Mocked state
		setItem: jest.fn(),
		removeItem: jest.fn(),
	},
	writable: true,
});
