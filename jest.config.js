/**
 * Configuração do Jest para testes automatizados
 * Wayne App - Sistema de Mensagens
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Caminho para o diretório Next.js
  dir: './'
});

// Configuração customizada do Jest
const customJestConfig = {
  // Ambiente de teste
  testEnvironment: 'jest-environment-jsdom',
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Diretórios a serem ignorados
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Setup de arquivos antes dos testes
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  
  // Mapeamento de módulos (CORRIGIDO)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    // Mock de arquivos estáticos
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/src/__tests__/__mocks__/fileMock.js'
  },
  
  // Configuração de cobertura
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/globals.css',
    '!src/app/layout.tsx'
  ],
  
  // Diretório de relatórios de cobertura
  coverageDirectory: 'coverage',
  
  // Formatos de relatório de cobertura
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Limites de cobertura (desabilitados temporariamente)
  // coverageThreshold: {
  //   global: {
  //     branches: 10,
  //     functions: 10,
  //     lines: 10,
  //     statements: 10
  //   }
  // },
  
  // Configuração de timeout
  testTimeout: 10000,
  
  // Configuração para testes assíncronos
  maxWorkers: '50%',
  
  // Configuração de cache
  cache: true,
  
  // Configuração para mock de módulos
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Configuração de verbose
  verbose: true,
  
  // Configuração para detectar handles abertos
  detectOpenHandles: true,
  forceExit: true,
  
  // Transformar arquivos TypeScript e JavaScript
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  
  // Transformar módulos ESM
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|@radix-ui)/)'
  ],
  
  // Extensões de arquivos
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Resolver módulos ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx']
};

// Criar e exportar configuração do Jest
module.exports = createJestConfig(customJestConfig);