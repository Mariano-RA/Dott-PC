# Dott Front

## Desarrollo local

```bash
npm install
npm run dev
```

Aplicación en `http://localhost:8090`.

## Debug local en PC

1. Crear archivo local de variables:

```bash
cp .env.local.example .env.local
```

En Windows PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

2. Completar en `.env.local` los datos de Auth0 (`AUTH0_*`) y URLs de APIs.

3. Valores recomendados para desarrollo local:

- `AUTH0_BASE_URL=http://localhost:8090`
- `NEXT_PUBLIC_APP_API_SERVER_URL=http://localhost:3000` (Nest local)
- `NEXT_PUBLIC_PYTHON_API_SERVER_URL=http://localhost:5000` (Python local por docker-compose)

4. Opcional: bypass de Auth0 solo para desarrollo local (pantalla Admin sin login/roles)

- `NEXT_PUBLIC_LOCAL_DEV_AUTH_BYPASS=true`
- `LOCAL_DEV_AUTH_BYPASS=true`
- `LOCAL_DEV_AUTH_BEARER_TOKEN=` (si tu backend exige JWT incluso en local, pegalo aca)

5. Iniciar el proyecto:

```bash
npm install
npm run dev
```

Nota: si faltan variables de API, el proyecto usa fallback local en `http://localhost:3000` y `http://localhost:8000`.

## Plan UI Style System (Aprobado)

- Rama de trabajo: `feat/ui-style-system`.
- Estado de plan: **aprobado**.
- Freeze visual: se congelan cambios visuales paralelos hasta cerrar fase 3.
- Owner revisión UI: **Frontend Lead (UI Owner)**.

### Fase 1 — Base de diseño y configuración

- Unificación de Tailwind en `tailwind.config.ts`.
- Tokens de color (`brand`, `neutral`, `success`, `warning`, `danger`), radios, sombras y transiciones.
- `maxWidth.content` para layout principal.
- Estilos globales de tipografía base, focus visible y utilidad `.container-page`.

### Fase 2 — UI Kit base

- Componentes base en `src/app/components/ui`: `Button`, `Input`, `Card`, `Badge`.
- API consistente de props: `variant`, `size`, `className`.
- Estados visuales: hover, active, focus, disabled y error (según componente).

### Fase 3 — Migración por pantallas críticas

- Orden de migración:
	- `src/app/page.tsx`
	- `src/app/products/**`
	- `src/app/admin/**`
	- `src/app/contact/**`
- Reemplazo progresivo de componentes legacy por UI Kit.

### Fase 4 — QA visual y accesibilidad

- Checklist responsive en mobile/tablet/desktop.
- Validación de navegación por teclado y focus.
- Revisión de contraste WCAG y estados vacíos/error/loading.

## UI Kit — uso mínimo

Exportaciones desde:

`src/app/components/ui/index.ts`

Ejemplo de uso:

```tsx
import { Badge, Button, Card, CardContent, CardHeader, Input } from "@/app/components/ui";

function Example() {
	return (
		<Card>
			<CardHeader>
				<h3>Nuevo producto</h3>
			</CardHeader>
			<CardContent className="space-y-3">
				<Input label="Nombre" placeholder="Ingresá el nombre" helpText="Campo obligatorio" />
				<div className="flex items-center gap-2">
					<Badge variant="success">Activo</Badge>
					<Button variant="primary">Guardar</Button>
				</div>
			</CardContent>
		</Card>
	);
}
```
