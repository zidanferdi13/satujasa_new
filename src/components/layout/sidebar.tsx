"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { MemberRole } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react";

const ownerNavItems = [
  { href: "/dashboard/owner", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/owner/operators", label: "Operators", icon: Users },
  { href: "/dashboard/owner/revenue", label: "Revenue", icon: DollarSign },
  { href: "/dashboard/owner/settings", label: "Settings", icon: Settings },
];

const operatorNavItems = [
  { href: "/dashboard/operator", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/operator/files", label: "Files", icon: FileText },
  { href: "/dashboard/operator/transactions", label: "Transactions", icon: DollarSign },
];

export function DashboardSidebar({ role }: { role: MemberRole }) {
  const pathname = usePathname();
  const navItems = role === MemberRole.OWNER ? ownerNavItems : operatorNavItems;

  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-6">
        <h1 className="text-xl font-bold">Biro Jasa</h1>
        <p className="text-sm text-gray-500 capitalize">{role.toLowerCase()} Dashboard</p>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-4 px-4">
        {/* BUG-01: signOut() fetches the CSRF token and clears the session cookie. */}
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/login" })}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
