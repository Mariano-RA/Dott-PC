import { apiUrl } from "../utils/utils";

export async function GET() {
  const categorys = await fetch(`${apiUrl}/api/productos/categorias`);
  const arrCategorys = await categorys.json();
  return arrCategorys;
}
