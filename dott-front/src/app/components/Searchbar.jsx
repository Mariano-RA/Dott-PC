import { redirect, useRouter } from "next/navigation";
import React, { useState } from "react";

const Searchbar = () => {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  function handleSearchValue(e) {
    setSearchValue(e.target.value);
  }

  function searchProduct(e) {
    e.preventDefault();
    if (searchValue) {
      router.push(`/products/keywords/${searchValue}`);
    } else {
      router.push("/products/list");
    }
  }

  return (
    <form onSubmit={searchProduct}>
      <input
        className="rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 text-red-950"
        type="text"
        value={searchValue}
        onChange={handleSearchValue}
        placeholder="Buscar.."
      ></input>
    </form>
  );
};

export default Searchbar;
