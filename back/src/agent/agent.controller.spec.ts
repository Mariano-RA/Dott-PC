import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

const KEY = "k".repeat(40);

describe("AgentController (HTTP)", () => {
  let app: INestApplication;
  const agentService = {
    actualizarProveedores: jest.fn().mockResolvedValue({ ok: true, proveedor: "todos" }),
    estado: jest.fn().mockResolvedValue({ proveedores: [], resumen: "Sin información de proveedores." }),
  };

  async function boot(env: Record<string, string>) {
    const moduleRef = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        AgentAuthGuard,
        { provide: AgentService, useValue: agentService },
        { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    // Igual que main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  }

  beforeEach(() => jest.clearAllMocks());
  afterEach(async () => app?.close());

  describe("con la configuración correcta (supertest llega desde 127.0.0.1)", () => {
    beforeEach(() => boot({ AGENT_API_KEY: KEY, AGENT_ALLOWED_IPS: "127.0.0.1" }));

    it("POST /agent/proveedores/actualizar sin clave -> 401 y no dispara nada", async () => {
      await request(app.getHttpServer()).post("/agent/proveedores/actualizar").send({}).expect(401);
      expect(agentService.actualizarProveedores).not.toHaveBeenCalled();
    });

    it("POST con clave correcta y sin cuerpo -> 202 y pide todos", async () => {
      await request(app.getHttpServer())
        .post("/agent/proveedores/actualizar")
        .set("x-agent-key", KEY)
        .send({})
        .expect(202);
      expect(agentService.actualizarProveedores).toHaveBeenCalledWith(undefined);
    });

    it("POST normaliza el proveedor (mayúsculas y espacios)", async () => {
      await request(app.getHttpServer())
        .post("/agent/proveedores/actualizar")
        .set("x-agent-key", KEY)
        .send({ proveedor: "  AIR " })
        .expect(202);
      expect(agentService.actualizarProveedores).toHaveBeenCalledWith("air");
    });

    it("POST rechaza un proveedor con caracteres raros -> 400", async () => {
      await request(app.getHttpServer())
        .post("/agent/proveedores/actualizar")
        .set("x-agent-key", KEY)
        .send({ proveedor: "../../etc/passwd" })
        .expect(400);
      expect(agentService.actualizarProveedores).not.toHaveBeenCalled();
    });

    it("POST rechaza campos que no existen en el DTO -> 400", async () => {
      await request(app.getHttpServer())
        .post("/agent/proveedores/actualizar")
        .set("x-agent-key", KEY)
        .send({ proveedor: "air", borrarTodo: true })
        .expect(400);
    });

    it("GET /agent/proveedores/estado con clave -> 200", async () => {
      const res = await request(app.getHttpServer())
        .get("/agent/proveedores/estado")
        .set("x-agent-key", KEY)
        .expect(200);
      expect(res.body.resumen).toBeDefined();
    });

    it("GET /agent/proveedores/estado con clave incorrecta -> 401", async () => {
      await request(app.getHttpServer())
        .get("/agent/proveedores/estado")
        .set("x-agent-key", "x".repeat(40))
        .expect(401);
    });
  });

  it("con otra IP permitida, el pedido de supertest queda afuera -> 403", async () => {
    await boot({ AGENT_API_KEY: KEY, AGENT_ALLOWED_IPS: "192.168.0.172" });
    await request(app.getHttpServer())
      .get("/agent/proveedores/estado")
      .set("x-agent-key", KEY)
      .expect(403);
    expect(agentService.estado).not.toHaveBeenCalled();
  });

  it("sin configurar -> 503 (todo cerrado)", async () => {
    await boot({});
    await request(app.getHttpServer())
      .get("/agent/proveedores/estado")
      .set("x-agent-key", KEY)
      .expect(503);
  });
});
