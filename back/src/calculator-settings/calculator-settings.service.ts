import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CalculatorSetting } from "./entities/calculator-setting.entity";
import { CalculatorSettingDto } from "./dto/calculator-setting.dto";
import { EventLogService } from "src/shared/event-log.service";

const DEFAULT_SETTINGS: Pick<CalculatorSettingDto, "cardFee" | "advanceFee" | "vat"> = {
  cardFee: 1.8,
  advanceFee: 6,
  vat: 21,
};

/** Valores por defecto por pasarela (costs + vat + plans) para cuando la DB está vacía o sin gateways. */
const DEFAULT_GATEWAYS: Record<string, unknown> = {
  tacataca: {
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

  private async ensureSettings(): Promise<CalculatorSetting> {
    const existing = await this.settingsRepository.findOne({ where: { id: 1 } });
    if (existing) {
      return existing;
    }

    return this.settingsRepository.save(
      this.settingsRepository.create({
        id: 1,
        ...DEFAULT_SETTINGS,
        gateways: DEFAULT_GATEWAYS,
      })
    );
  }

  async getSettings() {
    const row = await this.ensureSettings();
    const gateways = row.gateways && Object.keys(row.gateways).length > 0 ? row.gateways : DEFAULT_GATEWAYS;
    await this.eventLogService.info("calculadora", "get_settings", "Se consultó configuración de calculadora.");
    return {
      cardFee: row.cardFee,
      advanceFee: row.advanceFee,
      vat: row.vat,
      gateways,
    };
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

    const saved = await this.settingsRepository.save(this.settingsRepository.create(toSave));
    await this.eventLogService.info("calculadora", "update_settings", "Se actualizó configuración de calculadora.", {
      hasGateways: input.gateways != null,
    });
    return saved;
  }
}
