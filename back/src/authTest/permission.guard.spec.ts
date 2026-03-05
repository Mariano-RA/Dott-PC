import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionGuard } from "./permission.guard";

describe("PermissionGuard", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalBypass = process.env.LOCAL_DEV_AUTH_BYPASS;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOCAL_DEV_AUTH_BYPASS = originalBypass;
  });

  it("allows when user has required permission", () => {
    const reflector = {
      get: jest.fn().mockReturnValue(["create:tablas"]),
    } as unknown as Reflector;

    const guard = new PermissionGuard(reflector);
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

    const guard = new PermissionGuard(reflector);
    const context = {
      getArgs: () => [{ auth: { payload: { permissions: [] } } }],
      getHandler: () => ({}),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows with local bypass enabled", () => {
    process.env.NODE_ENV = "development";
    process.env.LOCAL_DEV_AUTH_BYPASS = "true";

    const reflector = {
      get: jest.fn().mockReturnValue(["create:tablas"]),
    } as unknown as Reflector;

    const guard = new PermissionGuard(reflector);
    const context = {
      getArgs: () => [{ auth: { payload: { permissions: [] } } }],
      getHandler: () => ({}),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });
});
