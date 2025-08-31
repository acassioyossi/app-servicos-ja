# Testes Automatizados

Este diretório contém todos os testes automatizados da aplicação, organizados por tipo e funcionalidade.

## Estrutura dos Testes

```
src/__tests__/
├── __mocks__/           # Mocks globais
│   └── fileMock.js      # Mock para arquivos estáticos
├── mocks/               # Configuração do MSW
│   └── server.ts        # Servidor de mock para APIs
├── setup.ts             # Configuração global dos testes
├── app/                 # Testes das APIs
│   └── api/
│       ├── users.test.ts
│       └── transactions.test.ts
├── components/          # Testes dos componentes
│   ├── chat/
│   │   └── ChatWindow.test.tsx
│   └── ui/
│       ├── Button.test.tsx
│       └── Modal.test.tsx
├── hooks/               # Testes dos hooks
│   ├── useAuth.test.ts
│   └── useMessages.test.ts
├── lib/                 # Testes dos utilitários
│   ├── auth-service.test.ts
│   └── utils.test.ts
└── integration/         # Testes de integração
    └── auth-flow.test.ts
```

## Comandos de Teste

### Comandos Básicos

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

### Comandos Específicos

```bash
# Testes unitários (componentes, hooks, utilitários)
npm run test:unit

# Testes de integração
npm run test:integration

# Testes de API
npm run test:api

# Lint dos arquivos de teste
npm run test:lint
```

### Comandos Avançados

```bash
# Pipeline completo de CI
npm run test:ci

# Gerar relatório de testes
npm run test:report

# Limpar artefatos de teste
npm run test:clean
```

### Script de Teste Personalizado

```bash
# Usar o script personalizado
node scripts/test.js [comando]

# Exemplos:
node scripts/test.js all
node scripts/test.js coverage
node scripts/test.js specific "Button"
node scripts/test.js ci
```

## Configuração

### Jest

A configuração do Jest está em `jest.config.js` e inclui:

- **Ambiente**: jsdom para testes de componentes React
- **Setup**: Configuração global em `src/__tests__/setup.ts`
- **Mocks**: Mapeamento de módulos e arquivos estáticos
- **Cobertura**: Limites e relatórios configurados
- **Transformações**: TypeScript e JSX

### MSW (Mock Service Worker)

O MSW é usado para interceptar requisições HTTP nos testes:

- **Configuração**: `src/__tests__/mocks/server.ts`
- **Handlers**: Definidos para todas as APIs
- **Dados Mock**: Dados de teste consistentes

## Tipos de Teste

### 1. Testes Unitários

**Componentes UI**
- Renderização correta
- Interações do usuário
- Props e estados
- Acessibilidade

**Hooks**
- Estados e efeitos
- Funções retornadas
- Ciclo de vida
- Casos de erro

**Utilitários**
- Funções puras
- Validações
- Formatações
- Transformações

### 2. Testes de Integração

**Fluxos Completos**
- Autenticação
- CRUD de dados
- Navegação
- Estados globais

### 3. Testes de API

**Endpoints**
- Métodos HTTP
- Validações
- Autenticação
- Tratamento de erros

## Padrões de Teste

### Estrutura de Teste

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup antes de cada teste
  });

  afterEach(() => {
    // Cleanup após cada teste
  });

  it('should do something specific', () => {
    // Arrange
    const props = { ... };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### Mocking

```typescript
// Mock de módulo
jest.mock('@/lib/auth-service', () => ({
  verifyAccessToken: jest.fn()
}));

// Mock de função
const mockFunction = jest.fn();
mockFunction.mockResolvedValue(data);

// Mock de hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    login: jest.fn()
  })
}));
```

### Testes Assíncronos

```typescript
// Aguardar elemento aparecer
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Aguardar elemento desaparecer
await waitForElementToBeRemoved(
  screen.getByText('Loading...')
);

// Usar act para atualizações de estado
act(() => {
  fireEvent.click(button);
});
```

## Cobertura de Código

### Limites Configurados

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Relatórios

- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-summary.json`
- **Text**: Saída no terminal

## Debugging

### Executar Teste Específico

```bash
# Por nome do arquivo
npm test Button.test.tsx

# Por padrão
npm test -- --testNamePattern="should render"

# Por caminho
npm test -- --testPathPattern="components"
```

### Debug no VS Code

1. Adicionar breakpoint no código
2. Executar "Debug Jest Tests" no VS Code
3. Ou usar `debugger;` no código de teste

### Logs e Outputs

```typescript
// Debug de componente
screen.debug(); // Mostra DOM atual

// Debug de queries
screen.getByRole('button', { name: /click/i });
// Se falhar, mostra elementos disponíveis
```

## Boas Práticas

### 1. Nomenclatura

- Arquivos: `ComponentName.test.tsx`
- Describes: Nome do componente/função
- Tests: "should do something when condition"

### 2. Organização

- Um arquivo de teste por componente/módulo
- Agrupar testes relacionados com `describe`
- Setup/cleanup em `beforeEach`/`afterEach`

### 3. Assertions

- Usar matchers específicos do jest-dom
- Testar comportamento, não implementação
- Assertions claras e específicas

### 4. Mocks

- Mock apenas o necessário
- Limpar mocks entre testes
- Usar dados realistas

### 5. Performance

- Evitar testes desnecessariamente lentos
- Usar `screen.getBy*` ao invés de `container.querySelector`
- Cleanup adequado de timers e listeners

## Troubleshooting

### Problemas Comuns

**Teste não encontra elemento**
```typescript
// ❌ Muito específico
expect(screen.getByText('Exact text')).toBeInTheDocument();

// ✅ Mais flexível
expect(screen.getByText(/partial text/i)).toBeInTheDocument();
```

**Teste assíncrono falha**
```typescript
// ❌ Sem aguardar
fireEvent.click(button);
expect(screen.getByText('Result')).toBeInTheDocument();

// ✅ Com waitFor
fireEvent.click(button);
await waitFor(() => {
  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

**Mock não funciona**
```typescript
// ❌ Mock após import
import { myFunction } from './module';
jest.mock('./module');

// ✅ Mock antes de import
jest.mock('./module');
import { myFunction } from './module';
```

### Recursos Úteis

- [Testing Library Docs](https://testing-library.com/docs/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [MSW Docs](https://mswjs.io/docs/)
- [React Testing Examples](https://react-testing-examples.com/)

## Contribuindo

1. **Novos Testes**: Seguir a estrutura existente
2. **Mocks**: Adicionar em `__mocks__` se reutilizável
3. **Utilitários**: Adicionar helpers em `setup.ts`
4. **Documentação**: Atualizar este README quando necessário

## Comandos de Manutenção

```bash
# Atualizar snapshots
npm test -- --updateSnapshot

# Executar apenas testes modificados
npm test -- --onlyChanged

# Executar com verbose para mais detalhes
npm test -- --verbose

# Executar sem cache
npm test -- --no-cache
```