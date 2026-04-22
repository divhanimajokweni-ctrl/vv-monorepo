{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src", "<rootDir>/__tests__"],
  "testMatch": [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.spec.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts"
  ],
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
  "moduleNameMapping": {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@vv/(.*)$": "<rootDir>/../packages/$1/src/index.ts"
  }
}