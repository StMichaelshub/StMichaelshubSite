import axios from "axios";
import { vi } from "vitest";
import verifyHandler from "@/pages/api/paystack/verify";
import {
  createApiMocks,
  createReservedOrderFixture,
  getOrderById,
  getProductById,
} from "./test-helpers";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("payment verification", () => {
  it("finalizes a reserved order and converts reserved stock into sold stock", async () => {
    const { order, product } = await createReservedOrderFixture({ quantity: 3 });

    axios.get.mockResolvedValue({
      data: {
        data: {
          status: "success",
          amount: Math.round(order.total * 100),
          reference: "paystack-ref-123",
          channel: "card",
          metadata: {
            orderId: String(order._id),
          },
        },
      },
    });

    const { req, res } = createApiMocks({
      method: "POST",
      body: { reference: "paystack-ref-123" },
    });

    await verifyHandler(req, res);

    expect(res.statusCode).toBe(200);

    const payload = res._getJSONData();
    const finalizedOrder = await getOrderById(order._id);
    const updatedProduct = await getProductById(product._id);

    expect(payload.success).toBe(true);
    expect(finalizedOrder.paid).toBe(true);
    expect(finalizedOrder.paymentReference).toBe("paystack-ref-123");
    expect(finalizedOrder.reservationStatus).toBe("finalized");
    expect(updatedProduct.quantity).toBe(22);
    expect(updatedProduct.reservedQuantity).toBe(0);
  });
});