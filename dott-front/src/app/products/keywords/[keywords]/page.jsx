"use client";
import React, { useContext, useEffect, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";
import CategoryColumn from "@/app/components/CategoryColumn";
import Dropdown from "@/app/components/Dropdown";
import Loading from "@/app/components/Loading";
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
  const [showLoading, setShowLoading] = useState(true);

  function handleSelectedSort(sortType) {
    setSortType(sortType);
  }

  function handlePagination(newPage) {
    setPage(newPage);
  }

  async function handleLoadProducts() {
    const resVal = await fetch(
      `/api/nest/products/keywords?keywords=${params.keywords}&skip=${page}&take=${take}&orderBy=${sortType}`
    );

    const { response } = await resVal.json();

    setProducts(response.productos);
    setProductLength(response.cantResultados);
    setShowLoading(false);
  }

  useEffect(() => {
    handleLoadProducts();
  }, [state, setSortType, sortType, setPage, page]);
  return (
    <div className="flex">
      {showLoading ? (
        <Loading />
      ) : (
        <div className="flex justify-center">
          <CategoryColumn />
          <div className="flex-grow w-full">
            <div className="flex w-full justify-between items-center py-8 px-14">
              <p className="text-red-950 font-bold text-lg">
                Todos los productos
              </p>
              <Dropdown handleSort={handleSelectedSort} />
            </div>
            <div className="flex flex-wrap justify-evenly w-full items-center px-0 md:px-14">
              {products?.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
            <div className="px-14">
              <Pagination
                actualPage={page}
                cantItems={productLength}
                itemsPerPage={take}
                newPage={handlePagination}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
