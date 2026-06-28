import Customer from "@/models/Customer";
import Order from "@/models/Order";
import { Product } from "@/models/Product";
import ordersHandler from "@/pages/api/orders/index";
import { createApiMocks } from "./test-helpers";

describe("checkout order creation", () => {
  it("creates an online customer order with an active reservation", async () => {
    const product = await Product.create({
      name: "Warehouse Beans",
      description: "Bulk beans delivery pack.",
      costPrice: 5000,
      salePriceIncTax: 6500,
      quantity: 10,
      reservedQuantity: 0,
      category: "Groceries",
      locations: ["warehouse"],
      images: [
        {
          full: "/images/product-placeholder.svg",
          thumb: "/images/product-placeholder.svg",
        },
      ],
    });

    const { req, res } = createApiMocks({
      method: "POST",
      body: {
        customer: {
          name: "Chioma Tester",
          email: "chioma@example.com",
          phone: "08011112222",
          address: "14 Market Road",
          city: "Lagos",
        },
        cartProducts: [{ _id: String(product._id), quantity: 2 }],
        siteKey: "store",
      },
    });

    await ordersHandler(req, res);

    expect(res.statusCode).toBe(201);

    const payload = res._getJSONData();
    const order = await Order.findById(payload.orderId).lean();
    const updatedProduct = await Product.findById(product._id).lean();
    const customer = await Customer.findOne({ email: "chioma@example.com" }).lean();

    expect(payload.success).toBe(true);
    expect(order).toMatchObject({
      status: "Inventory Reserved",
      reservationStatus: "active",
      paid: false,
      paymentStatus: "Pending",
    });
    expect(order.reservationExpiresAt).toBeTruthy();
    expect(order.customerSnapshot.type).toBe("ONLINE");
    expect(updatedProduct.reservedQuantity).toBe(2);
    expect(updatedProduct.quantity).toBe(10);
    expect(customer.type).toBe("ONLINE");
  });
});