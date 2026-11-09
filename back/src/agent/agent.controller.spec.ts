import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import * as request from "supertest";
import { AgentAuthGuard } from "./agent-auth.guard";
import { AgentCategoriasService } from "./agent-categorias.service";
import { AgentDolarService } from "./agent-dolar.service";
import { AgentImagenesService } from "./agent-imagenes.service";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";

const KEY = "k".repeat(40);

describe("AgentController (HTTP)", () => {
  let app: INestApplication;
  const agentService = {
    actualizarProveedores: jest.fn().mockResolvedValue({ ok: true, proveedor: "todos" }),
    estado: jest.fn().mockResolvedValue({ proveedores: [], resumen: "Sin información de proveedores." }),
  };
  const dolarService = {
    listar: jest.fn().mockResolvedValue({ proveedores: [], resumen: "x" }),
    actualizar: jest.fn().mockResolvedValue({ ok: true }),
  };
  const categoriasService = {
    nuevas: jest.fn().mockResolvedValue({ total: 0 }),
    maestras: jest.fn().mockResolvedValue({ total: 0 }),
    mapear: jest.fn().mockResolvedValue({ ok: true }),
    descartar: jest.fn().mockResolvedValue({ ok: true }),
  };

  const imagenesService = {
    iniciar: jest.fn().mockResolvedValue({ ok: true }),
    estado: jest.fn().mockReturnValue({ enCurso: false, resumen: "Sin cacheos todavía." }),
  };

  async function boot(env: Record<string, string>) {
    const moduleRef = await Test.createTestingModule({
      controllers: [AgentController],
      providers: [
        AgentAuthGuard,
        { provide: AgentService, useValue: agentService },
        { provide: AgentDolarService, useValue: dolarService },
        { provide: AgentCategoriasService, useValue: categoriasService },
        { provide: AgentImagenesService, useValue: imagenesService },
        { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    // Igual que main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  }

  const http = () => request(app.getHttpServer());
  const post = (path: string, body: unknown) => http().post(path).set("x-agent-key", KEY).send(body as object);

  beforeEach(() => jest.clearAllMocks());
  afterEach(async () => app?.close());

  describe("con la configuración correcta (supertest llega desde 127.0.0.1)", () => {
    beforeEach(() => boot({ AGENT_API_KEY: KEY, AGENT_ALLOWED_IPS: "127.0.0.1" }));

    describe("proveedores", () => {
      it("POST /agent/proveedores/actualizar sin clave -> 401 y no dispara nada", async () => {
        await http().post("/agent/proveedores/actualizar").send({}).expect(401);
        expect(agentService.actualizarProveedores).not.toHaveBeenCalled();
      });

      it("POST con clave correcta y sin cuerpo -> 202 y pide todos", async () => {
        await post("/agent/proveedores/actualizar", {}).expect(202);
        expect(agentService.actualizarProveedores).toHaveBeenCalledWith(undefined);
      });

      it("POST normaliza el proveedor (mayúsculas y espacios)", async () => {
        await post("/agent/proveedores/actualizar", { proveedor: "  AIR " }).expect(202);
        expect(agentService.actualizarProveedores).toHaveBeenCalledWith("air");
      });

      it("POST rechaza un proveedor con caracteres raros -> 400", async () => {
        await post("/agent/proveedores/actualizar", { proveedor: "../../etc/passwd" }).expect(400);
        expect(agentService.actualizarProveedores).not.toHaveBeenCalled();
      });

      it("POST rechaza campos que no existen en el DTO -> 400", async () => {
        await post("/agent/proveedores/actualizar", { proveedor: "air", borrarTodo: true }).expect(400);
      });

      it("GET /agent/proveedores/estado con clave -> 200", async () => {
        const res = await http().get("/agent/proveedores/estado").set("x-agent-key", KEY).expect(200);
        expect(res.body.resumen).toBeDefined();
      });

      it("GET /agent/proveedores/estado con clave incorrecta -> 401", async () => {
        await http().get("/agent/proveedores/estado").set("x-agent-key", "x".repeat(40)).expect(401);
      });
    });

    describe("imágenes", () => {
      it("POST /agent/imagenes/cachear sin clave -> 401 y no dispara nada", async () => {
        await http().post("/agent/imagenes/cachear").send({}).expect(401);
        expect(imagenesService.iniciar).not.toHaveBeenCalled();
      });

      it("POST con clave y sin cuerpo -> 202 y pide todos", async () => {
        await post("/agent/imagenes/cachear", {}).expect(202);
        expect(imagenesService.iniciar).toHaveBeenCalledWith(undefined);
      });

      it("POST normaliza el proveedor", async () => {
        await post("/agent/imagenes/cachear", { proveedor: "  ELIT " }).expect(202);
        expect(imagenesService.iniciar).toHaveBeenCalledWith("elit");
      });

      it("POST rechaza un proveedor con caracteres raros -> 400", async () => {
        await post("/agent/imagenes/cachear", { proveedor: "../x" }).expect(400);
        expect(imagenesService.iniciar).not.toHaveBeenCalled();
      });

      it("POST no deja que el agente cambie la concurrencia, el force ni nada fuera del DTO -> 400", async () => {
        await post("/agent/imagenes/cachear", { concurrency: 50 }).expect(400);
        await post("/agent/imagenes/cachear", { force: true }).expect(400);
        await post("/agent/imagenes/cachear", { onlyMissing: false }).expect(400);
        expect(imagenesService.iniciar).not.toHaveBeenCalled();
      });

      it("GET /agent/imagenes/estado con clave -> 200 y sin clave -> 401", async () => {
        await http().get("/agent/imagenes/estado").set("x-agent-key", KEY).expect(200);
        await http().get("/agent/imagenes/estado").expect(401);
      });
    });

    describe("dólar", () => {
      it("GET /agent/dolar exige clave", async () => {
        await http().get("/agent/dolar").expect(401);
        await http().get("/agent/dolar").set("x-agent-key", KEY).expect(200);
      });

      it("POST actualiza un proveedor (200) y normaliza el nombre", async () => {
        await post("/agent/dolar/actualizar", { precioDolar: 1450, proveedor: " AIR " }).expect(200);
        expect(dolarService.actualizar).toHaveBeenCalledWith(
          expect.objectContaining({ precioDolar: 1450, proveedor: "air" }),
        );
      });

      it("POST acepta todos=true", async () => {
        await post("/agent/dolar/actualizar", { precioDolar: 1450, todos: true }).expect(200);
        expect(dolarService.actualizar).toHaveBeenCalledWith(expect.objectContaining({ todos: true }));
      });

      it("POST rechaza valores inválidos del dólar -> 400", async () => {
        for (const precioDolar of [0, -5, 1_000_001, "abc", null]) {
          await post("/agent/dolar/actualizar", { precioDolar, todos: true }).expect(400);
        }
        await post("/agent/dolar/actualizar", { todos: true }).expect(400);
        expect(dolarService.actualizar).not.toHaveBeenCalled();
      });

      it("POST rechaza campos extra y tipos incorrectos -> 400", async () => {
        await post("/agent/dolar/actualizar", { precioDolar: 1450, todos: true, borrar: true }).expect(400);
        await post("/agent/dolar/actualizar", { precioDolar: 1450, todos: "si" }).expect(400);
        await post("/agent/dolar/actualizar", { precioDolar: 1450, proveedor: "a b;c" }).expect(400);
        expect(dolarService.actualizar).not.toHaveBeenCalled();
      });
    });

    describe("categorías", () => {
      it("GET nuevas y maestras exigen clave", async () => {
        await http().get("/agent/categorias/nuevas").expect(401);
        await http().get("/agent/categorias/maestras").expect(401);
        await http().get("/agent/categorias/nuevas").set("x-agent-key", KEY).expect(200);
        await http().get("/agent/categorias/maestras").set("x-agent-key", KEY).expect(200);
      });

      it("POST mapear pasa los ítems limpios al servicio", async () => {
        await post("/agent/categorias/mapear", {
          items: [{ proveedor: " AIR ", categoriaRaw: " Placas de video ", categoriaMaestra: " Placas de video " }],
        }).expect(200);
        expect(categoriasService.mapear).toHaveBeenCalledWith([
          expect.objectContaining({ proveedor: "air", categoriaRaw: "Placas de video", categoriaMaestra: "Placas de video" }),
        ]);
      });

      it("POST mapear rechaza lista vacía, demasiado larga o con datos inválidos -> 400", async () => {
        const item = { proveedor: "air", categoriaRaw: "x", categoriaMaestra: "y" };
        await post("/agent/categorias/mapear", { items: [] }).expect(400);
        await post("/agent/categorias/mapear", { items: Array.from({ length: 26 }, () => item) }).expect(400);
        await post("/agent/categorias/mapear", { items: [{ ...item, proveedor: "../x" }] }).expect(400);
        await post("/agent/categorias/mapear", { items: [{ proveedor: "air", categoriaRaw: "x" }] }).expect(400);
        await post("/agent/categorias/mapear", { items: [{ ...item, extra: 1 }] }).expect(400);
        await post("/agent/categorias/mapear", {}).expect(400);
        expect(categoriasService.mapear).not.toHaveBeenCalled();
      });

      it("POST descartar valida igual y exige clave", async () => {
        await http().post("/agent/categorias/descartar").send({ items: [{ proveedor: "air", categoriaRaw: "x" }] }).expect(401);
        await post("/agent/categorias/descartar", { items: [] }).expect(400);
        await post("/agent/categorias/descartar", { items: [{ proveedor: "air", categoriaRaw: "x" }] }).expect(200);
        expect(categoriasService.descartar).toHaveBeenCalledTimes(1);
      });
    });
  });

  it("con otra IP permitida, el pedido de supertest queda afuera -> 403 en todas las rutas nuevas", async () => {
    await boot({ AGENT_API_KEY: KEY, AGENT_ALLOWED_IPS: "192.168.0.172" });
    await http().get("/agent/proveedores/estado").set("x-agent-key", KEY).expect(403);
    await http().get("/agent/dolar").set("x-agent-key", KEY).expect(403);
    await post("/agent/dolar/actualizar", { precioDolar: 1450, todos: true }).expect(403);
    await post("/agent/categorias/mapear", { items: [{ proveedor: "air", categoriaRaw: "x", categoriaMaestra: "y" }] }).expect(403);
    expect(agentService.estado).not.toHaveBeenCalled();
    expect(dolarService.actualizar).not.toHaveBeenCalled();
    expect(categoriasService.mapear).not.toHaveBeenCalled();
  });

  it("sin configurar -> 503 (todo cerrado)", async () => {
    await boot({});
    await http().get("/agent/proveedores/estado").set("x-agent-key", KEY).expect(503);
    await post("/agent/dolar/actualizar", { precioDolar: 1450, todos: true }).expect(503);
  });
});
