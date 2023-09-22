import { apiUrl } from "../../utils/utils";

export async function GET(page, take, sortType, keywords) {
  const response = await fetch(
    `${apiUrl}/api/productos/buscarPorPalabrasClaves?keywords=${keywords}&skip=${page}&take=${take}&orderBy=${sortType}`
  );
  const data = await response.json();
  return data;
}
