"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/constants/routes";

export type PlanRate = {
  id?: number;
  planKey: string;
  label: string;
  tasa: number;
  activo: boolean;
  orden: number;
};

export type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

const statusByKeyDefault: Record<string, RowStatus> = {};

function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const normalized = (value || "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useAdminRates() {
  const [rates, setRates] = useState<PlanRate[]>([]);
  const [statusByKey, setStatusByKey] = useState<Record<string, RowStatus>>(statusByKeyDefault);
  const [loading, setLoading] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(api.nest.quote, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      const json = await res.json();
      const next = (json?.plans || []) as PlanRate[];
      setRates(next);
      setStatusByKey({});
      return { ok: true };
    } catch {
      return { ok: false, message: "No se pudieron cargar los planes." };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRate = useCallback((planKey: string, field: keyof PlanRate, value: string | number | boolean) => {
    setRates((prev) =>
      prev.map((item) => {
        if (item.planKey !== planKey) return item;
        if (field === "tasa") {
          return { ...item, tasa: parseNumber(value as string | number) };
        }
        return { ...item, [field]: value };
      })
    );
    setStatusByKey((prev) => ({ ...prev, [planKey]: "dirty" }));
  }, []);

  const saveRate = useCallback(async (planKey: string) => {
    const target = rates.find((item) => item.planKey === planKey);
    if (!target) return { ok: false, message: "Plan no encontrado." };

    setStatusByKey((prev) => ({ ...prev, [planKey]: "saving" }));
    try {
      const payload = {
        plans: [target],
      };
      const res = await fetch(api.nest.quote, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusByKey((prev) => ({ ...prev, [planKey]: "error" }));
        return { ok: false, message: json?.error || "No se pudo guardar el plan." };
      }
      setStatusByKey((prev) => ({ ...prev, [planKey]: "saved" }));
      return { ok: true };
    } catch {
      setStatusByKey((prev) => ({ ...prev, [planKey]: "error" }));
      return { ok: false, message: "Error de red al guardar plan." };
    }
  }, [rates]);

  const saveAllRates = useCallback(async () => {
    const dirtyRows = rates.filter((item) => (statusByKey[item.planKey] || "idle") === "dirty");

    if (dirtyRows.length === 0) {
      return { ok: true, message: "No hay cambios para guardar." };
    }

    try {
      const res = await fetch(api.nest.quote, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: dirtyRows }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, message: json?.error || "No se pudo guardar todo." };
      }

      setStatusByKey((prev) => {
        const next = { ...prev };
        dirtyRows.forEach((row) => {
          next[row.planKey] = "saved";
        });
        return next;
      });
      return { ok: true, message: "Planes guardados." };
    } catch {
      return { ok: false, message: "Error de red al guardar planes." };
    }
  }, [rates, statusByKey]);

  const createRate = useCallback(async (input: Omit<PlanRate, "id">) => {
    try {
      const payload = {
        plans: [input],
      };

      const res = await fetch(api.nest.quote, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, message: json?.error || "No se pudo crear el plan." };
      }

      await fetchRates();
      return { ok: true };
    } catch {
      return { ok: false, message: "Error de red al crear plan." };
    }
  }, [fetchRates]);

  const deleteRate = useCallback(async (planKey: string) => {
    try {
      const res = await fetch(api.nest.quote, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, message: json?.error || "No se pudo borrar el plan." };
      }

      await fetchRates();
      return { ok: true };
    } catch {
      return { ok: false, message: "Error de red al borrar plan." };
    }
  }, [fetchRates]);

  const visibleRates = useMemo(() => [...rates].sort((a, b) => a.orden - b.orden), [rates]);

  return {
    rates: visibleRates,
    loading,
    statusByKey,
    fetchRates,
    updateRate,
    saveRate,
    saveAllRates,
    createRate,
    deleteRate,
  };
}
