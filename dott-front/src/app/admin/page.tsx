"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import Alert from "../components/Alert";
import { Badge, Button, Card, CardContent, Input } from "@/app/components/ui";
import { useAdminRates } from "./hooks/useAdminRates";
import { useAdminDolar } from "./hooks/useAdminDolar";
import { getUserRoles } from "@/lib/auth0Roles";

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

function AdminPage() {
  const [usrRoles, setUsrRoles] = useState<string[]>([]);
  const { user, error, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [providerToUpload, setProviderToUpload] = useState("");
  const [providerToDelete, setProviderToDelete] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderPrice, setNewProviderPrice] = useState("");
  const [newProviderReason, setNewProviderReason] = useState("Alta inicial");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [newPlanKey, setNewPlanKey] = useState("");
  const [newPlanLabel, setNewPlanLabel] = useState("");
  const [newPlanRate, setNewPlanRate] = useState("");
  const [newPlanOrder, setNewPlanOrder] = useState("");
  const [newPlanActive, setNewPlanActive] = useState(true);
  const [calculatorConfig, setCalculatorConfig] = useState({
    cardFee: "1.8",
    advanceFee: "6",
    vat: "21",
  });
  const [savingCalculatorConfig, setSavingCalculatorConfig] = useState(false);

  const {
    rates,
    loading: loadingRates,
    statusByKey,
    fetchRates,
    updateRate,
    saveRate,
    saveAllRates,
    createRate,
    deleteRate,
  } = useAdminRates();

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
    () => Array.from(new Set(dolarRows.map((row) => row.proveedor))).sort((a, b) => a.localeCompare(b)),
    [dolarRows]
  );

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
    fetchRates();
    fetchDolar();
  }, [fetchRates, fetchDolar]);

  useEffect(() => {
    const fetchCalculatorConfig = async () => {
      try {
        const res = await fetch("/api/nest/calculator-config");
        const json = await res.json();
        if (!res.ok) {
          return;
        }

        setCalculatorConfig({
          cardFee: String(json?.settings?.cardFee ?? "1.8"),
          advanceFee: String(json?.settings?.advanceFee ?? "6"),
          vat: String(json?.settings?.vat ?? "21"),
        });
      } catch {
        // Keep defaults if API is unavailable.
      }
    };

    fetchCalculatorConfig();
  }, []);

  const isLoading = loadingRates || loadingDolar;

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
      const res = await fetch("/api/nest/products/list", {
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
      const res = await fetch("/api/nest/products/list", {
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
    const precioDolar = Number(newProviderPrice.replace(",", "."));

    if (!proveedor) {
      setAlerta({ show: true, type: "error", message: "Ingresá nombre de proveedor." });
      return;
    }

    if (!Number.isFinite(precioDolar) || precioDolar <= 0) {
      setAlerta({ show: true, type: "error", message: "Ingresá un valor de dólar válido." });
      return;
    }

    const result = await createProvider({
      proveedor,
      precioDolar,
      motivo: newProviderReason || "Alta inicial",
      usuario: "admin-local",
    });

    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo crear proveedor." });
      return;
    }

    setProviderToUpload(proveedor);
    setNewProviderName("");
    setNewProviderPrice("");
    setAlerta({ show: true, type: "success", message: `Proveedor ${proveedor} creado.` });
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

    setAlerta({ show: true, type: "success", message: `Proveedor ${providerToDelete} eliminado de dólar.` });
  };

  const savePlanRow = async (planKey: string) => {
    const result = await saveRate(planKey);
    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo guardar plan." });
      return;
    }
    setAlerta({ show: true, type: "success", message: `Plan ${planKey} guardado.` });
  };

  const saveAllPlans = async () => {
    const result = await saveAllRates();
    setAlerta({
      show: true,
      type: result.ok ? "success" : "error",
      message: result.message || (result.ok ? "Planes guardados." : "No se pudieron guardar los planes."),
    });
  };

  const handleCreatePlan = async () => {
    const planKey = newPlanKey.trim();
    const label = newPlanLabel.trim();
    const tasa = Number(newPlanRate.replace(",", "."));
    const orden = Number(newPlanOrder || "0");

    if (!planKey || !label) {
      setAlerta({ show: true, type: "error", message: "Completá clave y nombre del plan." });
      return;
    }

    if (!Number.isFinite(tasa) || tasa < 0) {
      setAlerta({ show: true, type: "error", message: "Ingresá una tasa válida." });
      return;
    }

    const result = await createRate({
      planKey,
      label,
      tasa,
      orden: Number.isFinite(orden) ? orden : 0,
      activo: newPlanActive,
    });

    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo crear plan." });
      return;
    }

    setNewPlanKey("");
    setNewPlanLabel("");
    setNewPlanRate("");
    setNewPlanOrder("");
    setNewPlanActive(true);
    setAlerta({ show: true, type: "success", message: "Plan creado." });
  };

  const handleDeletePlan = async (planKey: string) => {
    const result = await deleteRate(planKey);
    if (!result.ok) {
      setAlerta({ show: true, type: "error", message: result.message || "No se pudo borrar plan." });
      return;
    }

    setAlerta({ show: true, type: "success", message: `Plan ${planKey} eliminado.` });
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
    const payload = {
      cardFee: Number(calculatorConfig.cardFee.replace(",", ".")),
      advanceFee: Number(calculatorConfig.advanceFee.replace(",", ".")),
      vat: Number(calculatorConfig.vat.replace(",", ".")),
    };

    if (
      !Number.isFinite(payload.cardFee) ||
      !Number.isFinite(payload.advanceFee) ||
      !Number.isFinite(payload.vat)
    ) {
      setAlerta({ show: true, type: "error", message: "Ingresá valores numéricos válidos para la calculadora." });
      return;
    }

    setSavingCalculatorConfig(true);
    try {
      const res = await fetch("/api/nest/calculator-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setAlerta({ show: true, type: "error", message: json?.error || "No se pudo guardar la configuración." });
        return;
      }

      setCalculatorConfig({
        cardFee: String(json?.settings?.cardFee ?? payload.cardFee),
        advanceFee: String(json?.settings?.advanceFee ?? payload.advanceFee),
        vat: String(json?.settings?.vat ?? payload.vat),
      });
      setAlerta({ show: true, type: "success", message: "Parámetros de calculadora actualizados." });
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
          <Badge variant="warning">Admin</Badge>
          <h1>Gestión de tablas y tasas</h1>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-6">
              <p>Cargando configuración...</p>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <h3>Alta de proveedor</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label="Proveedor"
                value={newProviderName}
                onChange={(event) => setNewProviderName(event.target.value)}
                placeholder="ej: acme"
              />
              <Input
                label="Dólar inicial"
                type="number"
                value={newProviderPrice}
                onChange={(event) => setNewProviderPrice(event.target.value)}
                placeholder="0"
              />
              <Input
                label="Motivo"
                value={newProviderReason}
                onChange={(event) => setNewProviderReason(event.target.value)}
                placeholder="Alta inicial"
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleCreateProvider}>
                Crear proveedor
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
                {providerOptions.map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
              <Input type="file" aria-label="Subir listado" onChange={onChangeFile} />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleUploadProvider}>
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
                    {item.charAt(0).toUpperCase() + item.slice(1)}
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

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <h3>Planes y cuotas (fuente única)</h3>
              <Button onClick={saveAllPlans}>Guardar todos los planes</Button>
            </div>
            <div className="grid items-end gap-3 rounded-md border border-border p-3 md:grid-cols-6">
              <Input
                label="Clave"
                value={newPlanKey}
                onChange={(event) => setNewPlanKey(event.target.value)}
                placeholder="ej: 12 o planPremium"
              />
              <Input
                label="Nombre"
                value={newPlanLabel}
                onChange={(event) => setNewPlanLabel(event.target.value)}
                placeholder="12 cuotas"
              />
              <Input
                label="Tasa (%)"
                type="number"
                step="0.01"
                value={newPlanRate}
                onChange={(event) => setNewPlanRate(event.target.value)}
                placeholder="0"
              />
              <Input
                label="Orden"
                type="number"
                value={newPlanOrder}
                onChange={(event) => setNewPlanOrder(event.target.value)}
                placeholder="0"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newPlanActive}
                  onChange={(event) => setNewPlanActive(event.target.checked)}
                />
                Activo
              </label>
              <div className="flex justify-end">
                <Button size="sm" onClick={handleCreatePlan}>
                  Crear plan
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {rates.map((rate) => (
                <div key={rate.planKey} className="grid items-center gap-3 rounded-md border border-border p-3 md:grid-cols-6">
                  <p className="text-sm font-medium text-foreground">{rate.label}</p>
                  <Input
                    className="text-right"
                    value={rate.tasa}
                    onChange={(event) => updateRate(rate.planKey, "tasa", event.target.value)}
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                  />
                  <Input
                    className="text-right"
                    value={rate.orden}
                    onChange={(event) => updateRate(rate.planKey, "orden", Number(event.target.value || 0))}
                    type="number"
                    step="1"
                    min="0"
                    max="999"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={rate.activo}
                      onChange={(event) => updateRate(rate.planKey, "activo", event.target.checked)}
                    />
                    Activo
                  </label>
                  <p className="text-sm text-muted-foreground">{statusPill(statusByKey[rate.planKey] || "idle")}</p>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => savePlanRow(rate.planKey)}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleDeletePlan(rate.planKey)}>
                      Borrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <h3>Parámetros de calculadora (interno)</h3>
              <Button loading={savingCalculatorConfig} onClick={handleSaveCalculatorConfig}>
                Guardar parámetros
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Estos valores impactan en `/calculadora` y no se muestran como editables para clientes.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                label="Uso de tarjeta (%)"
                type="number"
                step="0.01"
                value={calculatorConfig.cardFee}
                onChange={(event) =>
                  setCalculatorConfig((prev) => ({
                    ...prev,
                    cardFee: event.target.value,
                  }))
                }
              />
              <Input
                label="Anticipo (%)"
                type="number"
                step="0.01"
                value={calculatorConfig.advanceFee}
                onChange={(event) =>
                  setCalculatorConfig((prev) => ({
                    ...prev,
                    advanceFee: event.target.value,
                  }))
                }
              />
              <Input
                label="IVA (%)"
                type="number"
                step="0.01"
                value={calculatorConfig.vat}
                onChange={(event) =>
                  setCalculatorConfig((prev) => ({
                    ...prev,
                    vat: event.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 px-4 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <h3>Valor del dólar por proveedor</h3>
              <Button onClick={saveAllDolar}>Guardar todos</Button>
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
                    <Button size="sm" onClick={() => saveDolarRow(row.proveedor)}>
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
