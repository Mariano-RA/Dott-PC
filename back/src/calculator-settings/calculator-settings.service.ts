import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CalculatorSetting } from "./entities/calculator-setting.entity";
import { CalculatorSettingDto } from "./dto/calculator-setting.dto";
import { UpsertGatewayDto } from "./dto/gateway.dto";
import { EventLogService } from "src/shared/event-log.service";
import type { GatewayConfigLike } from "src/productos/helpers/precio-cuota.helper";

const DEFAULT_SETTINGS: Pick<CalculatorSettingDto, "cardFee" | "advanceFee" | "vat"> = {
  cardFee: 1.8,
  advanceFee: 6,
  vat: 21,
};

const GATEWAY_KEY_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/;

/** Valores por defecto por pasarela (costs + vat + plans) para cuando la DB está vacía o sin gateways. */
const DEFAULT_GATEWAYS: Record<string, unknown> = {
  tacataca: {
    label: "Taca-taca",
    costs: [
      { id: "cardFee", label: "Uso de tarjeta", value: 1.8 },
      { id: "advanceFee", label: "Anticipo", value: 6 },
    ],
    vat: 21,
    plans: [
      { planKey: "3", label: "3 cuotas", rate: 7.78 },
      { planKey: "6", label: "6 cuotas", rate: 14.96 },
      { planKey: "planZ", label: "Plan Z", rate: 13.4 },
    ],
  },
  payway: {
    label: "Payway",
    costs: [
      { id: "cardFee", label: "Uso de tarjeta de crédito", value: 1.8 },
      { id: "cost24h", label: "Costo por cobro a 24hs", value: 0 },
    ],
    vat: 21,
    plans: [
      { planKey: "3", label: "3 cuotas", rate: 7.78 },
      { planKey: "6", label: "6 cuotas", rate: 14.96 },
      { planKey: "planZ", label: "Plan Z", rate: 13.4 },
    ],
  },
  mercadopago: {
    label: "Mercadopago",
    costs: [{ id: "instantRate", label: "Costo por cobro en el momento", value: 6.6 }],
    vat: 21,
    plans: [
      { planKey: "2", label: "2 cuotas", rate: 6.1 },
      { planKey: "3", label: "3 cuotas", rate: 7.78 },
      { planKey: "6", label: "6 cuotas", rate: 14.96 },
      { planKey: "9", label: "9 cuotas", rate: 12 },
      { planKey: "12", label: "12 cuotas", rate: 15 },
    ],
  },
  getnet: {
    label: "Getnet",
    costs: [{ id: "arancel", label: "Arancel", value: 2.0, vat: 21 }],
    vat: 10.5,
    plans: [
      { planKey: "1", label: "Credito/Debito 1 cuota", rate: 0 },
      { planKey: "3-estandar", label: "3 cuotas Estandar", rate: 7.41 },
      { planKey: "3-mipyme", label: "3 cuotas MiPyME", rate: 7.36 },
      { planKey: "6-estandar", label: "6 cuotas Estandar", rate: 12.64 },
      { planKey: "6-mipyme", label: "6 cuotas MiPyME", rate: 13.82 },
      { planKey: "9", label: "9 cuotas Estandar", rate: 18.95 },
      { planKey: "12", label: "12 cuotas Estandar", rate: 23.72 },
      { planKey: "18", label: "18 cuotas Estandar", rate: 32.11 },
    ],
  },
};

@Injectable()
export class CalculatorSettingsService {
  constructor(
    @InjectRepository(CalculatorSetting)
    private readonly settingsRepository: Repository<CalculatorSetting>,
    private readonly eventLogService: EventLogService,
  ) {}

  normalizeGatewayKey(raw: string): string {
    return String(raw || "")
      .trim()
      .toLowerCase();
  }

  private assertGatewayKey(key: string): string {
    const normalized = this.normalizeGatewayKey(key);
    if (!GATEWAY_KEY_RE.test(normalized)) {
      throw new BadRequestException(
        "La clave de pasarela debe ser minúsculas, números, guión o guión bajo (máx. 63)."
      );
    }
    return normalized;
  }

  private asGatewayMap(gateways: Record<string, unknown> | null | undefined): Record<string, unknown> {
    if (gateways && typeof gateways === "object" && Object.keys(gateways).length > 0) {
      return { ...gateways };
    }
    return { ...DEFAULT_GATEWAYS };
  }

  private resolveDisplayKey(gateways: Record<string, unknown>, preferred?: string | null): string | null {
    const keys = Object.keys(gateways);
    if (keys.length === 0) return null;
    const wanted = this.normalizeGatewayKey(preferred || "");
    if (wanted && gateways[wanted]) return wanted;
    return keys[0];
  }

  private toPublic(row: CalculatorSetting) {
    const gateways = this.asGatewayMap(row.gateways);
    const displayGatewayKey = this.resolveDisplayKey(gateways, row.displayGatewayKey);
    return {
      cardFee: row.cardFee,
      advanceFee: row.advanceFee,
      vat: row.vat,
      displayGatewayKey,
      gateways,
    };
  }

