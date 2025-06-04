module.exports = {
  // No specific transform needed for now as backend uses CommonJS
  // and frontend functions will be explicitly exported for testing.
  // If frontend scripts were using ES6 modules or JSX, Babel would be configured here.
  testEnvironment: 'node', // Explicitly set to node, though it's the default
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ]
};
