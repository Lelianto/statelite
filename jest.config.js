/** @type {import('jest').Config} */
const config = {
	preset: "ts-jest",
	testEnvironment: "jest-environment-jsdom",
	setupFiles: ["<rootDir>/jest.setup.js"],
};

module.exports = config;
