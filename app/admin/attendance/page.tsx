"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Calendar, Search, Download, Menu, Bell, Clock,
  CheckCircle2, XCircle, AlertCircle, MinusCircle, RefreshCw,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DEPARTMENTS = [
  "Data Analyst", "IT", "HR", "ESL Teacher",
  "Operation", "Customer Support", "Marketing", "WebDev",
];

const STATUS_MAP: Record<string, { icon: any; label: string; cls: string }> = {
  present: { icon: CheckCircle2, label: "Present", cls: "bg-green-50 text-green-700 border-green-100" },
  late: { icon: AlertCircle, label: "Late", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  absent: { icon: XCircle, label: "Absent", cls: "bg-red-50 text-red-600 border-red-100" },
  "half-day": { icon: MinusCircle, label: "Half Day", cls: "bg-blue-50 text-blue-700 border-blue-100" },
};

export default function AttendancePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data, isLoading, mutate } = useSWR(
    `/api/attendance?date=${dateFilter}&department=${deptFilter === "all" ? "" : deptFilter}&search=${search}`,
    fetcher,
    {
      refreshInterval: isLive ? 15000 : 0,
      onSuccess: () => setLastUpdated(new Date()),
    }
  );

  const records = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : [];

  const summary = {
    present: records.filter((r: any) => r.status === "present").length,
    late: records.filter((r: any) => r.status === "late").length,
    absent: records.filter((r: any) => r.status === "absent").length,
    halfDay: records.filter((r: any) => r.status === "half-day").length,
  };

  const summaryCards = [
    { label: "Present", value: summary.present, color: "text-green-700", bg: "bg-green-50", border: "border-green-100", icon: CheckCircle2 },
    { label: "Late", value: summary.late, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100", icon: AlertCircle },
    { label: "Absent", value: summary.absent, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: XCircle },
    { label: "Half Day", value: summary.halfDay, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-100", icon: MinusCircle },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&display=swap');`}</style>
      <div className="min-h-screen bg-[#F5F3EE]">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className={cn("transition-all duration-300 min-h-screen", sidebarOpen ? "ml-[220px]" : "ml-[64px]")}>

          {/* Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-[60px] bg-white border-b border-[#E5E2DB]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] transition-colors"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-[15px] font-semibold text-[#1C1C1A]">Attendance</h1>
                <p className="text-[11px] text-[#9A9890]">
                  {format(new Date(dateFilter), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Live indicator */}
              <button
                onClick={() => setIsLive(!isLive)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-all",
                  isLive
                    ? "bg-green-50 text-green-700 border-green-100"
                    : "bg-[#F5F3EE] text-[#9A9890] border-[#E5E2DB]"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", isLive ? "bg-green-500 animate-pulse" : "bg-[#C2C0BB]")} />
                {isLive ? "Live" : "Paused"}
              </button>
              <button
                onClick={() => mutate()}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6965] hover:bg-[#F5F3EE] border border-[#E5E2DB] transition-colors">
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#6B6965] bg-white border border-[#E5E2DB] rounded-xl hover:bg-[#F5F3EE] transition-colors">
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Export
              </button>
            </div>
          </header>

          <div className="p-6 space-y-4 max-w-[1400px]">

            {/* Last updated */}
            <p className="text-[11px] text-[#9A9890]">
              Last updated: {format(lastUpdated, "h:mm:ss a")}
              {isLive && " · Auto-refreshing every 15s"}
            </p>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summaryCards.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className={cn(
                      "rounded-2xl border px-5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]",
                      s.bg, s.border
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={cn("text-[11px] font-bold uppercase tracking-[0.06em]", s.color)}>{s.label}</p>
                      <Icon className={cn("w-4 h-4", s.color)} strokeWidth={2} />
                    </div>
                    <p className={cn("text-[32px] font-bold leading-none", s.color)}>{s.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-[#E5E2DB] p-4 flex flex-wrap gap-3 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B0AEA9]" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search employee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] placeholder:text-[#C2C0BB] outline-none focus:border-[#C49426] transition-all"
                />
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] transition-all"
              />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-9 px-3 pr-8 rounded-xl border border-[#E5E2DB] bg-[#FAFAF8] text-[13px] text-[#1C1C1A] outline-none focus:border-[#C49426] appearance-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-[#E5E2DB] overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F0EDE6] bg-[#FAFAF8]">
                    {["Employee", "Department", "Status", "Time In", "Time Out", "Duration"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-[#9A9890] uppercase tracking-[0.07em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F3EE]">
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-[#F0EDE6] rounded-lg animate-pulse" style={{ width: j === 0 ? "70%" : "55%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-[13px] text-[#9A9890]">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    records.map((r: any, i: number) => {
                      const status = STATUS_MAP[r.status] || STATUS_MAP.absent;
                      const StatusIcon = status.icon;
                      const initials = r.employee?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                      return (
                        <motion.tr
                          key={r._id || i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-[#FAFAF8] transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FBF5E6] border border-[#E5DCC0] flex items-center justify-center flex-shrink-0">
                                <span className="text-[11px] font-bold text-[#C49426]">{initials}</span>
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-[#1C1C1A]">{r.employee?.name || r.name}</p>
                                <p className="text-[11px] text-[#9A9890]">{r.employee?.email || r.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[13px] text-[#6B6965]">{r.employee?.department || r.department}</td>
                          <td className="px-5 py-3.5">
                            <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border", status.cls)}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-[13px] text-[#1C1C1A]">
                              <Clock className="w-3.5 h-3.5 text-[#9A9890]" strokeWidth={2} />
                              {r.timeIn ? format(new Date(r.timeIn), "h:mm a") : "—"}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 text-[13px] text-[#1C1C1A]">
                              <Clock className="w-3.5 h-3.5 text-[#9A9890]" strokeWidth={2} />
                              {r.timeOut ? format(new Date(r.timeOut), "h:mm a") : "—"}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-[13px] text-[#6B6965]">{r.duration || "—"}</td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}