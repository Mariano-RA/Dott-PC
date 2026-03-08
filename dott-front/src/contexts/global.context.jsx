"use client";
import { createContext, useReducer, useMemo, useEffect } from "react";
import { isValidCartItems } from "@/lib/cart-types";
import { api } from "@/constants/routes";

export const initialState = {
  productCart: [],
  categorys: [],
};

export const ContextGlobal = createContext(undefined);

function reducer(state, action) {
  switch (action.type) {
    case "add_cart":
      return {
        ...state,
        productCart: [...state.productCart, action.payload],
      };
    case "set_categorys":
      return {
        ...state,
        categorys: action.payload,
      };
    case "remove_cart":
      return {
        ...state,
        productCart: state.productCart.filter(
          (item) => item.id !== action.payload
        ),
      };
    case "update_cart":
      return {
        ...state,
        productCart: state.productCart.map(item =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        ),
      };

    case "set_state":
      return action.state;
    default:
      return state;
  }
}

export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const storedState = localStorage.getItem("appState");
    if (!storedState) return;
    try {
      const parsed = JSON.parse(storedState);
      const productCart = isValidCartItems(parsed?.productCart)
        ? parsed.productCart
        : [];
      const categorys = Array.isArray(parsed?.categorys) ? parsed.categorys : [];
      dispatch({
        type: "set_state",
        state: { productCart, categorys },
      });
    } catch {
      // Estado corrupto o formato antiguo: no hidratar
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state, dispatch]);

  useEffect(() => {
    const getCategorys = async () => {
      const resVal = await fetch(api.nest.categorys);
      const { categorys } = await resVal.json();
      dispatch({ type: "set_categorys", payload: categorys });
    };
    getCategorys();
  }, []);

  const addCart = (item) => {
    dispatch({ type: "add_cart", payload: item });
  };

  const removeCart = (itemId) => {
    dispatch({ type: "remove_cart", payload: itemId });
  };
  const updateCart = (itemId, quantity) => {
    dispatch({ type: 'update_cart', payload: { id: itemId, quantity: quantity } });
  };

  const value = useMemo(() => {
    return { state, dispatch, addCart, removeCart, updateCart };
  }, [state]);

  return (
    <ContextGlobal.Provider value={value}>{children}</ContextGlobal.Provider>
  );
};
