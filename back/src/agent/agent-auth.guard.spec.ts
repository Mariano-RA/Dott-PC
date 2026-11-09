import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AgentAuthGuard, normalizeIp } from "./agent-auth.guard";

const KEY = "k".repeat(40);
const VM_IP = "192.168.0.172";

function makeGuard(env: Record<string, string | undefined> = {}) {
  const values = { AGENT_API_KEY: KEY, AGENT_ALLOWED_IPS: VM_IP, ...env };
  const config = {
    get: jest.fn((key: string) => values[key as keyof typeof values]),
  } as unknown as ConfigService;
  return new AgentAuthGuard(config);
}

function makeContext(options: { ip?: string; headers?: Record<string, unknown> }) {
  const request = {
    socket: { remoteAddress: options.ip ?? VM_IP },
    headers: options.headers ?? {},
  };
  return { switchToHttp: () => ({ getRequest: () => request }) } as any;
}

describe("AgentAuthGuard", () => {
  it("deja pasar con la IP permitida y la clave correcta", () => {
    const guard = makeGuard();
    expect(guard.canActivate(makeContext({ headers: { "x-agent-key": KEY } }))).toBe(true);
  });

  it("acepta la IP en formato IPv4 mapeado a IPv6", () => {
    const guard = makeGuard();
    const ctx = makeContext({ ip: `::ffff:${VM_IP}`, headers: { "x-agent-key": KEY } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("acepta una lista de IPs separadas por coma", () => {
    const guard = makeGuard({ AGENT_ALLOWED_IPS: `10.0.0.9, ${VM_IP}` });
    expect(guard.canActivate(makeContext({ headers: { "x-agent-key": KEY } }))).toBe(true);
  });

  it("rechaza con 401 si la clave es incorrecta", () => {
    const guard = makeGuard();
    const ctx = makeContext({ headers: { "x-agent-key": "x".repeat(40) } });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it("rechaza con 401 si falta la clave", () => {
    const guard = makeGuard();
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
  });

  it("rechaza con 401 si el header llega repetido (array)", () => {
    const guard = makeGuard();
    const ctx = makeContext({ headers: { "x-agent-key": [KEY, KEY] } });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it("rechaza con 403 una IP no permitida aunque la clave sea correcta", () => {
    const guard = makeGuard();
    const ctx = makeContext({ ip: "203.0.113.7", headers: { "x-agent-key": KEY } });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("no se deja engañar por X-Forwarded-For", () => {
    const guard = makeGuard();
    const ctx = makeContext({
      ip: "203.0.113.7",
      headers: { "x-agent-key": KEY, "x-forwarded-for": VM_IP },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("queda cerrado (503) si no hay clave configurada", () => {
    const guard = makeGuard({ AGENT_API_KEY: undefined });
    expect(() => guard.canActivate(makeContext({ headers: { "x-agent-key": KEY } }))).toThrow(
      ServiceUnavailableException,
    );
  });

  it("queda cerrado (503) si la clave tiene menos de 32 caracteres", () => {
    const guard = makeGuard({ AGENT_API_KEY: "corta" });
    expect(() => guard.canActivate(makeContext({ headers: { "x-agent-key": "corta" } }))).toThrow(
      ServiceUnavailableException,
    );
  });

  it("queda cerrado (503) si no hay IPs permitidas", () => {
    const guard = makeGuard({ AGENT_ALLOWED_IPS: "" });
    expect(() => guard.canActivate(makeContext({ headers: { "x-agent-key": KEY } }))).toThrow(
      ServiceUnavailableException,
    );
  });
});

describe("normalizeIp", () => {
  it("saca el prefijo ::ffff: y no toca el resto", () => {
    expect(normalizeIp("::ffff:10.1.2.3")).toBe("10.1.2.3");
    expect(normalizeIp("10.1.2.3")).toBe("10.1.2.3");
    expect(normalizeIp(undefined)).toBe("");
  });
});
