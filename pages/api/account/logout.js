import { clearCustomerSessionCookie } from "@/lib/customerAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  clearCustomerSessionCookie(res);
  return res.status(200).json({ success: true });
}