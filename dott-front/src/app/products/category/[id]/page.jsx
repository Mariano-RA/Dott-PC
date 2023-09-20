"use client";
import React, { useContext, useEffect, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";
import CategoryColumn from "@/app/components/CategoryColumn";
import Dropdown from "@/app/components/Dropdown";
import { ContextGlobal } from "@/app/components/utils/global.context";

const take = 20;

const Page = ({ params }) => {
  useEffect(() => {
    handleLoadProducts();
  }, [params]);

  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("nombreAsc");
  const [productLength, setProductLength] = useState(0);
  const [page, setPage] = useState(1);

  const { state } = useContext(ContextGlobal);

  function handleSelectedSort(sortType) {
    setSortType(sortType);
  }

  function handlePagination(newPage) {
    setPage(newPage);
  }

  async function handleLoadProducts() {
    if (state.apiUrl) {
      const response = await fetch(
        `${state.apiUrl}/api/productos/categoria?category=${params.id}&skip=${page}&take=${take}&orderBy=${sortType}`
      );
      const data = await response.json();
      setProducts(data.productos);
      setProductLength(data.cantResultados);
    }
  }

  useEffect(() => {
    handleLoadProducts();
  }, [state, setSortType, sortType, setPage, page]);
  return (
    <div className="flex justify-center ">
      <CategoryColumn />
      <div className="flex-grow w-full">
        <div className="flex w-full justify-between items-center py-8 px-14">
          <p className="text-red-950 font-bold text-lg">
            {params.id.replace("%20", " ")}
          </p>
          <Dropdown handleSort={handleSelectedSort} />
        </div>
        <div className="flex flex-wrap justify-evenly w-full items-center px-0 md:px-14">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
        <div className="px-14">
          <Pagination
            actualPage={page}
            cantPages={productLength}
            newPage={handlePagination}
          />
        </div>
      </div>
    </div>
  );
};

export default Page;
