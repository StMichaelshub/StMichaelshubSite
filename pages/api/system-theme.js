import { mongooseConnect } from "@/lib/mongoose";
import { DEFAULT_SYSTEM_THEME } from "@/lib/systemTheme";
import SystemTheme from "@/models/SystemTheme";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    let theme = await SystemTheme.findOne({ key: "system-theme" }).lean();
    if (!theme) {
      const createdTheme = await SystemTheme.create(DEFAULT_SYSTEM_THEME);
      theme = createdTheme.toObject();
    }

    return res.status(200).json({ success: true, theme: { ...DEFAULT_SYSTEM_THEME, ...theme } });
  } catch (error) {
    console.error("Failed to load storefront system theme:", error);
    return res.status(200).json({ success: false, theme: DEFAULT_SYSTEM_THEME });
  }
}