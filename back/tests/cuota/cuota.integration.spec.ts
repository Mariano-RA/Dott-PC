import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CuotasModule } from "../../src/cuota/cuota.module";
import { CuotasService } from "../../src/cuota/cuota.service";
import { CuotaPlan } from "../../src/cuota/entities/cuota-plan.entity";

describe("CuotasModule (integration)", () => {
  let service: CuotasService;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((dto) => dto),
      save: jest.fn().mockImplementation((entities) => Promise.resolve(Array.isArray(entities) ? entities : [entities])),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [CuotasModule],
    })
      .overrideProvider(getRepositoryToken(CuotaPlan))
      .useValue(mockRepository)
      .compile();

    service = module.get<CuotasService>(CuotasService);
  });

  it("should resolve CuotasService", () => {
    expect(service).toBeDefined();
  });

  it("findPlans returns array", async () => {
    const result = await service.findPlans(false);
    expect(Array.isArray(result)).toBe(true);
  });
});
