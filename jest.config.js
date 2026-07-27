/** @type {import('jest').Config} */
const config = {
	preset: "ts-jest",
	testEnvironment: "node",
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.test.ts"],
};

module.exports = config;
