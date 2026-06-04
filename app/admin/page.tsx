// FILE PATH: app/admin/page.tsx

"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Users, Clock, CheckCircle2, XCircle, Calendar, RefreshCw,
  BarChart3, LogOut, Menu, X, Settings, Bell, QrCode,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Employees", href: "/admin/employees" },
  { icon: Calendar, label: "Attendance", href: "/admin/attendance" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
];

// ✅ Updated: removed late, added overtime
const PIE_COLORS = ["#22c55e", "#C49426", "#ef4444"];

function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
  };

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "A";

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white border-r border-[#E5E2DB] transition-all duration-300 flex flex-col",
      open ? "w-[220px]" : "w-[64px]"
    )}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#F0EDE6] h-[60px]">
        {open && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center shadow-[0_3px_10px_rgba(196,148,38,0.28)] flex-shrink-0">
              <QrCode className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-[15px] text-[#1C1C1A]" style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600 }}>
              AttendQR
            </span>
          </div>
        )}
        {!open && (
          <div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center mx-auto">
            <QrCode className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
        )}
        {open && (
          <button onClick={() => setOpen(false)} className="text-[#9A9890] hover:text-[#1C1C1A] transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {open && <p className="px-3 mb-2 text-[10px] font-bold text-[#B0AEA9] uppercase tracking-[0.1em]">Menu</p>}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
                open ? "justify-start" : "justify-center",
                isActive ? "bg-[#FBF5E6] text-[#9A7A1A]" : "text-[#6B6965] hover:bg-[#F5F3EE] hover:text-[#1C1C1A]"
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
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#C49426]" : "")} strokeWidth={isActive ? 2.5 : 2} />
              {open && item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-[#F0EDE6] space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#9A9890] hover:bg-red-50 hover:text-red-600 transition-all duration-150",
            open ? "justify-start" : "justify-center"
          )}
          title={!open ? "Sign Out" : undefined}
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

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading, mutate: mutateStats } =
    useSWR("/api/dashboard/stats", fetcher, { refreshInterval: 30000 });
  const { data: chartData, isLoading: chartLoading } =
    useSWR("/api/dashboard/chart", fetcher);
  const { data: todayAttendanceData, mutate: mutateAttendance } =
    useSWR("/api/attendance/today", fetcher, { refreshInterval: 10000 });

  const todayAttendance = Array.isArray(todayAttendanceData)
    ? todayAttendanceData
    : Array.isArray(todayAttendanceData?.data)
    ? todayAttendanceData.data
    : [];

  // ✅ Updated: Late → Overtime
  const pieData = stats?.data ? [
    { name: "Present", value: stats.data.present || 0 },
    { name: "Overtime", value: stats.data.overtime || 0 },
    { name: "Absent", value: stats.data.absent || 0 },
  ] : [];

  // ✅ Updated: "Late Today" → "Overtime Today"
  const statCards = [
    { title: "Total Employees", value: stats?.data?.totalEmployees || 0, icon: Users, color: "#C49426", trend: null },
    { title: "Present Today", value: stats?.data?.present || 0, icon: CheckCircle2, color: "#22c55e", trend: "up" },
    { title: "Overtime Today", value: stats?.data?.overtime || 0, icon: Clock, color: "#f59e0b", trend: null },
    { title: "Absent Today", value: stats?.data?.absent || 0, icon: XCircle, color: "#ef4444", trend: "down" },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>
      <div className="min-h-screen bg-[#F5F3EE]">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        <main className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "ml-[220px]" : "ml-[64px]")}>
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-[60px] bg-white border-b border-[#E5E2DB]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1C1C1A]">Dashboard</h1>
                <p className="text-[11px] text-[#9A9890]">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/scanner")}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-medium text-[#C49426] bg-[#FBF5E6] border border-[#E5DCC0] hover:bg-[#F5EDD0] transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" strokeWidth={2} />
                Scanner Kiosk
              </button>
              <button
                onClick={() => { mutateStats(); mutateAttendance(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors">
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <div className="p-6 space-y-5 max-w-[1400px]">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-white rounded-2xl border border-[#E5E2DB] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[12px] font-medium text-[#9A9890] uppercase tracking-[0.05em]">{s.title}</p>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color + "18" }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="text-[28px] font-bold text-[#1C1C1A] leading-none mb-2">
                    {statsLoading ? "—" : s.value}
                  </p>
                  {s.trend && (
                    <div className={cn("flex items-center gap-1 text-[11px] font-medium", s.trend === "up" ? "text-green-600" : "text-[#9A9890]")}>
                      {s.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      vs. yesterday
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E2DB] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-5">
                  <h2 className="text-[14px] font-semibold text-[#1C1C1A]">Weekly Attendance</h2>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Trends for the past 7 days</p>
                </div>
                <div className="h-[220px]">
                  {chartLoading ? (
                    <div className="h-full flex items-center justify-center text-[13px] text-[#9A9890]">Loading…</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData?.data?.weekly || []}>
                        <defs>
                          <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          {/* ✅ Changed: late → overtime gradient */}
                          <linearGradient id="gOvertime" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#C49426" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#C49426" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE6" />
                        <XAxis dataKey="date" stroke="#C2C0BB" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#C2C0BB" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#fff", border: "1px solid #E5E2DB", borderRadius: "10px", fontSize: "12px" }}
                          cursor={{ stroke: "#E5E2DB" }}
                        />
                        <Area type="monotone" dataKey="present" stroke="#22c55e" fill="url(#gPresent)" strokeWidth={2} name="Present" />
                        {/* ✅ Changed: late → overtime */}
                        <Area type="monotone" dataKey="overtime" stroke="#C49426" fill="url(#gOvertime)" strokeWidth={2} name="Overtime" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-[#E5E2DB] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
              >
                <div className="mb-4">
                  <h2 className="text-[14px] font-semibold text-[#1C1C1A]">Today's Breakdown</h2>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Attendance status split</p>
                </div>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                        {pieData.map((_, i) => (
                          <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E2DB", borderRadius: "10px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-[#6B6965]">{d.name}</span>
                      </div>
                      <span className="font-semibold text-[#1C1C1A]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recent check-ins */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-[#1C1C1A]">Recent Check-ins</h2>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Live attendance updates</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="divide-y divide-[#F5F3EE]">
                {todayAttendance.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-[#9A9890]">No check-ins recorded today</div>
                ) : (
                  todayAttendance.slice(0, 6).map((record: any, i: number) => {
                    const initials = record.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                    const statusConfig: Record<string, { label: string; classes: string }> = {
                      in_progress: { label: "In Progress", classes: "bg-blue-50 text-blue-700" },
                      complete: { label: "Complete", classes: "bg-green-50 text-green-700" },
                      undertime: { label: "Undertime", classes: "bg-orange-50 text-orange-700" },
                      overtime: { label: "Overtime", classes: "bg-[#FBF5E6] text-[#9A7A1A]" },
                      auto_signed_out: { label: "Auto Sign-out", classes: "bg-red-50 text-red-700" },
                    };
                    const status = statusConfig[record.status] || { label: "In Progress", classes: "bg-blue-50 text-blue-700" };

                    return (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFAF8] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#1C1C1A]">{record.employee?.name}</p>
                            <p className="text-[11px] text-[#9A9890]">{record.employee?.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-[#1C1C1A]">
                            {record.timeIn ? format(new Date(record.timeIn), "h:mm a") : "—"}
                          </p>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full", status.classes)}>
                            {status.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}
