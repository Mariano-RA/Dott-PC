import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { DolaresModule } from "../../src/dolar/dolar.module";
import { DolaresService } from "../../src/dolar/dolar.service";
import { Dolar } from "../../src/dolar/entities/dolar.entity";
import { DolarHistory } from "../../src/dolar/entities/dolar-history.entity";
import { ProveedorModule } from "../../src/proveedor/proveedor.module";
import { Proveedor } from "../../src/proveedor/entities/proveedor.entity";

describe("DolaresModule (integration)", () => {
  let service: DolaresService;

  beforeEach(async () => {
    const mockDolarRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    const mockHistoryRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };
    const mockProveedorRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [DolaresModule, ProveedorModule],
    })
      .overrideProvider(getRepositoryToken(Dolar))
      .useValue(mockDolarRepo)
      .overrideProvider(getRepositoryToken(DolarHistory))
      .useValue(mockHistoryRepo)
      .overrideProvider(getRepositoryToken(Proveedor))
      .useValue(mockProveedorRepo)
      .compile();

    service = module.get<DolaresService>(DolaresService);
  });

  it("should resolve DolaresService", () => {
    expect(service).toBeDefined();
  });
});
