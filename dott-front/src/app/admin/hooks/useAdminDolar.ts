"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/constants/routes";

export type DolarRow = {
  proveedor: string;
  precioDolar: number;
  motivo?: string;
};

export type ProveedorRow = {
  id: number;
  nombre: string;
  activo?: boolean;
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

/** La API puede devolver proveedor como string o como objeto { nombre }. */
function normalizeProveedorName(p: unknown): string {
  if (p == null) return "";
  if (typeof p === "string") return p.trim().toLowerCase();
  if (typeof p === "object" && p !== null && "nombre" in p && typeof (p as { nombre: unknown }).nombre === "string")
    return String((p as { nombre: string }).nombre).trim().toLowerCase();
  return String(p).trim().toLowerCase();
}

export function useAdminDolar() {
  const [rows, setRows] = useState<DolarRow[]>([]);
  const [history, setHistory] = useState<DolarHistoryRow[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorRow[]>([]);
  const [statusByProveedor, setStatusByProveedor] = useState<Record<string, RowStatus>>({});
  const [loading, setLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");
  const [togglingActivoId, setTogglingActivoId] = useState<number | null>(null);

  const fetchDolar = useCallback(async () => {
    setLoading(true);
    try {
      const [resRows, resHistory, resProveedores] = await Promise.all([
        fetch(api.nest.dolar),
        fetch(api.nest.dolar, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 120 }),
        }),
        fetch(api.nest.proveedores),
      ]);

      const jsonRows = await resRows.json();
      const jsonHistory = await resHistory.json();
      const jsonProveedores = await resProveedores.json();

      const rawDolar = (jsonRows?.dolar || []) as Array<{ proveedor?: string | { nombre?: string }; precioDolar?: number; motivo?: string }>;
      const dolarRows: DolarRow[] = rawDolar.map((row) => ({
        proveedor: normalizeProveedorName(row.proveedor),
        precioDolar: typeof row.precioDolar === "number" ? row.precioDolar : parseNumber(row.precioDolar ?? 0),
        motivo: typeof row.motivo === "string" ? row.motivo : "",
      }));

      const proveedoresList = (jsonProveedores?.proveedores || []) as ProveedorRow[];
      setProveedores(
        [...proveedoresList].sort((a, b) =>
          String(a?.nombre || "").localeCompare(String(b?.nombre || ""))
        )
      );

      const missingRows = proveedoresList
        .filter((item) => item?.activo !== false)
        .filter(
          (item) =>
            !dolarRows.some(
              (row) => row.proveedor === String(item?.nombre || "").toLowerCase()
            )
        )
        .map((item) => ({
          proveedor: String(item.nombre || "").toLowerCase(),
          precioDolar: 0,
          motivo: "",
        }));

      const mergedRows = [...dolarRows, ...missingRows].sort((a, b) =>
        a.proveedor.localeCompare(b.proveedor)
      );

      setRows(mergedRows);

      const rawHistory = (jsonHistory?.history || []) as Array<{ id: number; proveedor?: string | { nombre?: string }; precioDolar: number; fechaVigencia: string; usuario?: string | null; motivo?: string | null }>;
      setHistory(
        rawHistory.map((item) => ({
          id: item.id,
          proveedor: normalizeProveedorName(item.proveedor),
          precioDolar: item.precioDolar,
          fechaVigencia: item.fechaVigencia,
          usuario: item.usuario ?? null,
          motivo: item.motivo ?? null,
        }))
      );
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
      const res = await fetch(api.nest.dolar, {
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

      const res = await fetch(api.nest.dolar, {
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
    async (input: { proveedor: string }) => {
      try {
        const proveedor = input.proveedor.trim().toLowerCase();
        if (!proveedor) {
          return { ok: false, message: "Proveedor inválido." };
        }

        const proveedorRes = await fetch(api.nest.proveedores, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: proveedor, activo: true }),
        });

        const proveedorJson = await proveedorRes.json();
        if (!proveedorRes.ok) {
          return {
            ok: false,
            message: proveedorJson?.error || "No se pudo crear proveedor en maestro.",
          };
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
      const listRes = await fetch(api.nest.proveedores);
      const listJson = await listRes.json();
      if (!listRes.ok) {
        return { ok: false, message: listJson?.error || "No se pudo consultar proveedores." };
      }

      const list = Array.isArray(listJson?.proveedores) ? listJson.proveedores : [];
      const proveedorMatch = list.find(
        (item: { id: number; nombre: string }) => String(item?.nombre || "").toLowerCase() === proveedor.toLowerCase()
      );

      if (!proveedorMatch?.id) {
        return { ok: false, message: "Proveedor no encontrado en maestro." };
      }

      const proveedorDeleteRes = await fetch(api.nest.proveedores, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: proveedorMatch.id }),
      });
      const proveedorDeleteJson = await proveedorDeleteRes.json();
      if (!proveedorDeleteRes.ok) {
        return {
          ok: false,
          message: proveedorDeleteJson?.error || "No se pudo borrar proveedor del maestro.",
        };
      }

      await fetch(api.nest.dolar, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor }),
      });

      await fetchDolar();
      return { ok: true };
    } catch {
      return { ok: false, message: "Error de red al borrar proveedor." };
    }
  }, [fetchDolar]);

  const toggleProveedorActivo = useCallback(
    async (id: number, activo: boolean) => {
      setTogglingActivoId(id);
      try {
        const res = await fetch(api.nest.proveedores, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, activo }),
        });
        const json = await res.json();
        if (!res.ok) {
          return { ok: false, message: json?.error || "No se pudo actualizar el proveedor." };
        }
        await fetchDolar();
        return { ok: true };
      } catch {
        return { ok: false, message: "Error de red al actualizar proveedor." };
      } finally {
        setTogglingActivoId(null);
      }
    },
    [fetchDolar]
  );

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
    proveedores,
    loading,
    statusByProveedor,
    historyFilter,
    setHistoryFilter,
    togglingActivoId,
    fetchDolar,
    updateRow,
    saveRow,
    saveAll,
    createProvider,
    deleteProvider,
    toggleProveedorActivo,
  };
}