  private async ensureSettings(): Promise<CalculatorSetting> {
    const existing = await this.settingsRepository.findOne({ where: { id: 1 } });
    if (existing) {
      return existing;
    }

    return this.settingsRepository.save(
      this.settingsRepository.create({
        id: 1,
        ...DEFAULT_SETTINGS,
        displayGatewayKey: "tacataca",
        gateways: DEFAULT_GATEWAYS,
      })
    );
  }

  async getSettings() {
    const row = await this.ensureSettings();
    await this.eventLogService.info("calculadora", "get_settings", "Se consultó configuración de calculadora.");
    return this.toPublic(row);
  }

  /** Pasarela elegida para cuotas de catálogo/detalle/carrito. */
  async getDisplayGateway(): Promise<{ key: string; gateway: GatewayConfigLike } | null> {
    const row = await this.ensureSettings();
    const gateways = this.asGatewayMap(row.gateways);
    const key = this.resolveDisplayKey(gateways, row.displayGatewayKey);
    if (!key) return null;
    const gateway = gateways[key];
    if (!gateway || typeof gateway !== "object") return null;
    return { key, gateway: gateway as GatewayConfigLike };
  }

  async updateSettings(input: CalculatorSettingDto) {
    const current = await this.ensureSettings();

    const toSave: Partial<CalculatorSetting> = {
      id: current.id,
      cardFee: input.cardFee,
      advanceFee: input.advanceFee,
      vat: input.vat,
    };
    if (input.gateways != null) {
      toSave.gateways = input.gateways as Record<string, unknown>;
    }
    const gateways = this.asGatewayMap(toSave.gateways ?? current.gateways);
    if (input.displayGatewayKey !== undefined) {
      toSave.displayGatewayKey = this.resolveDisplayKey(gateways, input.displayGatewayKey);
    }

    const saved = await this.settingsRepository.save(this.settingsRepository.create({
      ...current,
      ...toSave,
      gateways,
    }));
    await this.eventLogService.info("calculadora", "update_settings", "Se actualizó configuración de calculadora.", {
      hasGateways: input.gateways != null,
      displayGatewayKey: saved.displayGatewayKey,
    });
    return this.toPublic(saved);
  }

  private slugifyKey(raw: string): string {
    return String(raw || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);
  }

  async createGateway(input: UpsertGatewayDto) {
    const key = this.assertGatewayKey(input.key || this.slugifyKey(input.label || ""));
    const current = await this.ensureSettings();
    const gateways = this.asGatewayMap(current.gateways);
    if (gateways[key]) {
      throw new ConflictException(`Ya existe la pasarela "${key}".`);
    }
    gateways[key] = {
      label: (input.label || key).trim(),
      vat: input.vat ?? 21,
      costs: input.costs ?? [],
      plans: input.plans ?? [],
    };
    const displayGatewayKey = current.displayGatewayKey || key;
    const saved = await this.settingsRepository.save({
      ...current,
      gateways,
      displayGatewayKey,
    });
    await this.eventLogService.info("calculadora", "create_gateway", `Se creó la pasarela ${key}.`);
    return this.toPublic(saved);
  }

  async updateGateway(keyParam: string, input: UpsertGatewayDto) {
    const key = this.assertGatewayKey(keyParam);
    const current = await this.ensureSettings();
    const gateways = this.asGatewayMap(current.gateways);
    const existing = gateways[key];
    if (!existing || typeof existing !== "object") {
      throw new NotFoundException(`No existe la pasarela "${key}".`);
    }
    const prev = existing as Record<string, unknown>;
    gateways[key] = {
      ...prev,
      label: input.label != null ? String(input.label).trim() : prev.label,
      vat: input.vat != null ? input.vat : prev.vat,
      costs: input.costs != null ? input.costs : prev.costs,
      plans: input.plans != null ? input.plans : prev.plans,
    };
    const saved = await this.settingsRepository.save({ ...current, gateways });
    await this.eventLogService.info("calculadora", "update_gateway", `Se actualizó la pasarela ${key}.`);
    return this.toPublic(saved);
  }

  async deleteGateway(keyParam: string) {
    const key = this.assertGatewayKey(keyParam);
    const current = await this.ensureSettings();
    const gateways = this.asGatewayMap(current.gateways);
    if (!gateways[key]) {
      throw new NotFoundException(`No existe la pasarela "${key}".`);
    }
    if (Object.keys(gateways).length <= 1) {
      throw new BadRequestException("Debe existir al menos una pasarela.");
    }
    delete gateways[key];
    const displayGatewayKey = this.resolveDisplayKey(gateways, current.displayGatewayKey === key ? null : current.displayGatewayKey);
    const saved = await this.settingsRepository.save({ ...current, gateways, displayGatewayKey });
    await this.eventLogService.info("calculadora", "delete_gateway", `Se eliminó la pasarela ${key}.`);
    return this.toPublic(saved);
  }

  async setDisplayGateway(keyParam: string) {
    const key = this.assertGatewayKey(keyParam);
    const current = await this.ensureSettings();
    const gateways = this.asGatewayMap(current.gateways);
    if (!gateways[key]) {
      throw new NotFoundException(`No existe la pasarela "${key}".`);
    }
    const saved = await this.settingsRepository.save({ ...current, gateways, displayGatewayKey: key });
    await this.eventLogService.info(
      "calculadora",
      "set_display_gateway",
      `Pasarela de vitrina: ${key}.`
    );
    return this.toPublic(saved);
  }
}
