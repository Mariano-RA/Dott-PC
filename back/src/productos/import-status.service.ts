import { Injectable } from "@nestjs/common";

export type ImportState = "unknown" | "queued" | "processing" | "success" | "empty" | "error";

export type ImportStatus = {
  proveedor: string;
  state: ImportState;
  updatedAt: string; // ISO
  count?: number;
  error?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normProveedor(nombre: string): string {
  return String(nombre ?? "").trim().toLowerCase();
}

@Injectable()
export class ImportStatusService {
  private readonly byProveedor = new Map<string, ImportStatus>();

  get(proveedor: string): ImportStatus {
    const key = normProveedor(proveedor);
    if (!key) {
      return { proveedor: "", state: "unknown", updatedAt: nowIso() };
    }
    return (
      this.byProveedor.get(key) ?? {
        proveedor: key,
        state: "unknown",
        updatedAt: nowIso(),
      }
    );
  }

  markQueued(proveedor: string) {
    const key = normProveedor(proveedor);
    if (!key) return;
    this.byProveedor.set(key, { proveedor: key, state: "queued", updatedAt: nowIso() });
  }

  markProcessing(proveedor: string) {
    const key = normProveedor(proveedor);
    if (!key) return;
    this.byProveedor.set(key, { proveedor: key, state: "processing", updatedAt: nowIso() });
  }

  markSuccess(proveedor: string, count: number) {
    const key = normProveedor(proveedor);
    if (!key) return;
    this.byProveedor.set(key, {
      proveedor: key,
      state: "success",
      count: Number.isFinite(count) ? count : 0,
      updatedAt: nowIso(),
    });
  }

  markEmpty(proveedor: string) {
    const key = normProveedor(proveedor);
    if (!key) return;
    this.byProveedor.set(key, { proveedor: key, state: "empty", count: 0, updatedAt: nowIso() });
  }

  markError(proveedor: string, error: string) {
    const key = normProveedor(proveedor);
    if (!key) return;
    this.byProveedor.set(key, {
      proveedor: key,
      state: "error",
      error: String(error ?? "Unknown error"),
      updatedAt: nowIso(),
    });
  }
}

