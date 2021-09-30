/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["jest-extended"],
  modulePathIgnorePatterns: ["/dist"],
  silent: true,
};
