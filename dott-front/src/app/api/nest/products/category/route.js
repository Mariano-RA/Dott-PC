import { apiUrl } from "../../utils/utils";

export async function GET(page, take, sortType, id) {
  const response = await fetch(
    `${apiUrl}/api/productos/categoria?category=${id}&skip=${page}&take=${take}&orderBy=${sortType}`
  );
  const data = await response.json();
  return data;
}
