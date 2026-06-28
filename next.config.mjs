/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/products", destination: "/store/products", permanent: false },
      { source: "/categories", destination: "/store/categories", permanent: false },
      { source: "/cartegories", destination: "/store/categories", permanent: false },
      { source: "/product/:id", destination: "/store/product/:id", permanent: false },
      { source: "/cart", destination: "/store/cart", permanent: false },
      { source: "/account", destination: "/store/account", permanent: false },
      { source: "/about", destination: "/store/about", permanent: false },
      { source: "/contact", destination: "/store/contact", permanent: false },
      { source: "/privacy-policy", destination: "/store/privacy-policy", permanent: false },
      { source: "/terms-of-service", destination: "/store/terms-of-service", permanent: false },
      { source: "/shipping-policy", destination: "/store/shipping-policy", permanent: false },
      { source: "/returns-and-refunds", destination: "/store/returns-and-refunds", permanent: false },
      {
        source: "/checkout/order-confirmation/:id",
        destination: "/store/checkout/order-confirmation/:id",
        permanent: false,
      },
      { source: "/hotel/products", destination: "/hotel/rooms", permanent: false },
      { source: "/hotel/categories", destination: "/hotel/lounge", permanent: false },
      { source: "/hotel/product/:id", destination: "/hotel/rooms/:id", permanent: false },
      { source: "/hotel/cart", destination: "/hotel/booking", permanent: false },
      { source: "/hotel/account", destination: "/hotel/manage-bookings", permanent: false },
    ];
  },
};

export default nextConfig;
