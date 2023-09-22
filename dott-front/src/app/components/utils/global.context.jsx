"use client";
import { createContext, useReducer, useMemo, useEffect } from "react";
import { getCuotas } from "@/app/api/nest/quote/route";
import { getCategorys } from "@/app/api/nest/categorys/route";

export const initialState = {
  productCart: [],
};

export const ContextGlobal = createContext(undefined);

function reducer(state, action) {
  switch (action.type) {
    case "add_cart":
      return {
        ...state,
        productCart: [...state.productCart, action.payload],
      };
    case "remove_cart":
      return {
        ...state,
        productCart: state.productCart.filter(
          (item) => item.id !== action.payload
        ),
      };

    case "set_state":
      return action.state; // Para inicializar el estado desde el Local Storage
    default:
      return state;
  }
}

export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const storedState = localStorage.getItem("appState");
    if (storedState) {
      dispatch({
        type: "set_state",
        state: JSON.parse(storedState),
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state, dispatch]);

  const addCart = (item) => {
    dispatch({ type: "add_cart", payload: item });
  };

  const removeCart = (itemId) => {
    dispatch({ type: "remove_cart", payload: itemId });
  };

  const value = useMemo(() => {
    return { state, dispatch, addCart, removeCart };
  }, [state]);

  return (
    <ContextGlobal.Provider value={value}>{children}</ContextGlobal.Provider>
  );
};
