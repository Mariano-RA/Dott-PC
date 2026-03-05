"use client";

import { useCallback, useMemo, useState } from "react";

export type DolarRow = {
  proveedor: string;
  precioDolar: number;
  motivo?: string;
};

export type DolarHistoryRow = {
  id: number;
  proveedor: string;
  precioDolar: number;
  fechaVigencia: string;
  usuario?: string | null;
  motivo?: string | null;
};

export type RowStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;
  const normalized = (value || "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useAdminDolar() {
  const [rows, setRows] = useState<DolarRow[]>([]);
  const [history, setHistory] = useState<DolarHistoryRow[]>([]);
  const [statusByProveedor, setStatusByProveedor] = useState<Record<string, RowStatus>>({});
  const [loading, setLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");

  const fetchDolar = useCallback(async () => {
    setLoading(true);
    try {
      const [resRows, resHistory] = await Promise.all([
        fetch("/api/nest/dolar"),
        fetch("/api/nest/dolar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 120 }),
        }),
      ]);

      const jsonRows = await resRows.json();
      const jsonHistory = await resHistory.json();

      setRows((jsonRows?.dolar || []) as DolarRow[]);
      setHistory((jsonHistory?.history || []) as DolarHistoryRow[]);
      setStatusByProveedor({});

      return { ok: true };
    } catch {
      return { ok: false, message: "No se pudo cargar el módulo de dólar." };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRow = useCallback((proveedor: string, field: keyof DolarRow, value: string | number) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.proveedor !== proveedor) return row;
        if (field === "precioDolar") {
          return { ...row, precioDolar: parseNumber(value as string | number) };
        }
        return { ...row, [field]: value };
      })
    );
    setStatusByProveedor((prev) => ({ ...prev, [proveedor]: "dirty" }));
  }, []);

  const saveRow = useCallback(async (proveedor: string) => {
    const target = rows.find((row) => row.proveedor === proveedor);
    if (!target) return { ok: false, message: "Proveedor no encontrado." };

    setStatusByProveedor((prev) => ({ ...prev, [proveedor]: "saving" }));
    try {
      const res = await fetch("/api/nest/dolar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor,
          precioDolar: target.precioDolar,
          motivo: target.motivo || "Actualización manual",
          fechaVigencia: new Date().toISOString(),
          usuario: "admin-local",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusByProveedor((prev) => ({ ...prev, [proveedor]: "error" }));
        return { ok: false, message: json?.error || "No se pudo guardar proveedor." };
      }

      setStatusByProveedor((prev) => ({ ...prev, [proveedor]: "saved" }));
      await fetchDolar();
      return { ok: true };
    } catch {
      setStatusByProveedor((prev) => ({ ...prev, [proveedor]: "error" }));
      return { ok: false, message: "Error de red al guardar proveedor." };
    }
  }, [rows, fetchDolar]);

  const saveAll = useCallback(async () => {
    const dirtyRows = rows.filter((row) => (statusByProveedor[row.proveedor] || "idle") === "dirty");
    if (dirtyRows.length === 0) {
      return { ok: true, message: "No hay cambios para guardar." };
    }

    try {
      const payload = dirtyRows.map((row) => ({
        proveedor: row.proveedor,
        precioDolar: row.precioDolar,
        motivo: row.motivo || "Actualización masiva",
        fechaVigencia: new Date().toISOString(),
        usuario: "admin-local",
      }));

      const res = await fetch("/api/nest/dolar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arrayDolar: payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, message: json?.error || "No se pudieron guardar todos los proveedores." };
      }

      await fetchDolar();
      return { ok: true, message: "Valores de dólar guardados." };
    } catch {
      return { ok: false, message: "Error de red al guardar dólar." };
    }
  }, [rows, statusByProveedor, fetchDolar]);

  const createProvider = useCallback(
    async (input: { proveedor: string; precioDolar: number; motivo?: string; usuario?: string }) => {
      try {
        const proveedor = input.proveedor.trim().toLowerCase();
        if (!proveedor) {
          return { ok: false, message: "Proveedor inválido." };
        }

        const res = await fetch("/api/nest/dolar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proveedor,
            precioDolar: input.precioDolar,
            motivo: input.motivo || "Alta de proveedor",
            fechaVigencia: new Date().toISOString(),
            usuario: input.usuario || "admin-local",
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          return { ok: false, message: json?.error || "No se pudo crear proveedor." };
        }

        await fetchDolar();
        return { ok: true };
      } catch {
        return { ok: false, message: "Error de red al crear proveedor." };
      }
    },
    [fetchDolar]
  );

  const deleteProvider = useCallback(async (proveedor: string) => {
    try {
      const res = await fetch("/api/nest/dolar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor }),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, message: json?.error || "No se pudo borrar proveedor." };
      }

      await fetchDolar();
      return { ok: true };
    } catch {
      return { ok: false, message: "Error de red al borrar proveedor." };
    }
  }, [fetchDolar]);

  const filteredHistory = useMemo(() => {
    const term = historyFilter.trim().toLowerCase();
    if (!term) return history;
    return history.filter((row) =>
      [row.proveedor, row.usuario || "", row.motivo || ""].join(" ").toLowerCase().includes(term)
    );
  }, [history, historyFilter]);

  return {
    rows,
    history: filteredHistory,
    loading,
    statusByProveedor,
    historyFilter,
    setHistoryFilter,
    fetchDolar,
    updateRow,
    saveRow,
    saveAll,
    createProvider,
    deleteProvider,
  };
}
