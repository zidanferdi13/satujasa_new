"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { MemberRole } from "@prisma/client";
import { Building2, Download, FolderOpen, LayoutDashboard, LogOut, ReceiptText } from "lucide-react";
import { UI } from "@/lib/ui-strings";
import type { SessionRole } from "@/lib/access";

// A16: only routes that exist. Berkas opened in M3; Operators, Pendapatan and Pengaturan return
// with the milestone that builds their page, in the same commit as the route.
// §19: export is the one owner route that works while the subscription is lapsed (A12), so it is
// also the only link a locked owner gets. The rest would redirect straight back to the locked
// screen — A19's "no dead links" covers links that only look alive.
const ownerNavItems = [
  { href: "/dashboard/owner", label: UI.nav.dashboard, icon: LayoutDashboard, exact: true },
  { href: "/dashboard/owner/files", label: UI.nav.files, icon: FolderOpen, exact: false },
  { href: "/dashboard/owner/export", label: UI.exp.nav, icon: Download, exact: false },
];
const ownerLockedNavItems = [
  { href: "/dashboard/owner/export", label: UI.exp.nav, icon: Download, exact: false },
];
const operatorNavItems = [
  { href: "/dashboard/operator", label: UI.nav.dashboard, icon: LayoutDashboard, exact: true },
  { href: "/dashboard/operator/files", label: UI.nav.files, icon: FolderOpen, exact: false },
];
// A20: the admin console has no file, KTP or revenue link, because it has no such page.
const adminNavItems = [
  { href: "/dashboard/admin", label: UI.adm.navQueue, icon: ReceiptText, exact: true },
  { href: "/dashboard/admin/organizations", label: UI.adm.navOrgs, icon: Building2, exact: false },
];

export function DashboardSidebar({
  role,
  entitled = true,
}: {
  role: SessionRole;
  entitled?: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = role === "SUPER_ADMIN";
  const isOwner = role === MemberRole.OWNER;
  const navItems = isAdmin
    ? adminNavItems
    : isOwner
      ? entitled
        ? ownerNavItems
        : ownerLockedNavItems
      : operatorNavItems;

  return (
    <aside className="w-64 border-r bg-white">
      <div className="p-6">
        <p className="text-xl font-bold">Biro Jasa</p>
        {isAdmin ? null : (
          <p className="text-sm text-gray-500">
            {isOwner ? UI.nav.ownerSubtitle : UI.nav.operatorSubtitle}
          </p>
        )}
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map((item) => {
          // Beranda matches exactly; a section (Berkas) stays lit on its nested pages.
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
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
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {UI.nav.logout}
        </button>
      </div>
    </aside>
  );
}
