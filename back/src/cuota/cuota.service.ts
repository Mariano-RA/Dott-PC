/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CuotaPlan } from "./entities/cuota-plan.entity";
import { CuotaPlanDto } from "../shared/cuotaPlan.dto";

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(CuotaPlan)
    private readonly cuotaPlanRepository: Repository<CuotaPlan>
  ) {}

  private getDefaultPlans(): CuotaPlanDto[] {
    return [
      { planKey: "3", label: "3 cuotas", tasa: 7.78, activo: true, orden: 10 },
      { planKey: "6", label: "6 cuotas", tasa: 14.96, activo: true, orden: 20 },
      { planKey: "planZ", label: "Plan Z", tasa: 13.4, activo: true, orden: 30 },
    ];
  }

  private async ensurePlanDefaults(): Promise<void> {
    const currentCount = await this.cuotaPlanRepository.count();
    if (currentCount > 0) {
      return;
    }

    const defaults = this.cuotaPlanRepository.create(this.getDefaultPlans());
    await this.cuotaPlanRepository.save(defaults);
  }

  async findPlans(activeOnly = false) {
    await this.ensurePlanDefaults();

    return this.cuotaPlanRepository.find({
      where: activeOnly ? { activo: true } : {},
      order: { orden: "ASC", id: "ASC" },
    });
  }

  async upsertPlans(plans: CuotaPlanDto[]) {
    await this.ensurePlanDefaults();

    const current = await this.findPlans(false);
    const currentMap = new Map(current.map((item) => [item.planKey, item]));

    const updated = plans.map((plan, index) => {
      const existing = currentMap.get(plan.planKey);
      return this.cuotaPlanRepository.create({
        id: existing?.id,
        planKey: plan.planKey,
        label: plan.label,
        tasa: plan.tasa,
        activo: plan.activo ?? true,
        orden: plan.orden ?? (index + 1) * 10,
      });
    });

    await this.cuotaPlanRepository.save(updated);

    return this.findPlans(false);
  }

  async upsertPlan(planKey: string, plan: CuotaPlanDto) {
    const existing = await this.cuotaPlanRepository.findOne({
      where: { planKey },
    });

    const saved = await this.cuotaPlanRepository.save(
      this.cuotaPlanRepository.create({
        id: existing?.id,
        planKey,
        label: plan.label,
        tasa: plan.tasa,
        activo: plan.activo ?? true,
        orden: plan.orden ?? existing?.orden ?? 10,
      })
    );

    return saved;
  }

  async deletePlan(planKey: string) {
    const normalizedKey = String(planKey || "").trim();
    if (!normalizedKey) {
      throw new Error("Plan inválido.");
    }

    const plan = await this.cuotaPlanRepository.findOne({
      where: { planKey: normalizedKey },
    });

    if (!plan) {
      throw new Error(`No existe el plan ${normalizedKey}.`);
    }

    const activeCount = await this.cuotaPlanRepository.count({ where: { activo: true } });
    if (plan.activo && activeCount <= 1) {
      throw new Error("Debe existir al menos un plan activo.");
    }

    await this.cuotaPlanRepository.delete({ id: plan.id });
    return this.findPlans(false);
  }
}
