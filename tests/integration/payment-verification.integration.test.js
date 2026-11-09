import axios from "axios";
import { vi } from "vitest";
import verifyHandler from "@/pages/api/paystack/verify";
import { buildOrderDraft } from "@/lib/checkout";
import { createReservedOrder } from "@/lib/orderLifecycle";
import Transaction from "@/models/Transaction";
import { Product } from "@/models/Product";
import {
  createApiMocks,
  createOnlineCustomer,
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
    const transaction = await Transaction.findOne({
      externalId: `order:${String(order._id)}`,
    }).lean();

    expect(payload.success).toBe(true);
    expect(finalizedOrder.paid).toBe(true);
    expect(finalizedOrder.paymentReference).toBe("paystack-ref-123");
    expect(finalizedOrder.reservationStatus).toBe("finalized");
    expect(finalizedOrder.inventoryFinalizedBy).toBe("paystack");
    expect(updatedProduct.quantity).toBe(22);
    expect(updatedProduct.reservedQuantity).toBe(0);
    expect(updatedProduct.totalUnitsSold).toBe(3);
    expect(updatedProduct.totalRevenue).toBe(45000);
    expect(transaction).toMatchObject({
      tenderType: "ONLINE",
      total: order.total,
      inventoryUpdated: true,
      salesChannel: "ONLINE_STORE",
      sourceOrderId: String(order._id),
      sourceOrderType: "online-order",
      sourceSiteKey: "store",
      status: "completed",
    });
    expect(transaction.items[0]).toMatchObject({
      productId: product._id,
      qty: 3,
      salePriceIncTax: 15000,
    });
  });

  it("finalizes child unit orders through parent pack stock for POS-compatible inventory", async () => {
    const customer = await createOnlineCustomer();
    const parent = await Product.create({
      name: "Bottle Water Pack",
      description: "A pack of bottled water.",
      costPrice: 1200,
      salePriceIncTax: 1800,
      quantity: 5,
      reservedQuantity: 0,
      category: "Drinks",
      locations: ["warehouse"],
      packType: "pack",
      qtyPerPack: 12,
      images: [
        {
          full: "/images/product-placeholder.svg",
          thumb: "/images/product-placeholder.svg",
        },
      ],
    });
    const child = await Product.create({
      name: "Bottle Water Unit",
      description: "Single bottle of water.",
      costPrice: 100,
      salePriceIncTax: 180,
      quantity: 60,
      reservedQuantity: 0,
      category: "Drinks",
      locations: ["warehouse"],
      isChildProduct: true,
      parentProduct: parent._id,
      packType: "unit",
      qtyPerPack: 12,
      images: [
        {
          full: "/images/product-placeholder.svg",
          thumb: "/images/product-placeholder.svg",
        },
      ],
    });

    const orderDraft = await buildOrderDraft({
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
      },
      cartProducts: [{ _id: String(child._id), quantity: 6 }],
      siteKey: "store",
    });

    const order = await createReservedOrder({
      customer,
      customerId: customer._id,
      orderDraft,
    });

    axios.get.mockResolvedValue({
      data: {
        data: {
          status: "success",
          amount: Math.round(order.total * 100),
          reference: "paystack-child-ref-123",
          channel: "card",
          metadata: {
            orderId: String(order._id),
          },
        },
      },
    });

    const { req, res } = createApiMocks({
      method: "POST",
      body: { reference: "paystack-child-ref-123" },
    });

    await verifyHandler(req, res);

    expect(res.statusCode).toBe(200);

    const updatedParent = await getProductById(parent._id);
    const updatedChild = await getProductById(child._id);
    const transaction = await Transaction.findOne({
      externalId: `order:${String(order._id)}`,
    }).lean();

    expect(updatedParent.quantity).toBe(4.5);
    expect(updatedParent.reservedQuantity).toBe(0);
    expect(updatedChild.quantity).toBe(54);
    expect(updatedChild.reservedQuantity).toBe(0);
    expect(updatedChild.totalUnitsSold).toBe(6);
    expect(transaction.items[0]).toMatchObject({
      productId: child._id,
      qty: 6,
      salePriceIncTax: 180,
    });
  });
});