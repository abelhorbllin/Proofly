import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Search,
  Megaphone,
  Package,
  Activity,
  TrendingUp,
  ShieldCheck,
  Sliders,
  Calculator,
  Users,
  Swords,
  Radar,
  Sparkles,
  Bell,
  History,
  Bookmark,
  FileText,
  CreditCard,
  Settings,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Analyze",
    items: [
      { title: "Store", href: "/analyze/store", icon: Search },
      { title: "Product", href: "/analyze/product", icon: Package },
      { title: "Ad", href: "/analyze/ad", icon: Megaphone },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { title: "Ads", href: "/ads", icon: Megaphone },
      { title: "Products", href: "/products", icon: Package },
      { title: "Traffic", href: "/stores", icon: Activity },
      { title: "Revenue", href: "/simulator/revenue", icon: TrendingUp },
    ],
  },
  {
    title: "Validation",
    items: [
      { title: "Validate Product", href: "/validate", icon: ShieldCheck },
      { title: "Revenue Simulator", href: "/simulator/revenue", icon: Sliders },
      { title: "Unit Economics", href: "/simulator/unit-economics", icon: Calculator },
    ],
  },
  {
    title: "Competitors",
    items: [
      { title: "Competitor List", href: "/competitors", icon: Users },
      { title: "Compare", href: "/compare", icon: Swords },
      { title: "Tracking", href: "/competitors?tab=tracking", icon: Radar },
    ],
  },
  {
    title: "Insights",
    items: [
      { title: "AI Strategy", href: "/ai", icon: Sparkles },
      { title: "Alerts", href: "/alerts", icon: Bell },
      { title: "Timeline", href: "/timeline", icon: History },
    ],
  },
  {
    title: "Workspace",
    items: [
      { title: "Saved", href: "/saved", icon: Bookmark },
      { title: "Reports", href: "/reports", icon: FileText },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Billing", href: "/settings/billing", icon: CreditCard },
      { title: "Account", href: "/settings", icon: Settings },
    ],
  },
];
