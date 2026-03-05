import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const Searchbar = () => {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  function handleSearchValue(e) {
    setSearchValue(e.target.value);
  }

  function searchProduct(e) {
    e.preventDefault();
    const query = searchValue.trim().replace(/\s+/g, " ");

    if (query) {
      router.push(`/products/keywords/${encodeURIComponent(query)}`);
    } else {
      router.push("/products/list");
    }
  }

  return (
    <form onSubmit={searchProduct} className="w-full max-w-md">
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-red-400">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
        <input
          className="w-full bg-transparent py-1 text-sm text-red-950 placeholder:text-red-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          type="text"
          value={searchValue}
          onChange={handleSearchValue}
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
        />
        <button
          type="submit"
          className="rounded-md bg-red-950 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-red-900 focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Buscar
        </button>
      </div>
    </form>
  );
};

export default Searchbar;
