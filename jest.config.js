module.exports = {
  roots: ['<rootDir>/src'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testMatch: ['<rootDir>/**/?(*.)+(spec|test).+(ts|tsx|js)'],
  // setupFiles: ['./jest-setup.ts'],
  collectCoverage: true,
};
