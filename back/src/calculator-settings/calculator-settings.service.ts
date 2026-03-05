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
      })
    );
  }

  async getSettings() {
    return this.ensureSettings();
  }

  async updateSettings(input: CalculatorSettingDto) {
    const current = await this.ensureSettings();

    return this.settingsRepository.save(
      this.settingsRepository.create({
        id: current.id,
        cardFee: input.cardFee,
        advanceFee: input.advanceFee,
        vat: input.vat,
      })
    );
  }
}
