export const LISTING_TAKE = 20;

export const SORT_TYPES = [
  { key: "mayor", value: "Mayor precio" },
  { key: "menor", value: "Menor precio" },
  { key: "nombreAsc", value: "Nombre, A - Z" },
  { key: "nombreDesc", value: "Nombre, Z - A" },
];

export function getSortLabel(sortKey) {
  return SORT_TYPES.find((option) => option.key === sortKey)?.value || "Ordenar por";
}
