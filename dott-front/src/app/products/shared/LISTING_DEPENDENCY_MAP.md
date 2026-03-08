# Mini mapa de dependencias del listado

## Paginas
- `src/app/products/list/page.jsx`
: listado general de productos.
- `src/app/products/category/[id]/page.jsx`
: listado filtrado por categoria.
- `src/app/products/keywords/[keywords]/page.jsx`
: listado filtrado por keywords.

## Componentes compartidos consumidos por las 3 paginas
- `src/app/components/TableProducts.jsx`
: modo lista/tabular.
- `src/app/components/ProductCard.jsx`
: modo grilla.
- `src/app/components/Pagination.jsx`
: navegacion de paginas.
- `src/app/components/Dropdown.jsx`
: orden.
- `src/app/components/ProveedorDropdown.jsx`
: filtro proveedor.
- `src/app/components/CategoryColumn.jsx`
: sidebar categorias (desktop).

## Estado global y dependencias transversales
- `src/contexts/global.context.jsx`
: categorias, carrito, y estado compartido.
- `@auth0/nextjs-auth0/client`
: rol admin para mostrar columna proveedor en tabla.

## Hallazgos de duplicacion previos al refactor
- Logica repetida de fetch/paginado/sort/filtro en las 3 paginas.
- Toolbar repetida con controles de vista + sort + proveedor.
- Render condicional repetido para lista/grilla.
- Estados de carga/empty/error no estaban unificados.
