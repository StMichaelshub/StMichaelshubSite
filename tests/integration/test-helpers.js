import { createMocks } from "node-mocks-http";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import { Product } from "@/models/Product";
import { buildOrderDraft } from "@/lib/checkout";
import { createReservedOrder } from "@/lib/orderLifecycle";

export function createApiMocks({
  method = "GET",
  body = {},
  query = {},
  headers = {},
} = {}) {
  return createMocks({
    method,
    body,
    query,
    headers,
  });
}

export async function createTestProduct(overrides = {}) {
  return Product.create({
    name: "Premium Rice Bag",
    description: "Long grain rice for weekly shopping.",
    costPrice: 12000,
    salePriceIncTax: 15000,
    quantity: 25,
    reservedQuantity: 0,
    category: "Groceries",
    locations: ["warehouse"],
    images: [
      {
        full: "/images/product-placeholder.svg",
        thumb: "/images/product-placeholder.svg",
      },
    ],
    ...overrides,
  });
}

export async function createOnlineCustomer(overrides = {}) {
  return Customer.create({
    name: "Ada Customer",
    email: "ada@example.com",
    phone: "08012345678",
    address: "12 Teal Avenue",
    city: "Lagos",
    type: "ONLINE",
    ...overrides,
  });
}

export async function createReservedOrderFixture({
  customerOverrides,
  productOverrides,
  quantity = 2,
} = {}) {
  const customer = await createOnlineCustomer(customerOverrides);
  const product = await createTestProduct(productOverrides);

  const orderDraft = await buildOrderDraft({
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
    },
    cartProducts: [{ _id: String(product._id), quantity }],
    siteKey: "store",
  });

  if (orderDraft.errors?.length) {
    throw new Error(orderDraft.errors.join(" "));
  }

  const order = await createReservedOrder({
    customer,
    customerId: customer._id,
    orderDraft,
  });

  return {
    customer,
    product,
    order,
    orderDraft,
  };
}

export async function getOrderById(orderId) {
  return Order.findById(orderId).lean();
}

export async function getProductById(productId) {
  return Product.findById(productId).lean();
}