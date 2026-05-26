// src/components/layout/MegaMenu.tsx

import { menuService } from "@/services/menu.service";
import MegaMenuClient from "./MegaMenuClient";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

export default async function MegaMenu({ variant }: { variant: "desktop" | "mobile" }) {
  let groups: any[] = [];

  try {
    // Safely fetch data
    const menuData = await menuService.getMegaMenu("main-menu");
    groups = menuData?.groups || [];
  } catch (error) {
    console.error("Failed to fetch MegaMenu data:", error);
  }

  // 1. If requested by the Header, return ONLY the Desktop UI
  if (variant === "desktop") {
    return <MegaMenuClient groups={groups} />;
  }

  // 2. If requested by the Root Layout, return ONLY the Mobile UI
  return <MobileMenuDrawer groups={groups} />;
}