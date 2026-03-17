import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CalculatorSetting } from "./entities/calculator-setting.entity";
import { CalculatorSettingDto } from "./dto/calculator-setting.dto";

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
};

@Injectable()
export class CalculatorSettingsService {
  constructor(
    @InjectRepository(CalculatorSetting)
    private readonly settingsRepository: Repository<CalculatorSetting>
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

    return this.settingsRepository.save(this.settingsRepository.create(toSave));
  }
}
