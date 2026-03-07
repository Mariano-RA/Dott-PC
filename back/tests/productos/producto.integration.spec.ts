import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { ProductosModule } from "../../src/productos/producto.module";
import { ProductosService } from "../../src/productos/producto.service";
import { Producto } from "../../src/productos/entities/producto.entity";
import { CuotasModule } from "../../src/cuota/cuota.module";
import { DolaresModule } from "../../src/dolar/dolar.module";
import { ProveedorModule } from "../../src/proveedor/proveedor.module";
import { CuotaPlan } from "../../src/cuota/entities/cuota-plan.entity";
import { Dolar } from "../../src/dolar/entities/dolar.entity";
import { DolarHistory } from "../../src/dolar/entities/dolar-history.entity";
import { Proveedor } from "../../src/proveedor/entities/proveedor.entity";

describe("ProductosModule (integration)", () => {
  let service: ProductosService;

  const mockRepo = (defaultValue: unknown = []) => ({
    find: jest.fn().mockResolvedValue(defaultValue),
    findOne: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    create: jest.fn((dto) => dto),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProductosModule, CuotasModule, DolaresModule, ProveedorModule],
    })
      .overrideProvider(getRepositoryToken(Producto))
      .useValue(mockRepo())
      .overrideProvider(getRepositoryToken(CuotaPlan))
      .useValue({ ...mockRepo(), count: jest.fn().mockResolvedValue(0) })
      .overrideProvider(getRepositoryToken(Dolar))
      .useValue(mockRepo())
      .overrideProvider(getRepositoryToken(DolarHistory))
      .useValue(mockRepo())
      .overrideProvider(getRepositoryToken(Proveedor))
      .useValue(mockRepo())
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => (key === "RABBIT_MQ_URI" ? "amqp://localhost" : "test_queue")),
      })
      .compile();

    service = module.get<ProductosService>(ProductosService);
  });

  it("should resolve ProductosService", () => {
    expect(service).toBeDefined();
  });
});
