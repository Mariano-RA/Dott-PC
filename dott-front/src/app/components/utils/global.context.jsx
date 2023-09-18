"use client";
import { createContext, useReducer, useMemo, useEffect } from "react";

export const initialState = {
  data: [],
  productCart: [],
  valorCuotas: [],
  apiUrl: "",
  apiPythonUrl: "",
};

export const ContextGlobal = createContext(undefined);

const apiUrl = process.env.NEXT_PUBLIC_APP_API_SERVER_URL;
const apiPythonUrl = process.env.NEXT_PUBLIC_PYTHON_API_SERVER_URL;

function reducer(state, action) {
  switch (action.type) {
    case "set_data":
      return {
        ...state,
        data: action.data,
      };

    case "set_apiUrl":
      return {
        ...state,
        apiUrl: action.data,
      };
    case "set_apiPythonUrl":
      return {
        ...state,
        apiPythonUrl: action.data,
      };
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
    case "set_valorCuota":
      return {
        ...state,
        valorCuotas: action.data,
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
  }, [state]);

  useEffect(() => {
    dispatch({ type: "set_apiUrl", data: apiUrl });
  }, []);

  useEffect(() => {
    dispatch({ type: "set_apiPythonUrl", data: apiPythonUrl });
  }, []);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/productos/categorias`);
        const data = await response.json();
        dispatch({ type: "set_data", data });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    getData();
  }, []);

  useEffect(() => {
    const getValorCuotas = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/cuota`);
        const data = await response.json();
        dispatch({ type: "set_valorCuota", data });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    getValorCuotas();
  }, []);

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
