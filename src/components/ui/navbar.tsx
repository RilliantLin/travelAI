"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Plane, LayoutDashboard, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

const NAV_ITEMS = [
  {
    href: "/plan/new",
    label: "行程规划",
    icon: LayoutDashboard,
    exact: false,
  },
  {
    href: "/profile/preferences",
    label: "偏好设置",
    icon: Settings,
    exact: false,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { toggleHistoryDrawer, isHistoryDrawerOpen } = useUIStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHistoryDrawer}
            title="历史线路"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              isHistoryDrawerOpen
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <History className="h-4 w-4" />
            历史线路
          </button>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Plane className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-gray-900">旅游规划 AI</span>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
