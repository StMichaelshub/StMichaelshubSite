import PolicyPageLayout from "@/components/PolicyPageLayout";
import { STORE_DETAILS } from "@/lib/storeDetails";
import { useRouter } from "next/router";
import { getPublicSiteConfig, inferPublicSiteFromPath, normalizePublicSite } from "@/lib/publicSite";

export default function ContactPage() {
  const router = useRouter();
  const site = getPublicSiteConfig(normalizePublicSite(inferPublicSiteFromPath(router.pathname)));
  const isHotelSite = site.key === "hotel";
  const sections = isHotelSite
    ? [
        {
          heading: "How to reach reservations",
          body: [
            `Guests can contact ${site.displayName} by email at ${STORE_DETAILS.email} or by phone using ${STORE_DETAILS.phoneNumbers.join(" or ")} for booking questions, arrival support, lounge reservations, and general hotel inquiries.`,
            "For faster support, use the same email address used for the booking or table request so the hotel team can trace your reservation quickly.",
          ],
        },
        {
          heading: "Helpful details to include",
          body: [
            "When following up on a room request, include your booking reference, intended stay dates, and any arrival notes that may affect the reservation.",
            "For lounge reservations, include the reservation reference, party size, preferred time, and any special occasion or seating request you want the team to review.",
          ],
        },
        {
          heading: "Guest support context",
          body: [
            "The hotel may follow up if booking details, arrival plans, or availability need clarification.",
            "Please keep your email and phone available after making a request so the team can respond quickly.",
          ],
        },
      ]
    : [
        {
          heading: `How to reach the ${site.shortLabel.toLowerCase()} desk`,
          body: [
            `Customers can contact the business by email at ${STORE_DETAILS.email} or by phone using ${STORE_DETAILS.phoneNumbers.join(" or ")} for general questions, order updates, and delivery support.`,
            "For faster support, use the same email address connected to the order or account you are asking about.",
          ],
        },
        {
          heading: "Helpful details to include",
          body: [
            "When following up on an order, include your order reference, delivery city, and a short summary of the issue so the team can review the request quickly.",
            "For account-access questions, mention whether the issue relates to your sign-in code, your email address, or your saved details so support can respond with the right next step.",
          ],
        },
        {
          heading: "When we may follow up",
          body: [
            "We may contact you if we need to confirm delivery details, payment information, or another part of your order.",
            "Please keep your phone and email available after placing an order in case the team needs clarification.",
          ],
        },
      ];

  return (
    <PolicyPageLayout
      title="Contact Us"
      intro={isHotelSite
        ? `Reach the ${site.shortLabel.toLowerCase()} side for help with reservations, stay changes, arrival coordination, lounge bookings, or general guest inquiries.`
        : `Reach the ${site.shortLabel.toLowerCase()} side for help with orders, delivery questions, sign-in codes, or general business inquiries.`}
      sections={sections}
      eyebrow={isHotelSite ? "Guest support" : "Customer support"}
      supportHref="/about"
      supportLabel={`About the ${site.shortLabel.toLowerCase()} side`}
      relatedTitle="Support pages"
    />
  );
}