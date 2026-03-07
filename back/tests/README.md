# Tests por dominio

Esta carpeta organiza **pruebas de integración** por dominio. Las **pruebas unitarias** (`*.spec.ts`) siguen junto al código en `src/`.

## Estructura

```
tests/
├── README.md
├── auth/           # Guards, permisos
├── cuota/          # Planes de cuota
├── dolar/          # Cotización dólar
├── productos/      # Productos y cola Python
├── proveedor/      # CRUD proveedores
└── calculator-settings/
```

## Tipos de pruebas

- **Unitarias:** en `src/**/*.spec.ts`. Prueban una clase aislada con dependencias mockeadas.
- **Integración:** en `tests/<dominio>/*.integration.spec.ts`. Levantan el módulo Nest (con mocks de BD/externos) y prueban flujos completos.
- **E2E:** en `test/*.e2e-spec.ts`. Prueban la API HTTP de punta a punta.

## Cómo ejecutar

```bash
# Unitarias (src)
npm run test

# Integración (tests/)
npm run test:integration

# E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

## Convenciones

- Usar mocks para TypeORM (getRepositoryToken), RabbitMQ y servicios externos.
- En integración, preferir `Test.createTestingModule()` con el módulo real y reemplazar solo lo necesario (DB, colas).
- Nombres: `*.integration.spec.ts` para integración, `*.spec.ts` para unidad.
