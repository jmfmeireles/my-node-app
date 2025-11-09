import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest", // Transform TypeScript files
  },
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "utils/seedDatabase.ts"],
};

export default config;
