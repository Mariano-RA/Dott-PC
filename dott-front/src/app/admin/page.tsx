"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import Alert from "../components/Alert";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { useAdminDolar } from "./hooks/useAdminDolar";
import { getUserRoles } from "@/lib/auth0Roles";
import { api } from "@/constants/routes";

const IS_LOCAL_AUTH_BYPASS = process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_BYPASS === "true";

async function fileToBase64Async(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };

    reader.onerror = function (error) {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}

function statusPill(status: string) {
  if (status === "dirty") return "Pendiente";
  if (status === "saving") return "Guardando";
  if (status === "saved") return "Guardado";
  if (status === "error") return "Error";
  return "Sin cambios";
}

/** Backend puede devolver proveedor como string o como objeto { nombre }. Normaliza a string. */
function proveedorToName(p: unknown): string {
  if (p == null) return "";
  if (typeof p === "string") return p.trim();
  if (typeof p === "object" && p !== null && "nombre" in p && typeof (p as { nombre: unknown }).nombre === "string")
    return String((p as { nombre: string }).nombre).trim();
  return String(p).trim();
}

function capitalizeLabel(s: string): string {
  const str = String(s ?? "").trim();
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function AdminPage() {
  const [usrRoles, setUsrRoles] = useState<string[]>([]);
  const { user, error, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [providerToUpload, setProviderToUpload] = useState("");
  const [providerToDelete, setProviderToDelete] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fetchPricesProveedor, setFetchPricesProveedor] = useState("");
  const [fetchPricesLoading, setFetchPricesLoading] = useState(false);
  const GATEWAY_KEYS = ["tacataca", "payway", "mercadopago"] as const;

  type GatewayPlan = { planKey: string; label: string; rate: string };
  type GatewayCost = { id: string; label: string; value: string };
  type GatewayConfig = { costs: GatewayCost[]; vat: string; plans: GatewayPlan[] };

  const defaultPlansStandard: GatewayPlan[] = [
    { planKey: "3", label: "3 cuotas", rate: "7.78" },
    { planKey: "6", label: "6 cuotas", rate: "14.96" },
    { planKey: "planZ", label: "Plan Z", rate: "13.4" },
  ];
  const defaultPlansMercadopago: GatewayPlan[] = [
    { planKey: "2", label: "2 cuotas", rate: "6.1" },
    { planKey: "3", label: "3 cuotas", rate: "7.78" },
    { planKey: "6", label: "6 cuotas", rate: "14.96" },
    { planKey: "9", label: "9 cuotas", rate: "12" },
    { planKey: "12", label: "12 cuotas", rate: "15" },
  ];

  const defaultCostsTacataca: GatewayCost[] = [
    { id: "cardFee", label: "Uso de tarjeta", value: "1.8" },
    { id: "advanceFee", label: "Anticipo", value: "6" },
  ];
  const defaultCostsPayway: GatewayCost[] = [
    { id: "cardFee", label: "Uso de tarjeta de crédito", value: "1.8" },
    { id: "cost24h", label: "Costo por cobro a 24hs", value: "0" },
  ];
  const defaultCostsMercadopago: GatewayCost[] = [
    { id: "instantRate", label: "Costo por cobro en el momento", value: "6.6" },
  ];

  const defaultGateway = (costs: GatewayCost[], plans: GatewayPlan[]): GatewayConfig => ({
    costs: [...costs],
    vat: "21",
    plans: [...plans],
  });

  const parsePlansForFetch = (arr: unknown): GatewayPlan[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p) => p && typeof p.planKey === "string")
      .map((p) => ({
        planKey: String(p.planKey),
        label: typeof p.label === "string" ? p.label : String(p.planKey),
        rate: String(typeof p.rate === "number" ? p.rate : p.rate ?? "0"),
      }));
  };

  const parseCostsForFetch = (arr: unknown): GatewayCost[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((c) => c && typeof c.id === "string")
      .map((c) => ({
        id: String(c.id),
        label: typeof c.label === "string" ? c.label : String(c.id),
        value: String(typeof c.value === "number" ? c.value : c.value ?? "0"),
      }));
  };

  const buildGatewayFromRaw = (
    g: unknown,
    defaultCosts: GatewayCost[],
    defaultPlans: GatewayPlan[]
  ): GatewayConfig => {
    if (!g || typeof g !== "object") return defaultGateway(defaultCosts, defaultPlans);
    const obj = g as Record<string, unknown>;
    const costsFromApi = parseCostsForFetch(obj.costs);
    const plansFromApi = parsePlansForFetch(obj.plans);
    const vat = obj.vat != null ? String(obj.vat) : "21";

    if (costsFromApi.length > 0) {
      return { costs: costsFromApi, vat, plans: plansFromApi.length > 0 ? plansFromApi : defaultPlans };
    }

    if (obj.instantRate != null) {
      return {
        costs: [{ id: "instantRate", label: "Costo por cobro en el momento", value: String(obj.instantRate) }],
        vat,
        plans: plansFromApi.length > 0 ? plansFromApi : defaultPlansMercadopago,
      };
    }
    if (obj.cost24h != null) {
      return {
        costs: [
          { id: "cardFee", label: "Uso de tarjeta de crédito", value: String(obj.cardFee ?? "1.8") },
          { id: "cost24h", label: "Costo por cobro a 24hs", value: String(obj.cost24h) },
        ],
        vat,
        plans: plansFromApi.length > 0 ? plansFromApi : defaultPlansStandard,
      };
    }
    if (obj.advanceFee != null || obj.cardFee != null) {
      return {
        costs: [
          { id: "cardFee", label: "Uso de tarjeta", value: String(obj.cardFee ?? "1.8") },
          { id: "advanceFee", label: "Anticipo", value: String(obj.advanceFee ?? "6") },
        ],
        vat,
        plans: plansFromApi.length > 0 ? plansFromApi : defaultPlansStandard,
      };
    }
    return defaultGateway(defaultCosts, defaultPlans);
  };

  const [calculatorConfig, setCalculatorConfig] = useState<{
    cardFee: string;
    advanceFee: string;
    vat: string;
    gateways: Record<string, GatewayConfig>;
  }>({
    cardFee: "1.8",
    advanceFee: "6",
    vat: "21",
    gateways: {
      tacataca: defaultGateway(defaultCostsTacataca, defaultPlansStandard),
      payway: defaultGateway(defaultCostsPayway, defaultPlansStandard),
      mercadopago: defaultGateway(defaultCostsMercadopago, defaultPlansMercadopago),
    },
  });
  const [savingCalculatorConfig, setSavingCalculatorConfig] = useState(false);

  const {
    rows: dolarRows,
    history: dolarHistory,
    loading: loadingDolar,
    statusByProveedor,
    historyFilter,
    setHistoryFilter,
    fetchDolar,
    updateRow,
    saveRow,
    saveAll,
    createProvider,
    deleteProvider,
  } = useAdminDolar();

  const providerOptions = useMemo(
    () =>
      Array.from(new Set(dolarRows.map((row) => proveedorToName(row.proveedor))))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [dolarRows]
  );

  /** Proveedores con descarga automática (fetcher). Solo estos en el select "Descargar listados". */
  const fetchPricesProviderOptions = useMemo(
    () => ["air", "elit", "invid", "mega", "nb"].sort((a, b) => a.localeCompare(b)),
    []
  );

  /** Proveedores de carga manual (CSV/Excel). Solo estos en el select "Carga CSV de proveedor". */
  const manualUploadProviderOptions = useMemo(() => ["eikon", "hdc"].sort((a, b) => a.localeCompare(b)), []);

  const [activeTab, setActiveTab] = useState<"proveedores" | "calculadora" | "dolar" | "categorias">("proveedores");
  const [calculatorGatewayTab, setCalculatorGatewayTab] = useState<"tacataca" | "payway" | "mercadopago">("tacataca");

  /** Categorías nuevas (sin mapear en DB) agrupadas por proveedor. */
  type NewCategoryGroup = { categoriaRaw: string; examples: string[] };
  const [categoriesNew, setCategoriesNew] = useState<Record<string, NewCategoryGroup[]>>({});
  const [categoriesNewLoading, setCategoriesNewLoading] = useState(false);
  const [addingMapping, setAddingMapping] = useState<string | null>(null);
  const [discardingKey, setDiscardingKey] = useState<string | null>(null);
  /** Valor del input "categoría normalizada" por clave "proveedor:categoriaRaw". */
  const [normalizadaByKey, setNormalizadaByKey] = useState<Record<string, string>>({});
  /** Claves "proveedor:categoriaRaw" seleccionadas para agregar en lote. */
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<Set<string>>(new Set());
  const [addingBulk, setAddingBulk] = useState(false);
  const [discardingBulk, setDiscardingBulk] = useState(false);

  const [alerta, setAlerta] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const handleCloseAlert = () => {
    setAlerta((prev) => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (IS_LOCAL_AUTH_BYPASS) {
      setIsAuthorized(true);
      return;
    }

    // Solo verificar autenticación cuando Auth0 ha terminado de cargar
    if (!userLoading) {
      if (user) {
        const roles = getUserRoles(user);
        setUsrRoles(roles);
        
        // Verificar si es admin
        if (roles.includes("admin")) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } else {
        // No hay usuario autenticado
        setIsAuthorized(false);
      }
    }
  }, [user, userLoading]);

  // Redirigir si no está autorizado (pero solo después de que Auth0 haya cargado)
  useEffect(() => {
    if (!IS_LOCAL_AUTH_BYPASS && isAuthorized === false) {
      router.push("/");
    }
  }, [isAuthorized, router]);

  useEffect(() => {
    fetchDolar();
  }, [fetchDolar]);

  const fetchCategoriesNew = async () => {
    setCategoriesNewLoading(true);
    try {
      const res = await fetch(api.nest.categories.new);
      const data = await res.json();
      if (res.ok && typeof data === "object" && data !== null) {
        setCategoriesNew(data as Record<string, NewCategoryGroup[]>);
      } else {
        setCategoriesNew({});
      }
    } catch {
      setCategoriesNew({});
    } finally {
      setCategoriesNewLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "categorias") fetchCategoriesNew();
  }, [activeTab]);

  const handleAddMapping = async (
    proveedor: string,
    categoriaRaw: string,
    categoriaNormalizada: string
  ) => {
    const key = `${proveedor}:${categoriaRaw}`;
    setAddingMapping(key);
    try {
      const res = await fetch(api.nest.categories.dictionary, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor: proveedor.trim().toLowerCase(),
          categoriaRaw: categoriaRaw.trim(),
          categoriaNormalizada: categoriaNormalizada.trim() || categoriaRaw.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.error || "Error al agregar al diccionario." });
        return;
      }
      setAlerta({ show: true, type: "success", message: "Mapeo agregado al diccionario." });
      await fetchCategoriesNew();
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al agregar mapeo." });
    } finally {
      setAddingMapping(null);
    }
  };

  const handleDiscardNew = async (proveedor: string, categoriaRaw: string) => {
    const key = `${proveedor}:${categoriaRaw}`;
    setDiscardingKey(key);
    try {
      const params = new URLSearchParams({ proveedor, categoriaRaw });
      const res = await fetch(`${api.nest.categories.new}?${params}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.error || "Error al descartar." });
        return;
      }
      setAlerta({ show: true, type: "success", message: "Entradas descartadas." });
      await fetchCategoriesNew();
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al descartar." });
    } finally {
      setDiscardingKey(null);
    }
  };

  const handleDiscardNewBulk = async () => {
    if (selectedCategoryKeys.size === 0) return;
    setDiscardingBulk(true);
    try {
      const items = Array.from(selectedCategoryKeys).map((key) => {
        const i = key.indexOf(":");
        return {
          proveedor: key.slice(0, i),
          categoriaRaw: i >= 0 ? key.slice(i + 1) : key,
        };
      });
      const res = await fetch(api.nest.categories.newDiscardBulk, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.error || "Error al descartar en lote." });
        return;
      }
      const deleted = json?.deleted ?? 0;
      setAlerta({ show: true, type: "success", message: `${deleted} categoría(s) descartada(s).` });
      setSelectedCategoryKeys(new Set());
      await fetchCategoriesNew();
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al descartar en lote." });
    } finally {
      setDiscardingBulk(false);
    }
  };

  const toggleCategorySelection = (key: string) => {
    setSelectedCategoryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllCategoriesInProvider = (proveedor: string, groups: NewCategoryGroup[]) => {
    const keys = groups.map((g) => `${proveedor}:${g.categoriaRaw}`);
    setSelectedCategoryKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const handleAddMappingsBulk = async () => {
    if (selectedCategoryKeys.size === 0) {
      setAlerta({ show: true, type: "error", message: "Seleccioná al menos una categoría." });
      return;
    }
    setAddingBulk(true);
    try {
      const mappings: { proveedor: string; categoriaRaw: string; categoriaNormalizada: string }[] = [];
      for (const key of Array.from(selectedCategoryKeys)) {
        const [proveedor, ...rawParts] = key.split(":");
        const categoriaRaw = rawParts.join(":").trim();
        const normalizada = (normalizadaByKey[key] ?? categoriaRaw).trim() || categoriaRaw;
        mappings.push({
          proveedor: proveedor.trim().toLowerCase(),
          categoriaRaw,
          categoriaNormalizada: normalizada,
        });
      }
      const res = await fetch(api.nest.categories.dictionaryBulk, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.message || json?.error || "Error al agregar en lote." });
        return;
      }
      const count = json?.updated ?? 0;
      setAlerta({ show: true, type: "success", message: `${count} mapeo(s) agregado(s) al diccionario.` });
      setSelectedCategoryKeys(new Set());
      await fetchCategoriesNew();
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al agregar en lote." });
    } finally {
      setAddingBulk(false);
    }
  };

  useEffect(() => {
    const fetchCalculatorConfig = async () => {
      try {
        const res = await fetch(api.nest.calculatorConfig);
        const json = await res.json();
        if (!res.ok) {
          return;
        }

        const flat = {
          cardFee: String(json?.settings?.cardFee ?? "1.8"),
          advanceFee: String(json?.settings?.advanceFee ?? "6"),
          vat: String(json?.settings?.vat ?? "21"),
        };
        const raw = json?.settings?.gateways;

        const gateways: Record<string, GatewayConfig> = {
          tacataca: buildGatewayFromRaw(raw?.tacataca, defaultCostsTacataca, defaultPlansStandard),
          payway: buildGatewayFromRaw(raw?.payway, defaultCostsPayway, defaultPlansStandard),
          mercadopago: buildGatewayFromRaw(raw?.mercadopago, defaultCostsMercadopago, defaultPlansMercadopago),
        };
        setCalculatorConfig({ ...flat, gateways });
      } catch {
        // Keep defaults if API is unavailable.
      }
    };

    fetchCalculatorConfig();
  }, []);

  const isLoading = loadingDolar;

  const onChangeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setUploadFile(file);
  };

  const handleUploadProvider = async () => {
    if (!providerToUpload) {
      setAlerta({ show: true, type: "error", message: "Seleccioná un proveedor." });
      return;
    }

    if (!uploadFile) {
      setAlerta({ show: true, type: "error", message: "No se seleccionó ningún archivo." });
      return;
    }

    try {
      const base64String = await fileToBase64Async(uploadFile);
      const res = await fetch(api.nest.products.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreProveedor: providerToUpload,
          base64: base64String,
          fileName: uploadFile.name,
          contentType: uploadFile.type || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const statusText = res.status === 401 ? "Falta autenticación." : res.status === 403 ? "Sin permisos suficientes." : "Error interno.";
        setAlerta({ show: true, type: "error", message: `${statusText} ${json?.error || ""}`.trim() });
        return;
      }

      setAlerta({ show: true, type: "success", message: json?.response || "Listado cargado correctamente." });
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al subir CSV." });
    }
  };

  const handleDeleteProvider = async () => {
    if (!providerToDelete) {
      setAlerta({ show: true, type: "error", message: "Seleccioná proveedor a eliminar." });
      return;
    }

    try {
      const res = await fetch(api.nest.products.list, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor: providerToDelete }),
      });
      const json = await res.json();

      if (!res.ok) {
        const statusText = res.status === 401 ? "Falta autenticación." : res.status === 403 ? "Sin permisos suficientes." : "Error interno.";
        setAlerta({ show: true, type: "error", message: `${statusText} ${json?.error || ""}`.trim() });
        return;
      }

      setAlerta({ show: true, type: "success", message: json?.response || "Proveedor eliminado." });
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al eliminar proveedor." });
    }
  };

  const handleCreateProvider = async () => {
    const proveedor = newProviderName.trim().toLowerCase();

    if (!proveedor) {
      setAlerta({ show: true, type: "error", message: "Ingresá nombre de proveedor." });
      return;
    }

    const result = await createProvider({
      proveedor,
    });

    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo crear proveedor." });
      return;
    }

    setProviderToUpload(proveedor);
    setNewProviderName("");
    setAlerta({ show: true, type: "success", message: `Proveedor ${proveedor} creado en maestro.` });
  };

  const handleDeleteProviderFromDolar = async () => {
    if (!providerToDelete) {
      setAlerta({ show: true, type: "error", message: "Seleccioná proveedor a borrar." });
      return;
    }

    const result = await deleteProvider(providerToDelete);
    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo borrar proveedor." });
      return;
    }

    setAlerta({ show: true, type: "success", message: `Proveedor ${providerToDelete} eliminado del maestro.` });
  };

  const handleFetchPrices = async () => {
    setFetchPricesLoading(true);
    try {
      const res = await fetch(api.nest.products.fetchPrices, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fetchPricesProveedor ? JSON.stringify({ proveedor: fetchPricesProveedor }) : "{}",
      });
      const json = await res.json();
      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.error || "Error al solicitar descarga de listados." });
        return;
      }
      setAlerta({
        show: true,
        type: "success",
        message: json?.response || "Se envió la solicitud de descarga. Revisá los logs del consumer.",
      });
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al solicitar descarga." });
    } finally {
      setFetchPricesLoading(false);
    }
  };

  const saveDolarRow = async (proveedor: string) => {
    const result = await saveRow(proveedor);
    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo guardar proveedor." });
      return;
    }
    setAlerta({ show: true, type: "success", message: `Proveedor ${proveedor} guardado.` });
  };

  const saveAllDolar = async () => {
    const result = await saveAll();
    setAlerta({
      show: true,
      type: result.ok ? "success" : "error",
      message: result.message || (result.ok ? "Dólar guardado." : "No se pudo guardar dólar."),
    });
  };

  const handleSaveCalculatorConfig = async () => {
    const toNum = (s: string) => Number(String(s).replace(",", "."));
    const gatewaysPayload: Record<string, { costs: { id: string; label: string; value: number }[]; vat: number; plans: { planKey: string; label: string; rate: number }[] }> = {};
    for (const key of GATEWAY_KEYS) {
      const g = calculatorConfig.gateways[key];
      if (!g) continue;
      const costsPayload = (g.costs ?? [])
        .filter((c) => String(c.id).trim())
        .map((c) => ({ id: c.id.trim(), label: (c.label || c.id).trim(), value: toNum(c.value) }));
      const vat = toNum(g.vat);
      if (!Number.isFinite(vat)) {
        setAlerta({ show: true, type: "error", message: `Pasarela "${key}": IVA inválido.` });
        return;
      }
      if (costsPayload.some((c) => !Number.isFinite(c.value))) {
        setAlerta({ show: true, type: "error", message: `Pasarela "${key}": revisá que cada costo tenga un valor numérico.` });
        return;
      }
      const plans = (g.plans ?? []).filter((p) => String(p.planKey).trim());
      const plansPayload = plans.map((p) => ({ planKey: p.planKey.trim(), label: (p.label || p.planKey).trim(), rate: toNum(p.rate) }));
      if (plansPayload.some((p) => !Number.isFinite(p.rate))) {
        setAlerta({ show: true, type: "error", message: `Pasarela "${key}": revisá que cada plan tenga una tasa numérica.` });
        return;
      }
      gatewaysPayload[key] = { costs: costsPayload, vat, plans: plansPayload };
    }
    const tacataca = gatewaysPayload.tacataca;
    const firstCost = tacataca?.costs?.[0]?.value;
    const payload = {
      cardFee: firstCost ?? toNum(calculatorConfig.cardFee),
      advanceFee: tacataca?.costs?.[1]?.value ?? toNum(calculatorConfig.advanceFee),
      vat: tacataca?.vat ?? toNum(calculatorConfig.vat),
      gateways: gatewaysPayload,
    };

    setSavingCalculatorConfig(true);
    try {
      const res = await fetch(api.nest.calculatorConfig, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.error || "No se pudo guardar la configuración." });
        return;
      }

      const settings = json?.settings ?? {};
      const flat = {
        cardFee: String(settings.cardFee ?? payload.cardFee),
        advanceFee: String(settings.advanceFee ?? payload.advanceFee),
        vat: String(settings.vat ?? payload.vat),
      };
      const raw = settings.gateways ?? payload.gateways;
      const gateways: Record<string, GatewayConfig> = {
        tacataca: buildGatewayFromRaw(raw?.tacataca, defaultCostsTacataca, defaultPlansStandard),
        payway: buildGatewayFromRaw(raw?.payway, defaultCostsPayway, defaultPlansStandard),
        mercadopago: buildGatewayFromRaw(raw?.mercadopago, defaultCostsMercadopago, defaultPlansMercadopago),
      };
      setCalculatorConfig({ ...flat, gateways });
      setAlerta({ show: true, type: "success", message: "Parámetros de calculadora (por pasarela) actualizados." });
    } catch {
      setAlerta({ show: true, type: "error", message: "Error de red al guardar parámetros de calculadora." });
    } finally {
      setSavingCalculatorConfig(false);
    }
  };

  // Mientras Auth0 carga o mientras verificamos permisos, mostrar loader
  if (!IS_LOCAL_AUTH_BYPASS && isAuthorized === null) {
    return (
      <div className="container-page py-8 md:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <Card>
            <CardContent className="py-6">
              <p>Cargando...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si no está autorizado, no mostrar contenido (la redirección ocurrirá en el effect)
  if (!IS_LOCAL_AUTH_BYPASS && isAuthorized === false) {
    return null;
  }

  return (
    <div className="container-page py-8 md:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Badge variant="danger">Admin</Badge>
          <h1>Gestión de tablas y tasas</h1>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-6">
              <p>Cargando configuración...</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="border-b border-border">
          <nav className="-mb-px flex gap-1" aria-label="Pestañas">
            {(
              [
                { id: "proveedores" as const, label: "Proveedores y listados" },
                { id: "calculadora" as const, label: "Calculadora" },
                { id: "dolar" as const, label: "Dólar" },
                { id: "categorias" as const, label: "Categorías nuevas" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? "border-b-2 border-red-950 px-4 py-3 text-sm font-medium text-red-950"
                    : "border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground hover:border-red-200 hover:text-red-900"
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "proveedores" && (
          <>
        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <h3>Alta de proveedor</h3>
            <div className="grid gap-3 md:grid-cols-1">
              <Input
                label="Proveedor"
                value={newProviderName}
                onChange={(event) => setNewProviderName(event.target.value)}
                placeholder="ej: acme"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="red" onClick={handleCreateProvider}>
                Crear proveedor
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <h3>Descargar listados desde la web del proveedor</h3>
            <p className="text-sm text-muted-foreground">
              Dispara la descarga automática del listado de precios (requiere consumer Python activo). Elegí un proveedor o &quot;Todos&quot;.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={fetchPricesProveedor}
                onChange={(event) => setFetchPricesProveedor(event.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {fetchPricesProviderOptions.map((item) => (
                  <option key={item} value={item}>
                    {capitalizeLabel(item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="red" onClick={handleFetchPrices} loading={fetchPricesLoading}>
                Descargar listados
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <h3>Carga CSV de proveedor</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={providerToUpload}
                onChange={(event) => setProviderToUpload(event.target.value)}
              >
                <option value="">Proveedor</option>
                {manualUploadProviderOptions.map((item) => (
                  <option key={item} value={item}>
                    {capitalizeLabel(item)}
                  </option>
                ))}
              </select>
              <Input type="file" aria-label="Subir listado" onChange={onChangeFile} />
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="red" onClick={handleUploadProvider}>
                Cargar listado
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <h3>Eliminar listado de proveedor</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={providerToDelete}
                onChange={(event) => setProviderToDelete(event.target.value)}
              >
                <option value="">Proveedor</option>
                {providerOptions.map((item) => (
                  <option key={item} value={item}>
                    {capitalizeLabel(item)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handleDeleteProvider}>
                Borrar listado
              </Button>
              <Button type="button" variant="secondary" onClick={handleDeleteProviderFromDolar}>
                Borrar proveedor
              </Button>
            </div>
          </CardContent>
        </Card>
          </>
        )}

        {activeTab === "calculadora" && (
        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <h3>Parámetros de calculadora por pasarela</h3>
              <Button variant="red" loading={savingCalculatorConfig} onClick={handleSaveCalculatorConfig}>
                Guardar parámetros
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Costos y comisiones por pasarela. Impactan en <code>/calculadora</code>.
            </p>
            <div className="border-b border-border">
              <nav className="-mb-px flex gap-1" aria-label="Pasarela">
                {(
                  [
                    { id: "tacataca" as const, label: "Taca-taca" },
                    { id: "payway" as const, label: "Payway" },
                    { id: "mercadopago" as const, label: "Mercadopago" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCalculatorGatewayTab(tab.id)}
                    className={
                      calculatorGatewayTab === tab.id
                        ? "border-b-2 border-red-950 px-3 py-2 text-sm font-medium text-red-950"
                        : "border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:border-red-200 hover:text-red-900"
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="space-y-6 pt-2">
              {GATEWAY_KEYS.filter((k) => k === calculatorGatewayTab).map((gatewayKey) => {
                const label = gatewayKey === "tacataca" ? "Taca-taca" : gatewayKey === "payway" ? "Payway" : "Mercadopago";
                const gw = calculatorConfig.gateways[gatewayKey] ?? defaultGateway(
                  gatewayKey === "mercadopago" ? defaultCostsMercadopago : gatewayKey === "payway" ? defaultCostsPayway : defaultCostsTacataca,
                  gatewayKey === "mercadopago" ? defaultPlansMercadopago : defaultPlansStandard
                );
                const costs = gw.costs ?? [];
                const plans = gw.plans ?? (gatewayKey === "mercadopago" ? defaultPlansMercadopago : defaultPlansStandard);

                return (
                  <div key={gatewayKey} className="rounded-lg border border-border p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">{label}</h4>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Costos y comisiones (podés agregar o quitar ítems). Las cuotas se configuran abajo.
                    </p>

                    <p className="text-xs font-medium text-foreground">Costos y comisiones (%)</p>
                    <div className="mt-2 space-y-2">
                      {costs.map((cost, idx) => (
                        <div key={gatewayKey + "-cost-" + idx} className="grid gap-2 rounded border border-border p-2 sm:grid-cols-4">
                          <Input
                            placeholder="Id (ej: cardFee, cost24h)"
                            value={cost.id}
                            onChange={(event) =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = [...(prevGw.costs ?? [])];
                                if (next[idx]) next[idx] = { ...next[idx], id: event.target.value };
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, costs: next } } };
                              })
                            }
                          />
                          <Input
                            placeholder="Nombre (ej: Uso de tarjeta)"
                            value={cost.label}
                            onChange={(event) =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = [...(prevGw.costs ?? [])];
                                if (next[idx]) next[idx] = { ...next[idx], label: event.target.value };
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, costs: next } } };
                              })
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Valor %"
                            value={cost.value}
                            onChange={(event) =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = [...(prevGw.costs ?? [])];
                                if (next[idx]) next[idx] = { ...next[idx], value: event.target.value };
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, costs: next } } };
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = (prevGw.costs ?? []).filter((_, i) => i !== idx);
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, costs: next } } };
                              })
                            }
                          >
                            Quitar
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCalculatorConfig((prev) => {
                            const prevGw = prev.gateways[gatewayKey] ?? gw;
                            const next = [...(prevGw.costs ?? []), { id: "", label: "", value: "0" }];
                            return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, costs: next } } };
                          })
                        }
                      >
                        Agregar costo / comisión
                      </Button>
                    </div>

                    <div className="mt-4">
                      <Input
                        label="IVA (%)"
                        type="number"
                        step="0.01"
                        value={gw.vat}
                        onChange={(event) =>
                          setCalculatorConfig((prev) => {
                            const prevGw = prev.gateways[gatewayKey] ?? gw;
                            return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, vat: event.target.value } } };
                          })
                        }
                      />
                    </div>

                    <p className="mt-3 text-xs font-medium text-foreground">Planes de cuotas (tasa %)</p>
                    <div className="mt-2 space-y-2">
                      {plans.map((plan, idx) => (
                        <div key={gatewayKey + "-plan-" + idx} className="grid gap-2 rounded border border-border p-2 sm:grid-cols-4">
                          <Input
                            placeholder="Clave (ej: 3, planZ)"
                            value={plan.planKey}
                            onChange={(event) =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = [...(prevGw.plans ?? [])];
                                if (next[idx]) next[idx] = { ...next[idx], planKey: event.target.value };
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, plans: next } } };
                              })
                            }
                          />
                          <Input
                            placeholder="Etiqueta (ej: 3 cuotas)"
                            value={plan.label}
                            onChange={(event) =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = [...(prevGw.plans ?? [])];
                                if (next[idx]) next[idx] = { ...next[idx], label: event.target.value };
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, plans: next } } };
                              })
                            }
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Tasa %"
                            value={plan.rate}
                            onChange={(event) =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = [...(prevGw.plans ?? [])];
                                if (next[idx]) next[idx] = { ...next[idx], rate: event.target.value };
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, plans: next } } };
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setCalculatorConfig((prev) => {
                                const prevGw = prev.gateways[gatewayKey] ?? gw;
                                const next = (prevGw.plans ?? []).filter((_, i) => i !== idx);
                                return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, plans: next } } };
                              })
                            }
                          >
                            Quitar
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCalculatorConfig((prev) => {
                            const prevGw = prev.gateways[gatewayKey] ?? gw;
                            const next = [...(prevGw.plans ?? []), { planKey: "", label: "", rate: "0" }];
                            return { ...prev, gateways: { ...prev.gateways, [gatewayKey]: { ...prevGw, plans: next } } };
                          })
                        }
                      >
                        Agregar plan
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {activeTab === "dolar" && (
          <>
        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <h3>Valor del dólar por proveedor</h3>
              <Button variant="red" onClick={saveAllDolar}>Guardar todos</Button>
            </div>
            <div className="space-y-3">
              {dolarRows.map((row) => (
                <div key={row.proveedor} className="grid items-center gap-3 rounded-md border border-border p-3 md:grid-cols-6">
                  <p className="text-sm font-medium capitalize text-foreground">{row.proveedor}</p>
                  <Input
                    className="text-right"
                    value={row.precioDolar}
                    onChange={(event) => updateRow(row.proveedor, "precioDolar", event.target.value)}
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000000"
                  />
                  <Input
                    value={row.motivo || ""}
                    onChange={(event) => updateRow(row.proveedor, "motivo", event.target.value)}
                    placeholder="Motivo"
                  />
                  <p className="text-sm text-muted-foreground">{statusPill(statusByProveedor[row.proveedor] || "idle")}</p>
                  <div className="md:col-span-2 flex justify-end">
                    <Button variant="red" size="sm" onClick={() => saveDolarRow(row.proveedor)}>
                      Guardar proveedor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <h3>Historial de dólar</h3>
            <Input
              label="Filtrar historial"
              value={historyFilter}
              onChange={(event) => setHistoryFilter(event.target.value)}
              placeholder="Proveedor, usuario o motivo"
            />
            <div className="space-y-2">
              {dolarHistory.slice(0, 80).map((item) => (
                <div key={item.id} className="grid gap-2 rounded-md border border-border p-2 text-sm md:grid-cols-5">
                  <span className="font-medium capitalize">{item.proveedor}</span>
                  <span>${item.precioDolar}</span>
                  <span>{new Date(item.fechaVigencia).toLocaleString()}</span>
                  <span>{item.usuario || "-"}</span>
                  <span>{item.motivo || "-"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </>
        )}

        {activeTab === "categorias" && (
          <Card>
            <CardContent className="space-y-4 px-4 py-5 md:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3>Categorías nuevas (pendientes de alta)</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedCategoryKeys.size > 0 && (
                    <>
                      <Button
                        type="button"
                        variant="red"
                        size="sm"
                        onClick={handleAddMappingsBulk}
                        loading={addingBulk}
                      >
                        Agregar seleccionados ({selectedCategoryKeys.size})
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleDiscardNewBulk}
                        loading={discardingBulk}
                      >
                        Descartar seleccionadas ({selectedCategoryKeys.size})
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={fetchCategoriesNew}
                    loading={categoriesNewLoading}
                  >
                    Actualizar
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Categorías detectadas en listados que no están en el diccionario. Asigná una categoría normalizada y agregá al diccionario (una por una o varias con &quot;Agregar seleccionados&quot;), o descartá.
              </p>
              {categoriesNewLoading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : Object.keys(categoriesNew).length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay categorías nuevas pendientes.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(categoriesNew).map(([proveedor, groups]) => {
                    const providerKeys = groups.map((g) => `${proveedor}:${g.categoriaRaw}`);
                    const selectedCount = providerKeys.filter((k) => selectedCategoryKeys.has(k)).length;
                    const allSelected = providerKeys.length > 0 && selectedCount === providerKeys.length;
                    return (
                      <div key={proveedor} className="rounded-lg border border-border p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold capitalize text-foreground">{proveedor}</h4>
                          <button
                            type="button"
                            onClick={() => selectAllCategoriesInProvider(proveedor, groups)}
                            className="text-xs text-muted-foreground underline hover:text-red-900"
                          >
                            {allSelected ? "Quitar selección" : "Seleccionar todo"}
                          </button>
                        </div>
                        <div className="space-y-3">
                          {groups.map((group) => {
                            const key = `${proveedor}:${group.categoriaRaw}`;
                            const normalizada = normalizadaByKey[key] ?? group.categoriaRaw;
                            const isAdding = addingMapping === key;
                            const isDiscarding = discardingKey === key;
                            const isSelected = selectedCategoryKeys.has(key);
                            const ejemplo = Array.isArray(group.examples) && group.examples.length > 0 ? group.examples[0] : "";
                            return (
                              <div
                                key={key}
                                className="grid gap-x-4 gap-y-2 rounded border border-border bg-muted/30 p-3 text-sm grid-cols-1 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center"
                              >
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleCategorySelection(key)}
                                    className="h-4 w-4 rounded border-input"
                                    aria-label={`Seleccionar ${group.categoriaRaw}`}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-foreground">Raw: {group.categoriaRaw}</p>
                                  {ejemplo ? (
                                    <p className="mt-0.5 text-xs text-muted-foreground">Ejemplo: {ejemplo}</p>
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <Input
                                    placeholder="Categoría normalizada"
                                    value={normalizada}
                                    onChange={(e) => setNormalizadaByKey((prev) => ({ ...prev, [key]: e.target.value }))}
                                    className="h-9 w-full"
                                  />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant="red"
                                    size="sm"
                                    onClick={() => handleAddMapping(proveedor, group.categoriaRaw, normalizada)}
                                    loading={isAdding}
                                  >
                                    Agregar
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDiscardNew(proveedor, group.categoriaRaw)}
                                    loading={isDiscarding}
                                  >
                                    Descartar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Alert
          alertText={alerta.message}
          action={alerta.show}
          handleCloseAlert={handleCloseAlert}
          type={alerta.type as "success" | "error" | "warning" | "info"}
        />
      </div>
    </div>
  );
}

export default AdminPage;
