import { hasFetcher, hasImageCache, hasManualUpload } from "./proveedor.capabilities";

describe("proveedor.capabilities", () => {
  it("marks automatic download providers", () => {
    expect(hasFetcher("MEGA")).toBe(true);
    expect(hasFetcher("eikon")).toBe(false);
  });

  it("marks manual CSV providers", () => {
    expect(hasManualUpload("hdc")).toBe(true);
    expect(hasManualUpload("air")).toBe(false);
  });

  it("marks image-cache providers", () => {
    expect(hasImageCache("elit")).toBe(true);
    expect(hasImageCache("invid")).toBe(false);
  });
});
