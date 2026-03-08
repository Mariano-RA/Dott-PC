"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { ContextGlobal } from "@/contexts/global.context";
import { fetchCalculatorConfig } from "@/lib/api";
import { fetchQuotePlans } from "@/lib/api/quote";
import {
  buildPlansFromConfig,
  buildPlansFromQuote,
  type DisplayPlan,
} from "@/lib/cart-plans";
import { fetchDolarValue } from "@/lib/api/dolar";
import type { CartItem } from "@/lib/cart-types";

export type AlertState = {
  show: boolean;
  message: string;
  type: "error" | "success";
};

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqagravw";

type CartContextValue = { state: { productCart: CartItem[]; categorys: unknown[] } };
export function useCartData(open: boolean) {
  const ctx = useContext(ContextGlobal) as CartContextValue | undefined;
  const state = ctx?.state ?? { productCart: [], categorys: [] };
  const [displayPlans, setDisplayPlans] = useState<DisplayPlan[]>([]);
  const [valorDolar, setValorDolar] = useState(0);
  const [clientName, setClientName] = useState("");
  const [clientWsp, setClientWsp] = useState("");
  const [alerta, setAlerta] = useState<AlertState>({
    show: false,
    message: "",
    type: "error",
  });

  const totalCart = useMemo(() => {
    return (state.productCart as CartItem[]).reduce(
      (acc, item) => acc + item.precioEfectivo * item.quantity,
      0
    );
  }, [state.productCart]);

  useEffect(() => {
    fetchDolarValue().then(setValorDolar);
  }, []);

  useEffect(() => {
    if (!open || totalCart <= 0) {
      setDisplayPlans([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const config = await fetchCalculatorConfig();
        if (cancelled) return;
        const plans = buildPlansFromConfig(totalCart, config);
        if (plans.length > 0) {
          setDisplayPlans(plans);
          return;
        }
        const quotePlans = await fetchQuotePlans();
        if (!cancelled && Array.isArray(quotePlans) && quotePlans.length > 0) {
          setDisplayPlans(buildPlansFromQuote(totalCart, quotePlans));
        }
      } catch {
        if (!cancelled) setDisplayPlans([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, totalCart]);

  const handleCloseAlert = () => {
    setAlerta((prev) => ({ ...prev, show: false }));
  };

  const handlePresupuesto = async () => {
    const nombre = clientName.trim();
    const whatsapp = clientWsp.trim();

    if (!nombre || !whatsapp) {
      setAlerta({
        show: true,
        message:
          "Por favor, completa tu nombre y WhatsApp para enviar el presupuesto. ",
        type: "error",
      });
      return;
    }

    const budgetData = {
      subject: `Presupuesto para ${nombre}`,
      cliente_nombre: nombre,
      cliente_whatsapp: whatsapp,
      productos: (state.productCart as CartItem[])
        .map(
          (item) =>
            `Producto: ${item.producto}\n` +
            `Cantidad: ${item.quantity}\n` +
            `Proveedor: ${item.proveedor}\n` +
            `Precio en efectivo: $${item.quantity * item.precioEfectivo}`
        )
        .join("\n====================\n"),
      total_efectivo: `$${totalCart}`,
    };

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(budgetData),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        setAlerta({
          show: true,
          message: `¡Gracias ${nombre}! Tu presupuesto fue enviado. Te contactaremos por WhatsApp a la brevedad.`,
          type: "success",
        });
        setClientName("");
        setClientWsp("");
      } else {
        setAlerta({
          show: true,
          message:
            "Hubo un problema al enviar el presupuesto. Por favor, intenta de nuevo más tarde.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      setAlerta({
        show: true,
        message:
          "Error de conexión. No se pudo enviar el presupuesto, revisa tu internet.",
        type: "error",
      });
    }
  };

  return {
    productCart: state.productCart as CartItem[],
    totalCart,
    displayPlans,
    valorDolar,
    clientName,
    setClientName,
    clientWsp,
    setClientWsp,
    alerta,
    handleCloseAlert,
    handlePresupuesto,
  };
}
