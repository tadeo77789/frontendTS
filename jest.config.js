const path = require('node:path');

// expo-modules-core puede quedar dentro de node_modules/expo/ o en la raiz de node_modules,
// segun como se haya instalado (npm install vs npm ci). Se busca desde expo para
// cubrir los dos casos sin depender de una ruta fija.
const expoDir = path.dirname(require.resolve('expo/package.json'));
const expoModulesCoreDir = path.dirname(
  require.resolve('expo-modules-core/package.json', { paths: [expoDir] }),
);

module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**', '!src/**/*.d.ts'],
  moduleNameMapper: {
    '^expo-modules-core(/.*)?$': `${expoModulesCoreDir}$1`,
    '\\.glb$': '<rootDir>/jest.assetMock.js',
  },
};
