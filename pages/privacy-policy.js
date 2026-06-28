import PolicyPageLayout from "@/components/PolicyPageLayout";
import { useRouter } from "next/router";
import { getPublicSiteConfig, inferPublicSiteFromPath, normalizePublicSite } from "@/lib/publicSite";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const site = getPublicSiteConfig(normalizePublicSite(inferPublicSiteFromPath(router.pathname)));
  const sections = site.key === "hotel"
    ? [
        {
          heading: "Information we collect",
          body: [
            "We collect the guest information required to review room requests, table reservations, support arrival planning, and respond to reservation or service questions. This can include name, email address, phone number, stay dates, guest counts, and request notes.",
            "We also process limited technical and session data needed to keep the public hotel pages secure, maintain reservation access links, and diagnose service issues.",
          ],
        },
        {
          heading: "How we use your data",
          body: [
            "Guest data is used to create and manage booking requests, table reservations, reservation confirmations, and direct communication about availability or arrival details.",
            "We limit internal access to the information needed to run the hotel-side service and do not use reservation data for unrelated purposes without a lawful basis.",
          ],
        },
        {
          heading: "Reservation communications",
          body: [
            "Email communication may be used to confirm booking requests, send reservation management links, and notify guests about booking changes or cancellations.",
            "Guests should ensure their contact details remain accurate so the hotel can provide confirmation and service follow-up without delay.",
          ],
        },
        {
          heading: "Data access and contact",
          body: [
            "Guests may contact the hotel to correct submitted reservation details, request help with a booking, or raise privacy-related concerns regarding reservation records.",
            "Operational records may be retained for legitimate business, accounting, fraud prevention, and guest support needs.",
          ],
        },
      ]
    : [
        {
          heading: "Information we collect",
          body: [
            "We collect the customer information required to process orders, support delivery, and respond to account or service requests. This can include name, email address, phone number, delivery address, city, and order history.",
            "We also process limited technical and session data needed to keep the storefront secure, maintain customer sessions, and diagnose service issues.",
          ],
        },
        {
          heading: "How we use your data",
          body: [
            "Customer data is used to create and manage orders, arrange delivery, send sign-in codes, and share order updates.",
            "We do not use your order data for unrelated purposes without a lawful basis, and we limit internal access to the information needed to support customers and run the service.",
          ],
        },
        {
          heading: "Payments and communications",
          body: [
            "Order updates may be sent by email, and the team may contact customers directly if more information is needed to complete an order.",
            "Email communication may be used for sign-in codes, order updates, and support follow-up. Customers should ensure their contact details remain accurate for service continuity.",
          ],
        },
        {
          heading: "Data access and contact",
          body: [
            "Customers may contact the store to correct profile information, request help with an order, or raise privacy-related concerns regarding their account or transaction records.",
            "Operational records may be retained for legitimate business, accounting, fraud prevention, and customer support needs.",
          ],
        },
      ];
  return (
    <PolicyPageLayout
      title="Privacy Policy"
      intro={site.key === "hotel"
        ? `This policy explains how ${site.displayName} handles guest information used for booking requests, table reservations, reservation management, and guest communication.`
        : `This policy explains how ${site.displayName} handles customer information used for orders, account access, and delivery coordination.`}
      sections={sections}
    />
  );
}