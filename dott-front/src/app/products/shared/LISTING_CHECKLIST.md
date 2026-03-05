# Checklist funcional y visual del listado

## Criterio de exito
- La experiencia de `list`, `category` y `keywords` comparte contrato de datos, toolbar, estados de carga/error/vacio y paginacion.
- Grid y list muestran la misma jerarquia semantica: nombre, precio, acciones.
- El usuario siempre ve estado del listado (resultados, orden, proveedor) y cuenta con acciones de salida.
- Cambios rapidos de filtros/pagina no dejan datos stale ni parpadeos abruptos.

## Casos funcionales obligatorios
- Carga inicial de resultados por pantalla.
- Cambio de pagina con controles `Anterior`, `Siguiente`, `Primera`, `Ultima` y paginas intermedias.
- Cambio de orden.
- Filtro por proveedor.
- Cambio de vista `Lista` / `Grilla`.
- Visualizacion de chips de filtros activos y remocion individual.
- `Limpiar todo` para volver al estado default.
- `Ver todos los productos` disponible en empty/error cuando aplica.
- Reintento manual ante error de API.

## Estados UX obligatorios
- Loading: skeleton consistente sin layout shift relevante.
- Empty: mensaje claro + CTA `Ver todos los productos` + `Limpiar filtros`.
- Error: mensaje claro + boton `Reintentar`.
- Data: resumen visible del estado del listado (ej: "Mostrando X de Y · Ordenado por · Proveedor").

## Consistencia visual
- Toolbar identica en las 3 pantallas (misma estructura y orden).
- Sidebar de categorias sticky en desktop, no intrusiva, con estado activo visible.
- Densidad legible en mobile y desktop, con foco/hover visibles.

## Objetivos de performance
- Reducir rerenders innecesarios con `memo` en componentes de lista pesados.
- Cortar fetch previo con `AbortController` al cambiar filtros/pagina rapido.
- Evitar condiciones de carrera (solo ultimo request impacta en UI).
