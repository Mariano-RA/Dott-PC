import { DolaresController } from "./dolar.controller";

describe("DolaresController", () => {
  it("forwards proveedor query to service", async () => {
    const service = {
      getByProvider: jest.fn().mockResolvedValue({ proveedor: "air", precioDolar: 1 }),
    } as any;

    const controller = new DolaresController(service);
    await controller.getByProvider("air");

    expect(service.getByProvider).toHaveBeenCalledWith("air");
  });
});
