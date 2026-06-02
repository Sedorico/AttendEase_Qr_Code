// FILE PATH: app/manager/page.tsx

"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle2, XCircle, RefreshCw, BarChart3, LogOut,
  Menu, X, Settings, Bell, QrCode, AlertCircle, ThumbsUp,
  ThumbsDown, User, ChevronDown, ChevronUp, Mail, Briefcase,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", href: "/manager" },
  { icon: User, label: "My Attendance", href: "/employee" },
  { icon: Settings, label: "Settings", href: "/manager/settings" },
];

function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    logout();
    router.push("/login");
  };

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "M";

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white border-r border-[#E5E2DB] transition-all duration-300 flex flex-col",
      open ? "w-[220px]" : "w-[64px]"
    )}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#F0EDE6] h-[60px]">
        {open ? (
          <>
            {/* ✅ Logo clickable — goes to employee dashboard */}
            <button
              onClick={() => router.push("/employee")}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center shadow-[0_3px_10px_rgba(196,148,38,0.28)] flex-shrink-0">
                <QrCode className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-[15px] text-[#1C1C1A]" style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 600 }}>
                AttendEase
              </span>
            </button>
            <button onClick={() => setOpen(false)} className="text-[#9A9890] hover:text-[#1C1C1A] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          // ✅ Collapsed logo also clickable
          <button
            onClick={() => router.push("/employee")}
            className="w-8 h-8 rounded-[9px] bg-[#C49426] flex items-center justify-center mx-auto hover:opacity-80 transition-opacity"
          >
            <QrCode className="w-4 h-4 text-white" strokeWidth={2} />
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
                  layoutId="managerSidebarActive"
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
              <p className="text-[11px] text-[#9A9890] truncate">{user?.department}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default function ManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showEmployees, setShowEmployees] = useState(false);
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading, mutate: mutateStats } =
    useSWR("/api/dashboard/manager/stats", fetcher, { refreshInterval: 30000 });

  const { data: todayData, mutate: mutateAttendance } =
    useSWR("/api/attendance/today?department=true", fetcher, { refreshInterval: 10000 });

  const { data: overtimeData, mutate: mutateOvertime } =
    useSWR("/api/attendance/overtime-requests", fetcher, { refreshInterval: 15000 });

  // ✅ Fetch department employees
  const { data: employeesData } =
    useSWR(showEmployees ? "/api/employees" : null, fetcher);

  const todayAttendance: any[] = Array.isArray(todayData?.data) ? todayData.data
    : Array.isArray(todayData) ? todayData : [];

  const overtimeRequests: any[] = Array.isArray(overtimeData?.data) ? overtimeData.data : [];
  const pendingOT = overtimeRequests.filter((r) => r.overtimeApproved == null && !r.autoSignedOut);

  const deptEmployees: any[] = employeesData?.data?.employees || [];

  const statCards = [
    { title: "Dept Employees", value: stats?.data?.totalEmployees ?? "—", icon: Users, color: "#C49426" },
    { title: "Present Today", value: stats?.data?.present ?? "—", icon: CheckCircle2, color: "#22c55e" },
    { title: "Absent Today", value: stats?.data?.absent ?? "—", icon: XCircle, color: "#ef4444" },
    { title: "Pending OT", value: pendingOT.length, icon: AlertCircle, color: "#f59e0b" },
  ];

  const handleOvertimeAction = async (attendanceId: string, approve: boolean) => {
    setActionLoading(attendanceId + (approve ? "_approve" : "_reject"));
    try {
      await fetch("/api/attendance/overtime-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, approved: approve }),
      });
      mutateOvertime();
      mutateAttendance();
      mutateStats();
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig: Record<string, { label: string; classes: string }> = {
    in_progress: { label: "In Progress", classes: "bg-blue-50 text-blue-700" },
    complete: { label: "Complete", classes: "bg-green-50 text-green-700" },
    undertime: { label: "Undertime", classes: "bg-orange-50 text-orange-700" },
    overtime: { label: "Overtime", classes: "bg-[#FBF5E6] text-[#9A7A1A]" },
    auto_signed_out: { label: "Auto Sign-out", classes: "bg-red-50 text-red-700" },
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>
      <div className="min-h-screen bg-[#F5F3EE]">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        <main className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "ml-[220px]" : "ml-[64px]")}>
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-[60px] bg-white border-b border-[#E5E2DB]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1C1C1A]">
                  {user?.department} — Manager Dashboard
                </h1>
                <p className="text-[11px] text-[#9A9890]">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { mutateStats(); mutateAttendance(); mutateOvertime(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors">
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <div className="p-6 space-y-5 max-w-[1200px]">

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
                    <p className="text-[11px] font-semibold text-[#9A9890] uppercase tracking-[0.06em]">{s.title}</p>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color + "18" }}>
                      <s.icon className="w-4 h-4" style={{ color: s.color }} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="text-[30px] font-bold text-[#1C1C1A] leading-none">
                    {statsLoading ? "—" : s.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* ✅ Department Employees List */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              {/* Header — clickable to toggle */}
              <button
                onClick={() => setShowEmployees(!showEmployees)}
                className="w-full px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FBF5E6] flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#C49426]" strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <h2 className="text-[14px] font-semibold text-[#1C1C1A]">
                      Department Members
                    </h2>
                    <p className="text-[11px] text-[#9A9890]">
                      {user?.department} · {stats?.data?.totalEmployees ?? "—"} employees
                    </p>
                  </div>
                </div>
                {showEmployees
                  ? <ChevronUp className="w-4 h-4 text-[#9A9890]" />
                  : <ChevronDown className="w-4 h-4 text-[#9A9890]" />
                }
              </button>

              <AnimatePresence>
                {showEmployees && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    {deptEmployees.length === 0 ? (
                      <div className="py-10 text-center text-[13px] text-[#9A9890]">
                        No employees found in {user?.department}
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F5F3EE]">
                        {deptEmployees.map((emp: any, i: number) => {
                          const initials = emp.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                          return (
                            <motion.div
                              key={emp._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFAF8] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold text-[#1C1C1A]">{emp.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Briefcase className="w-3 h-3 text-[#B0AEA9]" strokeWidth={2} />
                                    <p className="text-[11px] text-[#9A9890]">{emp.position}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-right">
                                <div className="hidden sm:flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-[#B0AEA9]" strokeWidth={2} />
                                  <p className="text-[11px] text-[#9A9890]">{emp.email}</p>
                                </div>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                                  emp.role === 'manager'
                                    ? "bg-[#FBF5E6] text-[#9A7A1A] border border-[#E5DCC0]"
                                    : "bg-[#F5F3EE] text-[#6B6965] border border-[#E5E2DB]"
                                )}>
                                  {emp.role}
                                </span>
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                                  emp.isActive
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : "bg-red-50 text-red-700 border border-red-100"
                                )}>
                                  {emp.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pending Overtime Requests */}
            <AnimatePresence>
              {pendingOT.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl border border-[#E5DCC0] shadow-[0_2px_16px_rgba(196,148,38,0.08)] overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FBF5E6] flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-[#C49426]" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-semibold text-[#1C1C1A]">Overtime Requests</h2>
                      <p className="text-[11px] text-[#9A9890]">Pending approval from your department</p>
                    </div>
                    <span className="ml-auto text-[11px] font-bold text-[#C49426] bg-[#FBF5E6] px-2.5 py-1 rounded-full border border-[#E5DCC0]">
                      {pendingOT.length} pending
                    </span>
                  </div>
                  <div className="divide-y divide-[#F5F3EE]">
                    {pendingOT.map((req: any, i: number) => {
                      const initials = req.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                      const workMins = req.workMinutes || 0;
                      const hrs = Math.floor(workMins / 60);
                      const mins = workMins % 60;
                      return (
                        <motion.div
                          key={req._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center justify-between px-6 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                              <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#1C1C1A]">{req.employee?.name}</p>
                              <p className="text-[11px] text-[#9A9890]">
                                {req.employee?.position} · {hrs}h {mins}m worked ·{" "}
                                {req.overtimeRequestedAt ? format(new Date(req.overtimeRequestedAt), "h:mm a") : "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOvertimeAction(req._id, false)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2} />
                              Reject
                            </button>
                            <button
                              onClick={() => handleOvertimeAction(req._id, true)}
                              disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12px] font-semibold text-white bg-[#C49426] hover:bg-[#B48820] transition-colors disabled:opacity-50"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} />
                              Approve
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Today's Department Attendance */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-[#E5E2DB] shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#F0EDE6] flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-[#1C1C1A]">Department Attendance</h2>
                  <p className="text-[12px] text-[#9A9890] mt-0.5">Today's check-ins — {user?.department}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="divide-y divide-[#F5F3EE]">
                {todayAttendance.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-[#9A9890]">
                    No check-ins recorded today for {user?.department}
                  </div>
                ) : (
                  todayAttendance.slice(0, 10).map((record: any, i: number) => {
                    const initials = record.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                    const status = statusConfig[record.status] || { label: record.status, classes: "bg-gray-50 text-gray-700" };
                    const workMins = record.workMinutes || 0;
                    const hrs = Math.floor(workMins / 60);
                    const mins = workMins % 60;

                    return (
                      <motion.div
                        key={record._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-6 py-3.5 hover:bg-[#FAFAF8] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#1C1C1A]">{record.employee?.name}</p>
                            <p className="text-[11px] text-[#9A9890]">{record.employee?.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="text-[12px] font-semibold text-[#1C1C1A]">
                              {record.timeIn ? format(new Date(record.timeIn), "h:mm a") : "—"}
                              {record.timeOut ? ` → ${format(new Date(record.timeOut), "h:mm a")}` : ""}
                            </p>
                            {workMins > 0 && (
                              <p className="text-[11px] text-[#9A9890]">{hrs}h {mins}m worked</p>
                            )}
                          </div>
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
