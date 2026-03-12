# Plan de Revisión y Refactorización del Frontend

El análisis del proyecto `dott-front` revela que, si bien la aplicación funciona y tiene UI elaborada, **la lógica de negocio está fuertemente acoplada a la vista**, lo que dificulta la mantenibilidad, legibilidad y el testeo.

A continuación, se proponen los patrones de diseño y arquitecturas recomendadas para mejorar la calidad del código.

## User Review Required

> [!IMPORTANT]
> **Refactorización de Lógica de Negocio y TypeScript**. Hay archivos muy grandes (como [Cart.jsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx) de +480 líneas y [calculadora/page.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/calculadora/page.tsx) de +490 líneas). Estas refactorizaciones pueden requerir tiempo. Se recomienda decidir si se implementarán los cambios gradualmente (feature por feature) o en un proceso de refactor global. Además, algunos archivos están en [.jsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx) a pesar de que el proyecto está configurado para TypeScript, convendría migrarlos a [.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/page.tsx).

## Proposed Changes

### Patrones de Diseño Recomendados

#### 1. Custom Hooks Pattern (Separación de Intereses)
Actualmente, componentes como [calculadora/page.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/calculadora/page.tsx) y [Cart.jsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx) tienen decenas de cálculos matemáticos, llamadas a la API ([fetch](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/calculadora/page.tsx#116-181)) y manejo de estados internamente.
* **Propuesta:** Extraer toda esa lógica a Custom Hooks (e.g., `useCalculatorLogic.ts`, `useCartData.ts`).
* **Beneficio:** Los componentes se vuelven declarativos (sólo se encargan de pintar la UI basándose en lo que devuelve el hook). La lógica de cálculo de comisiones e impuestos puede ser testeada de forma aislada sin montar componentes React.

#### 2. Pattern Adapter (Capa de Servicios)
Se observan `useEffect` haciendo llamadas directas a `/api/nest/...` y luego transformando/parseando las respuestas dentro del mismo componente (por ejemplo, el mapeo de planes de cuotas).
* **Propuesta:** Crear una capa de servicios o adaptadores en la carpeta `src/services/` o `src/lib/api/` que realice los fetches y devuelva los datos sanitizados.
* **Beneficio:** Si la API cambia su contrato o respuesta, solo modificas el adaptador, no los 10 componentes donde se llame.

#### 3. Reorganización de Arquitectura (Colocación de Componentes)
El directorio `src/app/components` contiene componentes reutilizables genéricos (como `Navbar`, [Cart](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx#9-487), `Footer`, etc.). En el App Router de Next.js, la carpeta `app/` debería reservarse mayormente para el enrutamiento ([page.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/page.tsx), [layout.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/layout.tsx), `route.ts`).
* **Propuesta:** Mover todos los componentes que no sean de ruta a `src/components/`, separándolos en dominios (`src/components/ui`, `src/components/cart`, `src/components/products`, etc.).
* **Beneficio:** Menor confusión acerca de los límites de las rutas y mejor organización escalar.

#### 4. Tipado Estricto (Migración a TypeScript)
Se utilizan archivos [.jsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx) en un proyecto con [.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/page.tsx). Componentes sensibles que manejan dinero y carritos se benefician inmensamente del tipado.
* **Propuesta:** Renombrar archivos [.jsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx) clave a [.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/page.tsx) e implementar interfaces formales (ej: [Product](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/ProductOverview.jsx#17-189), `CartItem`, [GatewayConfig](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/calculadora/page.tsx#30-39)).
* **Beneficio:** Prevención de errores en tiempo de compilación.


## Verification Plan

### Manual Verification
1. Comenzar la refactorización con un solo componente grande (ej. [calculadora/page.tsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/calculadora/page.tsx)).
2. Extraer su lógica a un hook `useCalculator` sin cambiar la UI en absoluto.
3. Verificar en el entorno de desarrollo (`npm run dev`) que la calculadora todavía arroje los mismos resultados exactos para las comisiones de Mercadopago, Taca-taca y Payway comparando el antes y el después.
4. Repetir el proceso gradualmente con [Cart.jsx](file:///e:/Mis%20proyectos/Dott-PC/dott-front/src/app/components/Cart.jsx).
