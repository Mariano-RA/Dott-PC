"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategorys } from "../api/nest/categorys/route";

export default function CategoryColumn() {
  const [categorys, setCategorys] = useState([]);

  useEffect(() => {
    const handleCategorys = async () => {
      const categorias = await getCategorys();
      setCategorys(categorias);
    };
    handleCategorys();
  }, []);

  return (
    <ul role="list" className="mx-24 hidden lg:flex flex-col">
      <p className="text-xl font-bold text-center py-5 text-red-950">
        Categorías
      </p>
      {categorys.map((category, index) => (
        <li key={index} className="flex justify-between">
          <div className="flex min-w-0">
            <div className="min-w-0 flex-auto">
              <Link href={`/products/category/${category}`}>
                <p className="mt-1 truncate text-xs leading-5 text-red-950 hover:text-red-600">
                  {category}
                </p>
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
