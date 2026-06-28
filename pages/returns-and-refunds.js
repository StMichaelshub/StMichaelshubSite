import PolicyPageLayout from "@/components/PolicyPageLayout";
import { useRouter } from "next/router";
import { getPublicSiteConfig, inferPublicSiteFromPath, normalizePublicSite } from "@/lib/publicSite";

export default function ReturnsAndRefundsPage() {
  const router = useRouter();
  const site = getPublicSiteConfig(normalizePublicSite(inferPublicSiteFromPath(router.pathname)));
  const sections = site.key === "hotel"
    ? [
        {
          heading: "Reservation changes and cancellations",
          body: [
            "Guests should review reservation details promptly and contact the hotel as soon as possible if a booking request, stay window, or table request needs to be changed or cancelled.",
            "Website-based cancellation may be available only while the request remains in a status that still allows guest-side cancellation.",
          ],
        },
        {
          heading: "Incorrect or unworkable arrangements",
          body: [
            "If a confirmed reservation contains a verified error or a stay cannot proceed because of an operational issue, the hotel may review the booking and determine an appropriate remedy, such as a corrected reservation, date adjustment, or refund review where applicable.",
            "Guests may be asked to provide reservation details or a short description of the issue so the team can review the request properly.",
          ],
        },
        {
          heading: "Situations that may limit refunds",
          body: [
            "Refund eligibility may depend on whether the reservation was confirmed, whether the guest cancelled within the relevant notice period, and whether any reserved services were already committed or consumed.",
            "The hotel may decline refund requests where the reservation terms, timing, or available facts do not support a responsible refund outcome.",
          ],
        },
        {
          heading: "Refund timing",
          body: [
            "Approved refund outcomes may depend on the original payment method, the reservation terms agreed with the hotel, and any relevant payment provider processing timeline.",
            "Guests should contact the hotel if an expected cancellation or refund update has not been received within a reasonable operational period.",
          ],
        },
      ]
    : [
        {
          heading: "General returns position",
          body: [
            "Customers should inspect delivered items promptly and contact the store as soon as possible if an order is incorrect, damaged, incomplete, or materially inconsistent with what was purchased.",
            "Because the store handles food, drinks, and essential goods, return eligibility may depend on product condition, product type, and whether the item is safe and suitable for resale or replacement handling.",
          ],
        },
        {
          heading: "Damaged, missing, or incorrect orders",
          body: [
            "Where a verified delivery issue exists, the store may review the order and determine an appropriate remedy such as replacement, partial adjustment, or refund handling, depending on the circumstances.",
            "Customers may be asked to provide order details, photos, or a short description of the issue to support review.",
          ],
        },
        {
          heading: "Non-returnable situations",
          body: [
            "Items that have been consumed, opened, tampered with, improperly stored after delivery, or reported too late to verify safely may not qualify for return or refund handling.",
            "The store may decline return requests where the product condition or the facts available do not support a responsible resolution.",
          ],
        },
        {
          heading: "Refund timing",
          body: [
            "Approved refund outcomes may depend on the original payment method and the relevant payment provider's processing timeline.",
            "Customers should contact the store if an expected resolution or refund update has not been received within a reasonable operational period.",
          ],
        },
      ];
  return (
    <PolicyPageLayout
      title={site.key === "hotel" ? "Reservation Changes & Refunds" : "Returns & Refunds"}
      intro={site.key === "hotel"
        ? `This policy explains how ${site.displayName} handles booking changes, cancellation requests, and refund review where a guest reservation issue arises.`
        : `This policy explains how ${site.displayName} reviews issues with delivered goods and how return or refund requests are handled where appropriate.`}
      sections={sections}
    />
  );
}