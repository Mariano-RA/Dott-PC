import { apiUrl } from "../utils/route";

export async function getCategorys() {
  const categorys = await fetch(`${apiUrl}/api/productos/categorias`);
  const arrCategorys = await categorys.json();
  return arrCategorys;
}
