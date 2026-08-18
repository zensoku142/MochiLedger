module.exports = {
  preset: '@react-native/jest-preset',
  // pnpm stores packages under .pnpm; React Native's ESM setup files still need Babel transformation.
  transformIgnorePatterns: [
    'node_modules/.pnpm/(?!(?:react-native|@react-native\\+[^@]+)@)',
    'node_modules/(?!\\.pnpm/|((jest-)?react-native|@react-native(-community)?)/)',
  ],
};
