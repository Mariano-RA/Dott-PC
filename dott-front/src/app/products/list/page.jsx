"use client";
import React, { useContext, useEffect, useState } from "react";
import ProductCard from "@/app/components/ProductCard";
import Pagination from "@/app/components/Pagination";
import CategoryColumn from "@/app/components/CategoryColumn";
import Dropdown from "@/app/components/Dropdown";
import ProveedorDropdown from "@/app/components/ProveedorDropdown";
import Loading from "@/app/components/Loading";
import TableProducts from "@/app/components/TableProducts";
import { ContextGlobal } from "@/app/components/utils/global.context";
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/20/solid";

const take = 20;

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Page = () => {
  const [products, setProducts] = useState([]);
  const [sortType, setSortType] = useState("nombreAsc");
  const [productLength, setProductLength] = useState(0);
  const [page, setPage] = useState(1);
  const { state } = useContext(ContextGlobal);
  const [showLoading, setShowLoading] = useState(true);
  const [showTypeGrid, setShowTypeGrid] = useState(false);
  const [filterProveedor, setFilterProveedor] = useState("");

  function handleSelectedSort(sortType) {
    setSortType(sortType);
  }

  function handlePagination(newPage) {
    setPage(newPage);
  }

  function handleSelectProveedor(proveedorKey) {
    setFilterProveedor(proveedorKey);
    setPage(1); // resetear paginado si es necesario
  }

  function handleVisualizer(visualizerType) {
    switch (visualizerType) {
      case "List":
        setShowTypeGrid(false);
        break;
      case "Grid":
        setShowTypeGrid(true);
        break;
      default:
        setShowTypeGrid(false);
        break;
    }
  }

  const renderProducts = () => {
    if (showTypeGrid) {
      return (
        <>
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </>
      );
    } else {
      return (
        <>
          <TableProducts products={products} />
        </>
      );
    }
  };

  async function handleLoadProducts() {
    const params = new URLSearchParams({
      skip: page.toString(),
      take: take.toString(),
      orderBy: sortType,
    });

    if (filterProveedor) params.append("proveedor", filterProveedor);

    const res = await fetch(`/api/nest/products/list?${params.toString()}`);
    const { response } = await res.json();

    setProducts(response.productos);
    setProductLength(response.cantResultados);
    setShowLoading(false);
  }

  useEffect(() => {
    handleLoadProducts();
  }, [state, setSortType, sortType, setPage, page, filterProveedor]);
  return (
    <div className="flex">
      {showLoading ? (
        <Loading />
      ) : (
        <div className="flex justify-center w-full">
          <CategoryColumn />
          <div className="flex-grow w-full flex flex-col justify-between">
            <div className="flex w-full justify-between items-center py-8 px-14">
              <p className="text-red-950 font-bold text-lg">
                Todos los productos
              </p>
              <div className="flex flex-col sm:flex-row">
                <div className="flex mr-2 justify-center mb-2 sm:mb-0">
                  <button
                    onClick={() => handleVisualizer("List")}
                    className={classNames(
                      !showTypeGrid
                        ? "bg-gray-100 text-red-700"
                        : "text-red-950",
                      "block px-2 py-1 text-sm"
                    )}
                  >
                    <ListBulletIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleVisualizer("Grid")}
                    className={classNames(
                      showTypeGrid
                        ? "bg-gray-100 text-red-700"
                        : "text-red-950",
                      "block px-2 py-1 text-sm"
                    )}
                  >
                    <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                  <Dropdown handleSort={handleSelectedSort} />
                  <ProveedorDropdown
                    handleSelectProveedor={handleSelectProveedor}
                  />
              </div>
            </div>
            <div className="flex flex-grow flex-wrap justify-evenly md:justify-start w-full items-start px-0 md:px-14 content-start max-xl:gap-x-[.3%] gap-x-[3%]">
              {renderProducts()}
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
