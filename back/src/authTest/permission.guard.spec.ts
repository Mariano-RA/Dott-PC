import { ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { PermissionGuard } from "./permission.guard";

function createConfigServiceMock(overrides: { NODE_ENV?: string; LOCAL_DEV_AUTH_BYPASS?: string } = {}) {
  return {
    get: jest.fn((key: string) => overrides[key as keyof typeof overrides] ?? null),
  } as unknown as ConfigService;
}

describe("PermissionGuard", () => {
  it("allows when user has required permission", () => {
    const reflector = {
      get: jest.fn().mockReturnValue(["create:tablas"]),
    } as unknown as Reflector;
    const configService = createConfigServiceMock({ NODE_ENV: "production" });

    const guard = new PermissionGuard(reflector, configService);
    const context = {
      getArgs: () => [{ auth: { payload: { permissions: ["create:tablas"] } } }],
      getHandler: () => ({}),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws when user lacks required permission", () => {
    const reflector = {
      get: jest.fn().mockReturnValue(["create:tablas"]),
    } as unknown as Reflector;
    const configService = createConfigServiceMock({ NODE_ENV: "production" });

    const guard = new PermissionGuard(reflector, configService);
    const context = {
      getArgs: () => [{ auth: { payload: { permissions: [] } } }],
      getHandler: () => ({}),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows with local bypass enabled", () => {
    const reflector = {
      get: jest.fn().mockReturnValue(["create:tablas"]),
    } as unknown as Reflector;
    const configService = createConfigServiceMock({
      NODE_ENV: "development",
      LOCAL_DEV_AUTH_BYPASS: "true",
    });

    const guard = new PermissionGuard(reflector, configService);
    const context = {
      getArgs: () => [{ auth: { payload: { permissions: [] } } }],
      getHandler: () => ({}),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
