import PolicyPageLayout from "@/components/PolicyPageLayout";
import { useRouter } from "next/router";
import { getPublicSiteConfig, inferPublicSiteFromPath, normalizePublicSite } from "@/lib/publicSite";

export default function AboutPage() {
  const router = useRouter();
  const site = getPublicSiteConfig(normalizePublicSite(inferPublicSiteFromPath(router.pathname)));
  const isHotelSite = site.key === "hotel";
  const sections = isHotelSite
    ? [
        {
          heading: "What the hotel side is built for",
          body: [
            `${site.displayName} is designed as a direct hospitality experience where guests can browse rooms, review lounge offerings, and send reservation requests without going through an ecommerce checkout flow.`,
            "This side focuses on guest comfort, calmer browsing, and direct communication with the reservations desk for room stays, lounge visits, and booking follow-up.",
          ],
        },
        {
          heading: "How reservations are handled",
          body: [
            "Room requests and table reservations are submitted directly to the hotel team, who then confirm availability, timing, and any guest-specific notes before finalizing arrangements.",
            "Reservation confirmations, management links, and follow-up communication are kept tied to the guest email used during submission so the hotel can respond with the right context.",
          ],
        },
        {
          heading: "Guest service focus",
          body: [
            "The hotel side is built to keep room selection, reservation lookups, and support information clear on mobile and desktop without pushing guests through stock, cart, or warehouse-style interactions.",
            "Contact routes, booking management pages, and hotel policy pages stay visible throughout the public site so guests can quickly find help before or after they submit a request.",
          ],
        },
      ]
    : [
        {
          heading: `What the ${site.shortLabel.toLowerCase()} side is built for`,
          body: [
            `${site.displayName} helps customers shop groceries, drinks, and household items in one simple storefront.`,
            "This side focuses on practical essentials, clear browsing, and an easier path from product discovery to order placement.",
          ],
        },
        {
          heading: `How ordering works on the ${site.shortLabel.toLowerCase()} side`,
          body: [
            "Products, prices, and delivery fees are checked before an order is placed so customers can review a clear final total.",
            "When an order is placed, both the customer and the store receive a confirmation email.",
            "Customers can also sign in with an email code to review past orders and update their details.",
          ],
        },
        {
          heading: "Customer service focus",
          body: [
            `The ${site.shortLabel.toLowerCase()} side is designed to keep ordering clear, mobile-friendly, and easy to recover when customers need help with delivery details, account access, or payment confirmation.`,
            "Policy pages, contact routes, and footer navigation are provided so important information stays accessible across the public site, not hidden behind checkout steps.",
          ],
        },
      ];

  return (
    <PolicyPageLayout
      title="About Us"
      intro={isHotelSite
        ? `Learn how ${site.displayName} approaches direct reservations, guest communication, and lounge service on the hotel side of St Michael's.`
        : `Learn how ${site.displayName} supports product browsing, ordering, and customer support on this side of the business.`}
      sections={sections}
      eyebrow={`About the ${site.shortLabel.toLowerCase()} side`}
      backHref={isHotelSite ? "/rooms" : "/products"}
      backLabel={isHotelSite ? "Browse rooms" : "Browse products"}
      supportHref="/contact"
      supportLabel={isHotelSite ? "Contact reservations" : `Contact the ${site.shortLabel.toLowerCase()} desk`}
      relatedTitle={`${site.shortLabel} pages`}
    />
  );
}