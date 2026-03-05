export const LISTING_TAKE = 20;

export const SORT_TYPES = [
  { key: "mayor", value: "Mayor precio" },
  { key: "menor", value: "Menor precio" },
  { key: "nombreAsc", value: "Nombre, A - Z" },
  { key: "nombreDesc", value: "Nombre, Z - A" },
];

export const PROVEEDORES = [
  { key: "", value: "Proveedores" },
  { key: "air", value: "Air" },
  { key: "eikon", value: "Eikon" },
  { key: "elit", value: "Elit" },
  { key: "mega", value: "Mega" },
  { key: "hdc", value: "Hdc" },
  { key: "invid", value: "Invid" },
  { key: "nb", value: "Nb" },
];

export function getSortLabel(sortKey) {
  return SORT_TYPES.find((option) => option.key === sortKey)?.value || "Ordenar por";
}

export function getProveedorLabel(proveedorKey) {
  return PROVEEDORES.find((option) => option.key === proveedorKey)?.value || "Proveedores";
}
