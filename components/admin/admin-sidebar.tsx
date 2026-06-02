"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores";
import { motion } from "framer-motion";
import { BarChart3, Users, Calendar, Settings, QrCode, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Employees", href: "/admin/employees" },
  { icon: Calendar, label: "Attendance", href: "/admin/attendance" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

interface AdminSidebarProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export function AdminSidebar({ open, setOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "A";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r border-[#E5E2DB] transition-all duration-300 flex flex-col",
        open ? "w-[220px]" : "w-[64px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#F0EDE6] h-[60px]">
        {open ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center shadow-[0_3px_10px_rgba(196,148,38,0.28)]">
                <QrCode className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span
                className="text-[15px] text-[#1C1C1A]"
                style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600 }}
              >
                AttendQR
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#9A9890] hover:text-[#1C1C1A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center mx-auto shadow-[0_3px_10px_rgba(196,148,38,0.28)]">
            <QrCode className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {open && (
          <p className="px-3 mb-2 text-[10px] font-bold text-[#B0AEA9] uppercase tracking-[0.1em]">
            Menu
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
                open ? "justify-start" : "justify-center",
                isActive
                  ? "bg-[#FBF5E6] text-[#9A7A1A]"
                  : "text-[#6B6965] hover:bg-[#F5F3EE] hover:text-[#1C1C1A]"
              )}
              title={!open ? item.label : undefined}
            >
              {isActive && open && (
                <motion.div
                  layoutId="adminSidebarActive"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C49426] rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#C49426]" : "")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {open && item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[#F0EDE6] space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#9A9890] hover:bg-red-50 hover:text-red-600 transition-all",
            open ? "justify-start" : "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
          {open && "Sign Out"}
        </button>
        {open && (
          <div className="mt-2 pt-2 border-t border-[#F0EDE6] flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#1C1C1A] truncate">{user?.name}</p>
              <p className="text-[11px] text-[#9A9890] truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}